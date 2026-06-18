import { Router } from "express";
import { db } from "@workspace/db";
import {
  appointmentsTable, usersTable, userProfilesTable, centerOfficersTable,
  centersTable, applicationsTable, trainingRecordsTable, medicalTestsTable,
  examsTable, notificationsTable, licenseCategoriesTable, applicationStepsTable,
  servicesTable, drivingLicensesTable, auditLogsTable
} from "@workspace/db";
import { eq, and, count, sql, inArray, desc } from "drizzle-orm";
import { requireAuth, requireAnyOfficerOrAdmin, JwtPayload } from "../middlewares/auth";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-params";
import { getLicenseWithCategory, issueLicenseForApplication } from "../services/license-issuance";

const router = Router();
const PASS_THRESHOLD = 70;
const PRACTICAL_WEIGHTS: Record<string, number> = {
  seatbelt_mirrors: 8,
  traffic_signals: 12,
  vehicle_control: 12,
  correct_parking: 10,
  parallel_parking: 8,
  reverse: 8,
  lane_discipline: 8,
  safe_distance: 6,
  use_signals: 8,
  mirror_check: 6,
  smooth_braking: 6,
  hill_start: 4,
  pedestrian_awareness: 4,
};

const ROLE_STAGE: Record<string, { statuses: string[]; label: string }> = {
  MEDICAL_OFFICER: { statuses: ["MEDICAL_APPOINTMENT_BOOKED", "RENEWAL_MEDICAL_BOOKED"], label: "medical" },
  MEDICAL_CENTER_OFFICER: { statuses: ["MEDICAL_APPOINTMENT_BOOKED", "RENEWAL_MEDICAL_BOOKED"], label: "medical" },
  THEORY_OFFICER: { statuses: ["THEORY_APPOINTMENT_BOOKED"], label: "theory" },
  THEORY_EXAM_OFFICER: { statuses: ["THEORY_APPOINTMENT_BOOKED"], label: "theory" },
  PRACTICAL_OFFICER: { statuses: ["PRACTICAL_APPOINTMENT_BOOKED"], label: "practical" },
  PRACTICAL_EXAM_OFFICER: { statuses: ["PRACTICAL_APPOINTMENT_BOOKED"], label: "practical" },
  ADMIN: { statuses: [], label: "admin" },
  DVLD_OFFICER: { statuses: [], label: "admin" },
};

function assertRole(req: Request, res: Response, roles: string[]) {
  const role = (req as Request & { user: JwtPayload }).user.role;
  if (!roles.includes(role)) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}

async function getOfficerCenter(userId: string) {
  const [co] = await db.select().from(centerOfficersTable).where(and(eq(centerOfficersTable.userId, userId), eq(centerOfficersTable.isActive, true))).limit(1);
  if (!co) return null;
  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, co.centerId)).limit(1);
  return center ?? null;
}

async function getOfficerAccessibleCenters(userId: string, role: string) {
  const primaryCenter = await getOfficerCenter(userId);
  if (!primaryCenter) return { primaryCenter: null, centers: [] as Array<typeof centersTable.$inferSelect> };

  const aliasesByRole: Record<string, string[]> = {
    MEDICAL_OFFICER: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
    MEDICAL_CENTER_OFFICER: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
    THEORY_OFFICER: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER"],
    THEORY_EXAM_OFFICER: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER"],
    PRACTICAL_OFFICER: ["PRACTICAL_EXAM_CENTER", "PRACTICAL_EXAM", "PRACTICAL_CENTER"],
    PRACTICAL_EXAM_OFFICER: ["PRACTICAL_EXAM_CENTER", "PRACTICAL_EXAM", "PRACTICAL_CENTER"],
    TRAINING_CENTER_OFFICER: ["TRAINING", "TRAINING_CENTER"],
  };
  const aliases = aliasesByRole[role];
  if (!aliases) return { primaryCenter, centers: [primaryCenter] };

  const centers = await db.select().from(centersTable).where(and(
    eq(centersTable.isActive, true),
    eq(centersTable.governorate, primaryCenter.governorate),
    inArray(centersTable.centerType, aliases),
  ));
  return { primaryCenter, centers: centers.length ? centers : [primaryCenter] };
}

