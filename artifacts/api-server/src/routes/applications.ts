import { Router } from "express";
import { db } from "@workspace/db";
import {
  applicationsTable, applicationStepsTable, documentsTable, appointmentsTable,
  trainingRecordsTable, medicalTestsTable, examsTable, centersTable,
  servicesTable, licenseCategoriesTable, notificationsTable
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

const APPLICATION_STEPS = [
  { stepKey: "PROFILE_REVIEW", stepNameAr: "مراجعة البيانات الشخصية", stepNameEn: "Profile Review", orderNumber: 1 },
  { stepKey: "TRAINING_CENTER_SELECTION", stepNameAr: "اختيار مركز التدريب", stepNameEn: "Training Center Selection", orderNumber: 2 },
  { stepKey: "TRAINING", stepNameAr: "التدريب", stepNameEn: "Training", orderNumber: 3 },
  { stepKey: "MEDICAL_TEST", stepNameAr: "الفحص الطبي", stepNameEn: "Medical Test", orderNumber: 4 },
  { stepKey: "THEORY_EXAM", stepNameAr: "الاختبار النظري", stepNameEn: "Theory Exam", orderNumber: 5 },
  { stepKey: "PRACTICAL_EXAM", stepNameAr: "الاختبار العملي", stepNameEn: "Practical Exam", orderNumber: 6 },
  { stepKey: "LICENSE_ISSUANCE", stepNameAr: "إصدار الرخصة", stepNameEn: "License Issuance", orderNumber: 7 },
];

async function getApplicationDetail(appId: string, userId: string | null) {
  const conditions = [eq(applicationsTable.id, appId)];
  if (userId) conditions.push(eq(applicationsTable.userId, userId));
  const [app] = await db.select().from(applicationsTable).where(and(...conditions)).limit(1);
  if (!app) return null;
  const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
  const [licenseCategory] = app.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, app.licenseCategoryId)).limit(1) : [null];
  const steps = await db.select().from(applicationStepsTable).where(eq(applicationStepsTable.applicationId, appId));
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.applicationId, appId));
  const appointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.applicationId, appId));
  const appointmentsWithCenter = await Promise.all(appointments.map(async (apt) => {
    if (!apt.centerId) return { ...apt, center: null };
    const [center] = await db.select().from(centersTable).where(eq(centersTable.id, apt.centerId)).limit(1);
    return { ...apt, center: center ?? null };
  }));
  const [trainingRecord] = await db.select().from(trainingRecordsTable).where(eq(trainingRecordsTable.applicationId, appId)).limit(1);
  let trainingWithCenter = null;
  if (trainingRecord) {
    const [center] = trainingRecord.centerId ? await db.select().from(centersTable).where(eq(centersTable.id, trainingRecord.centerId)).limit(1) : [null];
    trainingWithCenter = { ...trainingRecord, center: center ?? null };
  }
  const [medicalTest] = await db.select().from(medicalTestsTable).where(eq(medicalTestsTable.applicationId, appId)).limit(1);
  const exams = await db.select().from(examsTable).where(eq(examsTable.applicationId, appId));
  return { ...app, service: service ?? null, licenseCategory: licenseCategory ?? null, steps, documents: docs, appointments: appointmentsWithCenter, trainingRecord: trainingWithCenter, medicalTest: medicalTest ?? null, exams };
}

router.get("/applications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId));
  const detailed = await Promise.all(apps.map((a) => getApplicationDetail(a.id, userId)));
  res.json(detailed.filter(Boolean));
});

router.post("/applications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { serviceId, licenseCategoryId, governorate, residenceArea } = req.body;
  const appNumber = `RU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const [app] = await db.insert(applicationsTable).values({
    userId,
    serviceId,
    licenseCategoryId,
    applicationNumber: appNumber,
    status: "DRAFT",
    currentStep: "PROFILE_REVIEW",
    governorate,
    residenceArea,
  }).returning();
  await db.insert(applicationStepsTable).values(
    APPLICATION_STEPS.map((s) => ({
      applicationId: app.id,
      ...s,
      status: s.orderNumber === 1 ? "ACTIVE" : "PENDING",
    }))
  );
  const detail = await getApplicationDetail(app.id, userId);
  res.status(201).json(detail);
});

router.get("/applications/:id", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const detail = await getApplicationDetail(routeParam(req, "id"), userId);
  if (!detail) { res.status(404).json({ message: "Application not found" }); return; }
  res.json(detail);
});

router.post("/applications/:id/submit", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [app] = await db.update(applicationsTable).set({
    status: "PROFILE_SUBMITTED",
    currentStep: "TRAINING_CENTER_SELECTION",
    submittedAt: new Date(),
    updatedAt: new Date(),
  }).where(and(eq(applicationsTable.id, routeParam(req, "id")), eq(applicationsTable.userId, userId))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.update(applicationStepsTable).set({ status: "COMPLETED" }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "PROFILE_REVIEW")));
  await db.update(applicationStepsTable).set({ status: "ACTIVE" }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "TRAINING_CENTER_SELECTION")));
  await db.insert(notificationsTable).values({ userId, title: "تم تقديم طلبك", message: `تم تقديم طلبك رقم ${app.applicationNumber} بنجاح. يرجى اختيار مركز التدريب.`, type: "SUCCESS" });
  const detail = await getApplicationDetail(app.id, userId);
  res.json(detail);
});

router.post("/applications/:id/select-training-center", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { centerId } = req.body;
  const [app] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, routeParam(req, "id")), eq(applicationsTable.userId, userId))).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  const existing = await db.select().from(trainingRecordsTable).where(eq(trainingRecordsTable.applicationId, app.id)).limit(1);
  if (existing.length === 0) {
    await db.insert(trainingRecordsTable).values({ applicationId: app.id, centerId, status: "NOT_STARTED" });
  } else {
    await db.update(trainingRecordsTable).set({ centerId }).where(eq(trainingRecordsTable.applicationId, app.id));
  }
  const [updated] = await db.update(applicationsTable).set({ status: "TRAINING_CENTER_SELECTED", currentStep: "TRAINING", updatedAt: new Date() }).where(eq(applicationsTable.id, app.id)).returning();
  await db.update(applicationStepsTable).set({ status: "COMPLETED" }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "TRAINING_CENTER_SELECTION")));
  await db.update(applicationStepsTable).set({ status: "ACTIVE" }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "TRAINING")));
  const detail = await getApplicationDetail(updated.id, userId);
  res.json(detail);
});

export default router;
