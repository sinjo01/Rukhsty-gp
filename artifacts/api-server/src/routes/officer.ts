import { Router } from "express";
import { db } from "@workspace/db";
import {
  appointmentsTable, usersTable, userProfilesTable, centerOfficersTable,
  centersTable, applicationsTable, trainingRecordsTable, medicalTestsTable,
  examsTable, notificationsTable
} from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth, requireAnyOfficerOrAdmin, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

async function getOfficerCenter(userId: string) {
  const [co] = await db.select().from(centerOfficersTable).where(and(eq(centerOfficersTable.userId, userId), eq(centerOfficersTable.isActive, true))).limit(1);
  if (!co) return null;
  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, co.centerId)).limit(1);
  return center ?? null;
}

router.get("/officer/dashboard", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const center = await getOfficerCenter(userId);
  const centerId = center?.id;
  let todayAppointments = 0, pendingAppointments = 0, completedToday = 0, recentAppointments: unknown[] = [];
  if (centerId) {
    const today = new Date().toISOString().split("T")[0];
    const allTodayApts = await db.select().from(appointmentsTable).where(and(eq(appointmentsTable.centerId, centerId), eq(appointmentsTable.appointmentDate, today)));
    todayAppointments = allTodayApts.length;
    pendingAppointments = allTodayApts.filter((a) => a.status === "BOOKED").length;
    completedToday = allTodayApts.filter((a) => a.status === "COMPLETED").length;
    const recent = await db.select().from(appointmentsTable).where(eq(appointmentsTable.centerId, centerId)).limit(10);
    recentAppointments = await Promise.all(recent.map(async (apt) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, apt.userId)).limit(1);
      const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, apt.userId)).limit(1);
      return { ...apt, user: user ?? null, profile: profile ?? null };
    }));
  }
  res.json({ center, todayAppointments, pendingAppointments, completedToday, recentAppointments });
});

router.get("/officer/appointments", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const center = await getOfficerCenter(userId);
  if (!center) { res.json([]); return; }
  const apts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.centerId, center.id)).limit(100);
  const withUser = await Promise.all(apts.map(async (apt) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, apt.userId)).limit(1);
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, apt.userId)).limit(1);
    return { ...apt, center, user: user ?? null, profile: profile ?? null };
  }));
  res.json(withUser);
});

router.put("/officer/appointments/:id/status", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { status, notes } = req.body;
  const [apt] = await db.update(appointmentsTable).set({ status, notes, updatedAt: new Date() }).where(eq(appointmentsTable.id, req.params.id)).returning();
  if (!apt) { res.status(404).json({ message: "Appointment not found" }); return; }
  res.json(apt);
});

router.put("/officer/training/:applicationId", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
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
  const [record] = await db.update(trainingRecordsTable).set(updateData).where(eq(trainingRecordsTable.applicationId, req.params.applicationId)).returning();
  if (!record) { res.status(404).json({ message: "Training record not found" }); return; }
  if (status === "COMPLETED") {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, record.applicationId)).limit(1);
    if (app) {
      await db.update(applicationsTable).set({ status: "TRAINING_COMPLETED", currentStep: "MEDICAL_TEST", updatedAt: new Date() }).where(eq(applicationsTable.id, app.id));
      await db.insert(notificationsTable).values({ userId: app.userId, title: "تم الانتهاء من التدريب", message: "تهانينا! لقد أنهيت مرحلة التدريب. يرجى حجز موعد الفحص الطبي.", type: "SUCCESS" });
    }
  }
  res.json(record);
});

router.post("/officer/medical/:applicationId", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { centerId, result, leftEyeScore, rightEyeScore, requiresGlasses, isAllowedToDrive, notes } = req.body;
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, req.params.applicationId)).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  const [test] = await db.insert(medicalTestsTable).values({
    applicationId: req.params.applicationId,
    centerId,
    officerId,
    result,
    leftEyeScore,
    rightEyeScore,
    requiresGlasses: requiresGlasses ?? false,
    isAllowedToDrive: isAllowedToDrive ?? true,
    notes,
  }).returning();
  const passed = result === "PASS_NO_GLASSES" || result === "PASS_WITH_GLASSES";
  const newStatus = passed ? "MEDICAL_PASSED" : "MEDICAL_FAILED";
  await db.update(applicationsTable).set({ status: newStatus, currentStep: passed ? "THEORY_EXAM" : "MEDICAL_TEST", updatedAt: new Date() }).where(eq(applicationsTable.id, req.params.applicationId));
  await db.insert(notificationsTable).values({ userId: app.userId, title: passed ? "نتيجة الفحص الطبي: نجاح" : "نتيجة الفحص الطبي: فشل", message: passed ? "لقد اجتزت الفحص الطبي بنجاح. يرجى حجز موعد الاختبار النظري." : "للأسف لم تجتز الفحص الطبي. يرجى مراجعة المركز.", type: passed ? "SUCCESS" : "ERROR" });
  res.status(201).json(test);
});

router.post("/officer/exams/:applicationId", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { centerId, examType, score, maxScore, result, notes } = req.body;
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, req.params.applicationId)).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  const prevExams = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, req.params.applicationId), eq(examsTable.examType, examType)));
  const [exam] = await db.insert(examsTable).values({
    applicationId: req.params.applicationId,
    centerId,
    officerId,
    examType,
    score: score?.toString(),
    maxScore: maxScore?.toString(),
    result,
    attemptNumber: prevExams.length + 1,
    notes,
  }).returning();
  const passed = result === "PASSED";
  let newStatus = app.status, newStep = app.currentStep;
  if (examType === "THEORY") {
    newStatus = passed ? "THEORY_PASSED" : "THEORY_FAILED";
    newStep = passed ? "PRACTICAL_EXAM" : "THEORY_EXAM";
  } else if (examType === "PRACTICAL") {
    newStatus = passed ? "PRACTICAL_PASSED" : "PRACTICAL_FAILED";
    newStep = passed ? "LICENSE_ISSUANCE" : "PRACTICAL_EXAM";
  }
  await db.update(applicationsTable).set({ status: newStatus, currentStep: newStep, updatedAt: new Date() }).where(eq(applicationsTable.id, req.params.applicationId));
  await db.insert(notificationsTable).values({ userId: app.userId, title: passed ? `نجحت في الاختبار ${examType === "THEORY" ? "النظري" : "العملي"}` : `رسبت في الاختبار ${examType === "THEORY" ? "النظري" : "العملي"}`, message: passed ? "مبروك! يمكنك المتابعة للمرحلة التالية." : "للأسف لم تجتز الاختبار. يمكنك إعادة المحاولة.", type: passed ? "SUCCESS" : "ERROR" });
  res.status(201).json(exam);
});

export default router;