function centerFilter(centerIds: string[]) {
  return centerIds.length === 1 ? eq(appointmentsTable.centerId, centerIds[0]) : inArray(appointmentsTable.centerId, centerIds);
}

function addYears(dateValue: string | Date | null | undefined, years: number) {
  const base = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const start = Number.isNaN(base.getTime()) || base < new Date() ? new Date() : base;
  start.setFullYear(start.getFullYear() + years);
  return start.toISOString().slice(0, 10);
}

router.get("/officer/dashboard", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId, role } = (req as Request & { user: JwtPayload }).user;
  const { primaryCenter: center, centers } = await getOfficerAccessibleCenters(userId, role);
  const centerIds = centers.map((item) => item.id);
  let todayAppointments = 0, pendingAppointments = 0, completedToday = 0, recentAppointments: unknown[] = [];
  if (centerIds.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const allTodayApts = await db.select().from(appointmentsTable).where(and(centerFilter(centerIds), eq(appointmentsTable.appointmentDate, today)));
    todayAppointments = allTodayApts.length;
    pendingAppointments = allTodayApts.filter((a) => a.status === "BOOKED").length;
    completedToday = allTodayApts.filter((a) => a.status === "COMPLETED").length;
    const recent = await db.select().from(appointmentsTable)
      .where(and(centerFilter(centerIds), eq(appointmentsTable.status, "BOOKED")))
      .orderBy(desc(appointmentsTable.appointmentDate), desc(appointmentsTable.startTime))
      .limit(10);
    recentAppointments = await Promise.all(recent.map(async (apt) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, apt.userId)).limit(1);
      const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, apt.userId)).limit(1);
      const [application] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, apt.applicationId)).limit(1);
      const [service] = application?.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, application.serviceId)).limit(1) : [null];
      return { ...apt, user: user ?? null, profile: profile ?? null, application: application ? { ...application, service: service ?? null } : null };
    }));
  }
  res.json({ center, todayAppointments, pendingAppointments, completedToday, recentAppointments });
});

router.get("/officer/appointments", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId, role } = (req as Request & { user: JwtPayload }).user;
  const { primaryCenter: center, centers } = await getOfficerAccessibleCenters(userId, role);
  const centerIds = centers.map((item) => item.id);
  if (!center || centerIds.length === 0) { res.json([]); return; }
  const apts = await db.select().from(appointmentsTable).where(centerFilter(centerIds)).limit(100);
  const withUser = await Promise.all(apts.map(async (apt) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, apt.userId)).limit(1);
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, apt.userId)).limit(1);
    const [application] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, apt.applicationId)).limit(1);
    return { ...apt, center, user: user ?? null, profile: profile ?? null, application: application ?? null };
  }));
  res.json(withUser);
});

