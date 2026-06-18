import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, centersTable, notificationsTable, applicationsTable, applicationStepsTable, servicesTable, examsTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();
const EXAM_REBOOK_WAIT_DAYS = 14;
const PRACTICAL_AFTER_THEORY_WAIT_DAYS = 7;

const STAGE_AFTER_BOOKING: Record<string, { status: string; currentStep: string; stepKey: string }> = {
  MEDICAL_TEST: { status: "MEDICAL_APPOINTMENT_BOOKED", currentStep: "MEDICAL_APPOINTMENT_BOOKED", stepKey: "MEDICAL_TEST" },
  VISION_TEST: { status: "MEDICAL_APPOINTMENT_BOOKED", currentStep: "MEDICAL_APPOINTMENT_BOOKED", stepKey: "MEDICAL_TEST" },
  THEORY_EXAM: { status: "THEORY_APPOINTMENT_BOOKED", currentStep: "THEORY_APPOINTMENT_BOOKED", stepKey: "THEORY_EXAM" },
  PRACTICAL_EXAM: { status: "PRACTICAL_APPOINTMENT_BOOKED", currentStep: "PRACTICAL_APPOINTMENT_BOOKED", stepKey: "PRACTICAL_EXAM" },
};

function isPastSlot(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hour = 9, minute = 0] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutesToAdd;
  const nextHour = Math.floor(total / 60) % 24;
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}

function addDays(dateValue: Date, days: number) {
  const next = new Date(dateValue);
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

router.get("/appointments/slots", requireAuth, async (req, res) => {
  const { centerId, date } = req.query as { centerId?: string; date?: string; type?: string };
  if (!centerId || !date) { res.status(400).json({ message: "centerId and date are required" }); return; }
  const starts = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"];
  const booked = await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.centerId, centerId), eq(appointmentsTable.appointmentDate, date), eq(appointmentsTable.status, "BOOKED")));
  const slots = starts.map((start) => {
    const bookedCount = booked.filter((apt) => apt.startTime === start).length;
    const capacity = 5;
    return { startTime: start, endTime: addMinutes(start, 30), capacity, booked: bookedCount, available: !isPastSlot(date, start) && bookedCount < capacity };
  });
  res.json(slots);
});

router.get("/appointments", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const apts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.userId, userId));
  const withCenter = await Promise.all(apts.map(async (apt) => {
    if (!apt.centerId) return { ...apt, center: null };
    const [center] = await db.select().from(centersTable).where(eq(centersTable.id, apt.centerId)).limit(1);
    return { ...apt, center: center ?? null };
  }));
  res.json(withCenter);
});