router.get("/officer/applications/search", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { nationalId } = req.query as { nationalId?: string };
  const role = (req as Request & { user: JwtPayload }).user.role;
  if (!nationalId) { res.status(400).json({ message: "nationalId is required" }); return; }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.nationalId, nationalId)).limit(1);
  if (!profile) { res.json([]); return; }

  const conditions = [eq(applicationsTable.userId, profile.userId)];
  const apps = await db.select().from(applicationsTable).where(and(...conditions)).orderBy(desc(applicationsTable.createdAt));
  const data = await Promise.all(apps.map(async (app) => {
    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, app.userId)).limit(1);
    const [licenseCategory] = app.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, app.licenseCategoryId)).limit(1) : [null];
    const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
    const [currentLicense] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.userId, app.userId)).orderBy(desc(drivingLicensesTable.createdAt)).limit(1);
    const appointmentsRaw = await db.select().from(appointmentsTable).where(eq(appointmentsTable.applicationId, app.id));
    const appointments = await Promise.all(appointmentsRaw.map(async (appointment) => {
      if (!appointment.centerId) return { ...appointment, center: null };
      const [center] = await db.select().from(centersTable).where(eq(centersTable.id, appointment.centerId)).limit(1);
      return { ...appointment, center: center ?? null };
    }));
    const [medicalTest] = await db.select().from(medicalTestsTable).where(eq(medicalTestsTable.applicationId, app.id)).limit(1);
    const exams = await db.select().from(examsTable).where(eq(examsTable.applicationId, app.id));
    return { ...app, user: user ?? null, profile, licenseCategory: licenseCategory ?? null, service: service ?? null, currentLicense: currentLicense ?? null, appointments, medicalTest: medicalTest ?? null, exams };
  }));
  const visibleData = data.filter((app) => {
    const roleStage = ROLE_STAGE[role];
    if (!roleStage || roleStage.label === "admin") return true;
    const appointmentTypes = app.appointments.map((appointment) => appointment.appointmentType);
    const examTypes = app.exams.map((exam) => exam.examType);
    if (roleStage.label === "medical") {
      return roleStage.statuses.includes(app.status)
        || ["MEDICAL_PASSED", "MEDICAL_REJECTED", "RENEWAL_MEDICAL_REJECTED", "LICENSE_RENEWED"].includes(app.status)
        || appointmentTypes.includes("MEDICAL_TEST")
        || Boolean(app.medicalTest);
    }
    if (roleStage.label === "theory") {
      return roleStage.statuses.includes(app.status)
        || ["THEORY_PASSED", "THEORY_FAILED"].includes(app.status)
        || appointmentTypes.includes("THEORY_EXAM")
        || examTypes.includes("THEORY");
    }
    if (roleStage.label === "practical") {
      return roleStage.statuses.includes(app.status)
        || ["PRACTICAL_FAILED", "LICENSE_ISSUED"].includes(app.status)
        || appointmentTypes.includes("PRACTICAL_EXAM")
        || examTypes.includes("PRACTICAL");
    }
    return false;
  });
  res.json(visibleData);
});

async function updateAppointmentStatus(req: Request, res: Response) {
  const { status, notes } = req.body;
  const [apt] = await db.update(appointmentsTable).set({ status, notes, updatedAt: new Date() }).where(eq(appointmentsTable.id, routeParam(req, "id"))).returning();
  if (!apt) { res.status(404).json({ message: "Appointment not found" }); return; }
  res.json(apt);
}

router.patch("/officer/appointments/:id/update", requireAuth, requireAnyOfficerOrAdmin, updateAppointmentStatus);
router.put("/officer/appointments/:id/update", requireAuth, requireAnyOfficerOrAdmin, updateAppointmentStatus);
router.put("/officer/appointments/:id/status", requireAuth, requireAnyOfficerOrAdmin, updateAppointmentStatus);

async function updateTraining(req: Request, res: Response) {
  const { theoreticalLessonsCompleted, practicalLessonsCompleted, status, instructorName, notes } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (theoreticalLessonsCompleted !== undefined) updateData.theoreticalLessonsCompleted = theoreticalLessonsCompleted;
  if (practicalLessonsCompleted !== undefined) updateData.practicalLessonsCompleted = practicalLessonsCompleted;
  if (status) {
    updateData.status = status;
    if (status === "IN_PROGRESS" && !updateData.startedAt) updateData.startedAt = new Date();
    if (status === "COMPLETED") updateData.completedAt = new Date();
  }
  if (instructorName) updateData.instructorName = instructorName;
  if (notes) updateData.notes = notes;
  const [record] = await db.update(trainingRecordsTable).set(updateData).where(eq(trainingRecordsTable.applicationId, routeParam(req, "applicationId"))).returning();
  if (!record) { res.status(404).json({ message: "Training record not found" }); return; }
  if (status === "COMPLETED") {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, record.applicationId)).limit(1);
    if (app) {
      await db.update(applicationsTable).set({ status: "TRAINING_COMPLETED", currentStep: "MEDICAL_TEST", updatedAt: new Date() }).where(eq(applicationsTable.id, app.id));
      await db.insert(notificationsTable).values({ userId: app.userId, title: "تم الانتهاء من التدريب", message: "تهانينا! لقد أنهيت مرحلة التدريب. يرجى حجز موعد الفحص الطبي.", type: "SUCCESS" });
    }
  }
  res.json(record);
}

router.patch("/officer/training/:applicationId/update", requireAuth, requireAnyOfficerOrAdmin, updateTraining);
router.put("/officer/training/:applicationId/update", requireAuth, requireAnyOfficerOrAdmin, updateTraining);
router.put("/officer/training/:applicationId", requireAuth, requireAnyOfficerOrAdmin, updateTraining);

async function recordMedical(req: Request, res: Response) {
  if (!assertRole(req, res, ["MEDICAL_OFFICER", "MEDICAL_CENTER_OFFICER", "ADMIN"])) return;
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId = routeParam(req, "applicationId"), centerId, result, leftEyeScore, rightEyeScore, requiresGlasses, isAllowedToDrive, notes } = req.body;
  const allowedResults = ["DOES_NOT_NEED_GLASSES", "NEEDS_GLASSES", "NOT_FIT_TO_DRIVE", "APPROVED_NO_GLASSES", "APPROVED_NEEDS_GLASSES", "NOT_APPROVED_NOT_FIT", "PASS_NO_GLASSES", "PASS_WITH_GLASSES"];
  if (!allowedResults.includes(result)) {
    res.status(400).json({ message: "A valid medical result is required" });
    return;
  }
  const normalizedResult = result === "APPROVED_NO_GLASSES" || result === "PASS_NO_GLASSES"
    ? "DOES_NOT_NEED_GLASSES"
    : result === "APPROVED_NEEDS_GLASSES" || result === "PASS_WITH_GLASSES"
    ? "NEEDS_GLASSES"
    : result === "NOT_APPROVED_NOT_FIT"
    ? "NOT_FIT_TO_DRIVE"
    : result;
  if (normalizedResult === "NOT_FIT_TO_DRIVE" && !String(notes ?? "").trim()) {
    res.status(400).json({ message: "Notes are required when the citizen is not fit to drive" });
    return;
  }
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
  const isRenewal = service?.code === "RENEW_DRIVING_LICENSE";
  const validMedicalStages = isRenewal
    ? ["RENEWAL_MEDICAL_BOOKING", "RENEWAL_MEDICAL_BOOKED", "MEDICAL_APPOINTMENT_BOOKED", "LICENSE_RENEWED", "RENEWAL_MEDICAL_REJECTED"]
    : ["MEDICAL_APPOINTMENT_BOOKED", "MEDICAL_PASSED", "MEDICAL_REJECTED", "THEORY_BOOKING", "THEORY_APPOINTMENT_BOOKED", "THEORY_PASSED", "PRACTICAL_BOOKING", "PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_FAILED", "LICENSE_ISSUED"];
  if (!validMedicalStages.includes(app.status) && !validMedicalStages.includes(app.currentStep ?? "")) {
    res.status(409).json({ message: "Application is not in the medical/vision stage" });
    return;
  }
  const [bookedAppointment] = await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.applicationId, applicationId), eq(appointmentsTable.appointmentType, "MEDICAL_TEST"), eq(appointmentsTable.status, "BOOKED"))).limit(1);
  const [latestAppointment] = bookedAppointment ? [bookedAppointment] : await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.applicationId, applicationId), eq(appointmentsTable.appointmentType, "MEDICAL_TEST"))).orderBy(desc(appointmentsTable.updatedAt)).limit(1);
  const appointment = bookedAppointment ?? latestAppointment;
  const [test] = await db.insert(medicalTestsTable).values({
    applicationId,
    centerId: centerId ?? appointment?.centerId ?? null,
    officerId,
    result: normalizedResult,
    leftEyeScore,
    rightEyeScore,
    requiresGlasses: requiresGlasses ?? normalizedResult === "NEEDS_GLASSES",
    isAllowedToDrive: isAllowedToDrive ?? normalizedResult !== "NOT_FIT_TO_DRIVE",
    notes,
  }).returning();
  const passed = ["DOES_NOT_NEED_GLASSES", "NEEDS_GLASSES"].includes(normalizedResult);

  if (isRenewal) {
    let updatedApp: typeof applicationsTable.$inferSelect | null = null;
    let renewedLicense: typeof drivingLicensesTable.$inferSelect | null = null;
    if (passed) {
      const [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.userId, app.userId)).orderBy(desc(drivingLicensesTable.createdAt)).limit(1);
      if (!license) {
        res.status(404).json({ message: "No current driving license found for renewal" });
        return;
      }
      const newExpiry = addYears(license.expiryDate, 10);
      [renewedLicense] = await db.update(drivingLicensesTable).set({ expiryDate: newExpiry, status: "ACTIVE" }).where(eq(drivingLicensesTable.id, license.id)).returning();
      [updatedApp] = await db.update(applicationsTable).set({ status: "LICENSE_RENEWED", currentStep: "LICENSE_RENEWED", completedAt: new Date(), updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId)).returning();
    } else {
      [updatedApp] = await db.update(applicationsTable).set({ status: "RENEWAL_MEDICAL_REJECTED", currentStep: "RENEWAL_MEDICAL_REJECTED", updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId)).returning();
    }
    if (appointment) await db.update(appointmentsTable).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(appointmentsTable.id, appointment.id));
    await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "MEDICAL_TEST")));
    await db.insert(notificationsTable).values({
      userId: app.userId,
      title: passed ? "Driving license renewed" : "Renewal medical result rejected",
      message: passed
        ? "Your driving license has been renewed successfully. تم تجديد رخصة القيادة بنجاح."
        : "Your medical/vision test result does not allow renewing your driving license. نتيجة فحص النظر لا تسمح بتجديد رخصة القيادة.",
      type: passed ? "SUCCESS" : "ERROR",
    });
    res.status(201).json({ medicalTest: test, application: updatedApp, license: await getLicenseWithCategory(renewedLicense) });
    return;
  }

  const newStatus = passed ? "MEDICAL_PASSED" : "MEDICAL_REJECTED";
  await db.update(applicationsTable).set({ status: newStatus, currentStep: passed ? "THEORY_BOOKING" : "MEDICAL_REJECTED", updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId));
  if (appointment) await db.update(appointmentsTable).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(appointmentsTable.id, appointment.id));
  await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "MEDICAL_TEST")));
  if (passed) await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "THEORY_EXAM")));
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: passed ? "Medical/vision test completed" : "Medical/vision test result rejected",
    message: passed
      ? "Medical/vision test completed. You can now book your theory exam. تم إكمال فحص النظر. يمكنك الآن حجز موعد الامتحان النظري."
      : "Your medical/vision test result does not allow continuing the driving license process. نتيجة فحص النظر لا تسمح باستكمال إجراءات رخصة القيادة.",
    type: passed ? "SUCCESS" : "ERROR",
  });
  await db.insert(auditLogsTable).values({
    actorUserId: officerId,
    action: passed ? "VISION_PASSED" : "VISION_UNFIT",
    entityType: "application",
    entityId: applicationId,
    newValue: { status: newStatus, currentStep: passed ? "THEORY_BOOKING" : "MEDICAL_REJECTED", result: normalizedResult },
  });
  res.status(201).json(test);
}