router.post("/appointments", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId, centerId, notes } = req.body;
  const appointmentType = req.body.appointmentType ?? req.body.type;
  const appointmentDate = req.body.appointmentDate ?? req.body.date;
  const startTime = req.body.startTime ?? req.body.timeSlot;
  const endTime = req.body.endTime ?? (typeof startTime === "string" ? addMinutes(startTime, 30) : undefined);
  if (!applicationId || !appointmentType || !appointmentDate || !startTime || !endTime) {
    res.status(400).json({ message: "Missing required fields" }); return;
  }
  if (isPastSlot(appointmentDate, startTime)) {
    res.status(409).json({ message: "Cannot book a past time slot" }); return;
  }
  const [app] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
  const isRenewalMedical = service?.code === "RENEW_DRIVING_LICENSE" && appointmentType === "MEDICAL_TEST";
  if (appointmentType === "MEDICAL_TEST") {
    const allowedStatuses = isRenewalMedical ? ["RENEWAL_SUBMITTED", "RENEWAL_MEDICAL_BOOKING"] : ["SECURITY_APPROVED", "MEDICAL_BOOKING"];
    const allowedSteps = isRenewalMedical ? ["RENEWAL_MEDICAL_BOOKING"] : ["MEDICAL_BOOKING"];
    if (!allowedStatuses.includes(app.status) && !allowedSteps.includes(app.currentStep ?? "")) {
      res.status(409).json({ message: "Application is not ready for medical/vision test booking" }); return;
    }
  }
  if (appointmentType === "VISION_TEST" && !["SECURITY_APPROVED", "MEDICAL_BOOKING"].includes(app.status) && app.currentStep !== "MEDICAL_BOOKING") {
    res.status(409).json({ message: "Application is not ready for medical/vision test booking" }); return;
  }
  if (appointmentType === "THEORY_EXAM" && app.status !== "MEDICAL_PASSED" && app.status !== "THEORY_FAILED" && app.currentStep !== "THEORY_BOOKING") {
    res.status(409).json({ message: "Application is not ready for theory exam booking" }); return;
  }
  if (appointmentType === "THEORY_EXAM" && app.status === "THEORY_FAILED") {
    const [latestFailed] = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, applicationId), eq(examsTable.examType, "THEORY"), eq(examsTable.result, "FAILED"))).orderBy(desc(examsTable.createdAt)).limit(1);
    const earliest = latestFailed ? addDays(latestFailed.examDate, EXAM_REBOOK_WAIT_DAYS) : null;
    if (earliest && dateOnly(appointmentDate) < earliest) {
      res.status(409).json({ message: `Theory exam can be rebooked from ${earliest.toISOString().slice(0, 10)}` }); return;
    }
  }
  if (appointmentType === "PRACTICAL_EXAM" && app.status !== "THEORY_PASSED" && app.status !== "PRACTICAL_FAILED" && app.currentStep !== "PRACTICAL_BOOKING") {
    res.status(409).json({ message: "Application is not ready for practical exam booking" }); return;
  }
  if (appointmentType === "PRACTICAL_EXAM" && app.status !== "PRACTICAL_FAILED") {
    const [latestPassedTheory] = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, applicationId), eq(examsTable.examType, "THEORY"), eq(examsTable.result, "PASSED"))).orderBy(desc(examsTable.examDate)).limit(1);
    const earliest = latestPassedTheory ? addDays(latestPassedTheory.examDate, PRACTICAL_AFTER_THEORY_WAIT_DAYS) : null;
    if (!earliest) {
      res.status(409).json({ message: "A passed theory exam is required before booking the practical exam" }); return;
    }
    if (dateOnly(appointmentDate) < earliest) {
      res.status(409).json({ message: `Practical exam can be booked from ${earliest.toISOString().slice(0, 10)}` }); return;
    }
  }
  if (appointmentType === "PRACTICAL_EXAM" && app.status === "PRACTICAL_FAILED") {
    const [latestFailed] = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, applicationId), eq(examsTable.examType, "PRACTICAL"), eq(examsTable.result, "FAILED"))).orderBy(desc(examsTable.createdAt)).limit(1);
    const earliest = latestFailed ? addDays(latestFailed.examDate, EXAM_REBOOK_WAIT_DAYS) : null;
    if (earliest && dateOnly(appointmentDate) < earliest) {
      res.status(409).json({ message: `Practical exam can be rebooked from ${earliest.toISOString().slice(0, 10)}` }); return;
    }
  }
  const activeSameStage = await db.select().from(appointmentsTable).where(and(
    eq(appointmentsTable.applicationId, applicationId),
    eq(appointmentsTable.appointmentType, appointmentType),
    eq(appointmentsTable.status, "BOOKED")
  )).limit(1);
  if (activeSameStage.length > 0) {
    res.status(409).json({ message: "An active appointment already exists for this stage" }); return;
  }
  if (centerId) {
    const sameSlot = await db.select().from(appointmentsTable).where(and(
      eq(appointmentsTable.centerId, centerId),
      eq(appointmentsTable.appointmentDate, appointmentDate),
      eq(appointmentsTable.startTime, startTime),
      eq(appointmentsTable.status, "BOOKED")
    ));
    if (sameSlot.length >= 5) {
      res.status(409).json({ message: "Selected slot is full" }); return;
    }
  }
  const queueNumber = Math.floor(Math.random() * 50) + 1;
  const [apt] = await db.insert(appointmentsTable).values({
    userId,
    applicationId,
    centerId: centerId ?? null,
    appointmentType,
    appointmentDate,
    startTime,
    endTime,
    queueNumber,
    status: "BOOKED",
    notes,
  }).returning();
  const notificationByType: Record<string, { title: string; message: string }> = {
    MEDICAL_TEST: {
      title: "Medical/vision test appointment booked successfully",
      message: `Medical/vision test appointment booked successfully. تمت حجز موعد فحص النظر بنجاح. Date: ${appointmentDate}, time: ${startTime}. Queue: ${queueNumber}`,
    },
    THEORY_EXAM: {
      title: "Theory exam appointment booked successfully",
      message: `Theory exam appointment booked successfully. تم حجز موعد الامتحان النظري بنجاح. Date: ${appointmentDate}, time: ${startTime}. Queue: ${queueNumber}`,
    },
    PRACTICAL_EXAM: {
      title: "Practical exam appointment booked successfully",
      message: `Practical exam appointment booked successfully. تم حجز موعد الامتحان العملي بنجاح. Date: ${appointmentDate}, time: ${startTime}. Queue: ${queueNumber}`,
    },
  };
  const notification = isRenewalMedical
    ? {
        title: "Renewal medical/vision appointment booked successfully",
        message: `Renewal medical/vision appointment booked successfully. تم حجز موعد فحص النظر للتجديد بنجاح. Date: ${appointmentDate}, time: ${startTime}. Queue: ${queueNumber}`,
      }
    : notificationByType[appointmentType] ?? notificationByType.MEDICAL_TEST;
  await db.insert(notificationsTable).values({ userId, ...notification, type: "SUCCESS" });
  const transition = isRenewalMedical
    ? { status: "RENEWAL_MEDICAL_BOOKED", currentStep: "RENEWAL_MEDICAL_BOOKED", stepKey: "MEDICAL_TEST" }
    : STAGE_AFTER_BOOKING[appointmentType];
  if (transition) {
    await db.update(applicationsTable).set({ status: transition.status, currentStep: transition.currentStep, updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId));
    await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, transition.stepKey)));
    await db.insert(auditLogsTable).values({ actorUserId: userId, action: `BOOK_${appointmentType}`, entityType: "application", entityId: applicationId, newValue: { status: transition.status, currentStep: transition.currentStep, appointmentId: apt.id } });
  }
  const [center] = centerId ? await db.select().from(centersTable).where(eq(centersTable.id, centerId)).limit(1) : [null];
  res.status(201).json({ ...apt, center: center ?? null });
});

async function cancelAppointment(req: Request, res: Response) {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [apt] = await db.update(appointmentsTable).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(appointmentsTable.id, routeParam(req, "id")), eq(appointmentsTable.userId, userId))).returning();
  if (!apt) { res.status(404).json({ message: "Appointment not found" }); return; }
  res.json(apt);
}

router.post("/appointments/:id/cancel", requireAuth, cancelAppointment);
router.delete("/appointments/:id", requireAuth, cancelAppointment);

export default router;