router.post("/officer/medical/record", requireAuth, requireAnyOfficerOrAdmin, recordMedical);
router.post("/officer/medical/:applicationId", requireAuth, requireAnyOfficerOrAdmin, recordMedical);

async function recordExam(req: Request, res: Response) {
  const requestedType = req.body.examType;
  if (requestedType === "THEORY" && !assertRole(req, res, ["THEORY_EXAM_OFFICER", "THEORY_OFFICER", "ADMIN"])) return;
  if (requestedType === "PRACTICAL" && !assertRole(req, res, ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER", "ADMIN"])) return;
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId = routeParam(req, "applicationId"), centerId, examType, score, maxScore, notes, verification } = req.body;
  let { result } = req.body;
  if (!applicationId) { res.status(400).json({ message: "applicationId is required" }); return; }
  if (!["THEORY", "PRACTICAL"].includes(examType)) { res.status(400).json({ message: "A valid examType is required" }); return; }
  if (examType !== "THEORY" && !["PASSED", "FAILED"].includes(result)) { res.status(400).json({ message: "A valid result is required" }); return; }
  if (score !== undefined && score !== null) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      res.status(400).json({ message: "Score must be between 0 and 100" });
      return;
    }
  }
  if (examType === "THEORY") {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) {
      res.status(400).json({ message: "Theory score is required" });
      return;
    }
    result = numericScore >= PASS_THRESHOLD ? "PASSED" : "FAILED";
  }
  if (result === "FAILED" && !String(notes ?? "").trim()) {
    res.status(400).json({ message: "Notes are required when the result is failed" });
    return;
  }
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  if (examType === "THEORY") {
    const isTheoryStage = ["THEORY_APPOINTMENT_BOOKED", "THEORY_PASSED", "THEORY_FAILED", "PRACTICAL_BOOKING", "PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_FAILED", "LICENSE_ISSUED"].includes(app.status)
      || ["THEORY_APPOINTMENT_BOOKED", "THEORY_BOOKING", "PRACTICAL_BOOKING", "PRACTICAL_APPOINTMENT_BOOKED", "LICENSE_ISSUANCE"].includes(app.currentStep ?? "");
    if (!isTheoryStage) {
      res.status(409).json({ message: "Application is not in the theory exam stage" });
      return;
    }
    const requiredVerification = ["photoMatched", "nationalIdVerified", "eligibleForTheory", "medicalCompleted"];
    if (!verification || requiredVerification.some((key) => verification[key] !== true)) {
      res.status(400).json({ message: "All theory exam verification checks are required" });
      return;
    }
  }
  if (examType === "PRACTICAL" && !["PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_FAILED", "LICENSE_ISSUED"].includes(app.status) && !["PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_BOOKING", "LICENSE_ISSUANCE"].includes(app.currentStep ?? "")) {
    res.status(409).json({ message: "Application is not in the practical exam stage" });
    return;
  }
  if (examType === "PRACTICAL") {
    const requiredVerification = ["photoMatched", "nationalIdVerified", "eligibleForPractical", "theoryPassed"];
    if (!verification || requiredVerification.some((key) => verification[key] !== true)) {
      res.status(400).json({ message: "All practical exam verification checks are required" });
      return;
    }
  }
  const appointmentType = examType === "THEORY" ? "THEORY_EXAM" : "PRACTICAL_EXAM";
  const [bookedAppointment] = await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.applicationId, applicationId), eq(appointmentsTable.appointmentType, appointmentType), eq(appointmentsTable.status, "BOOKED"))).limit(1);
  const [latestAppointment] = bookedAppointment ? [bookedAppointment] : await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.applicationId, applicationId), eq(appointmentsTable.appointmentType, appointmentType))).orderBy(desc(appointmentsTable.updatedAt)).limit(1);
  const appointment = bookedAppointment ?? latestAppointment;
  const prevExams = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, applicationId), eq(examsTable.examType, examType)));
  const [exam] = await db.insert(examsTable).values({
    applicationId,
    centerId: centerId ?? appointment?.centerId ?? null,
    officerId,
    examType,
    score: score?.toString(),
    maxScore: (maxScore ?? 100)?.toString(),
    result,
    attemptNumber: prevExams.length + 1,
    notes,
  }).returning();
  const passed = result === "PASSED";
  let newStatus = app.status, newStep = app.currentStep;
  if (examType === "THEORY") {
    newStatus = passed ? "THEORY_PASSED" : "THEORY_FAILED";
    newStep = passed ? "PRACTICAL_BOOKING" : "THEORY_BOOKING";
    await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: passed ? new Date() : null }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "THEORY_EXAM")));
    if (passed) await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "PRACTICAL_EXAM")));
  } else if (examType === "PRACTICAL") {
    newStatus = passed ? "LICENSE_ISSUED" : "PRACTICAL_FAILED";
    newStep = passed ? "LICENSE_ISSUANCE" : "PRACTICAL_BOOKING";
    await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: passed ? new Date() : null, notes: passed ? "Practical exam passed." : "Practical exam failed." }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "PRACTICAL_EXAM")));
    if (passed) await db.update(applicationStepsTable).set({ status: "COMPLETED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "LICENSE_ISSUANCE")));
  }
  await db.update(applicationsTable).set({ status: newStatus, currentStep: newStep, updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId));
  if (appointment) await db.update(appointmentsTable).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(appointmentsTable.id, appointment.id));
  let failedPracticalItems = "";
  if (examType === "PRACTICAL" && !passed) {
    try {
      const parsed = JSON.parse(String(notes ?? "{}"));
      const unchecked = Array.isArray(parsed.checklist) ? parsed.checklist.filter((item: any) => !item.checked) : [];
      failedPracticalItems = unchecked.map((item: any) => item.labelAr ?? item.labelEn ?? item.label ?? item.key).filter(Boolean).join(", ");
    } catch {
      failedPracticalItems = "";
    }
  }
  const failedExamDate = new Date(exam.examDate);
  failedExamDate.setUTCHours(0, 0, 0, 0);
  failedExamDate.setUTCDate(failedExamDate.getUTCDate() + 14);
  const earliestRebookingDate = failedExamDate.toISOString().slice(0, 10);
  const theoryMessage = passed
    ? "You passed the theory exam. You can now book your practical exam. لقد نجحت في الامتحان النظري. يمكنك الآن حجز موعد الامتحان العملي."
    : `You did not pass the theory exam. You can choose another appointment on or after ${earliestRebookingDate}. لم تجتز الامتحان النظري. يمكنك اختيار موعد جديد بتاريخ ${earliestRebookingDate} أو بعده.`;
  const practicalMessage = passed
    ? "Congratulations, you passed the practical exam. Your license is ready for issuance. مبارك، لقد نجحت في الامتحان العملي. رخصتك جاهزة للإصدار."
    : `You did not pass the practical exam. You can choose another appointment on or after ${earliestRebookingDate}. Failed items: ${failedPracticalItems || "See examiner notes"}. لم تجتز الامتحان العملي. يمكنك اختيار موعد جديد بتاريخ ${earliestRebookingDate} أو بعده. أسباب الرسوب: ${failedPracticalItems || "يرجى مراجعة ملاحظات الفاحص"}`;
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: examType === "THEORY" ? (passed ? "Theory exam passed" : "Theory exam failed") : (passed ? "Practical exam passed" : "Practical exam failed"),
    message: examType === "THEORY" ? theoryMessage : practicalMessage,
    type: passed ? "SUCCESS" : "ERROR",
  });
  await db.insert(auditLogsTable).values({
    actorUserId: officerId,
    action: `${examType}_${passed ? "PASSED" : "FAILED"}`,
    entityType: "application",
    entityId: applicationId,
    newValue: { status: newStatus, currentStep: newStep, score, result },
  });
  if (examType === "PRACTICAL" && passed) {
    const license = await issueLicenseForApplication(applicationId, officerId);
    const [updatedApplication] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
    res.status(201).json({ exam, application: updatedApplication ?? null, license: await getLicenseWithCategory(license) });
    return;
  }
  if (examType === "PRACTICAL" && !passed) {
    await db.update(drivingLicensesTable).set({ status: "CANCELLED" }).where(eq(drivingLicensesTable.applicationId, applicationId));
  }
  res.status(201).json({ exam, application: { ...app, status: newStatus, currentStep: newStep }, license: null });
}

router.post("/officer/exams/record", requireAuth, requireAnyOfficerOrAdmin, recordExam);
router.post("/officer/exams/:applicationId", requireAuth, requireAnyOfficerOrAdmin, recordExam);

router.post("/officer/practical/record", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  if (!assertRole(req, res, ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER", "ADMIN"])) return;
  const checklist = Array.isArray(req.body.checklist) ? req.body.checklist : [];
  const computedScore = checklist.reduce((total: number, item: any) => {
    const key = String(item?.key ?? "");
    const weight = PRACTICAL_WEIGHTS[key];
    return total + (item?.checked && weight ? weight : 0);
  }, 0);
  const unknownItems = checklist.filter((item: any) => !Object.prototype.hasOwnProperty.call(PRACTICAL_WEIGHTS, String(item?.key ?? "")));
  if (unknownItems.length > 0 || checklist.length !== Object.keys(PRACTICAL_WEIGHTS).length) {
    res.status(400).json({ message: "Practical checklist must use the official weighted items" });
    return;
  }
  const submittedScore = Number(req.body.score ?? computedScore);
  if (!Number.isFinite(submittedScore) || submittedScore !== computedScore) {
    res.status(400).json({ message: "Practical score must match the checked checklist items" });
    return;
  }
  req.body.examType = "PRACTICAL";
  req.body.score = computedScore;
  req.body.maxScore = 100;
  req.body.result = req.body.score >= PASS_THRESHOLD ? "PASSED" : "FAILED";
  req.body.notes = JSON.stringify({ notes: req.body.notes ?? "", checklist, verification: req.body.verification ?? null });
  await recordExam(req, res);
});

export default router;
