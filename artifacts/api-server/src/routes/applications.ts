import { Router } from "express";
import { db } from "@workspace/db";
import {
  applicationsTable, applicationStepsTable, documentsTable, appointmentsTable,
  trainingRecordsTable, medicalTestsTable, examsTable, centersTable,
  servicesTable, licenseCategoriesTable, notificationsTable, userProfilesTable, usersTable
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

const APPLICATION_STEPS = [
  { stepKey: "APPLICATION_SUBMITTED", stepNameAr: "تقديم الطلب", stepNameEn: "Application submitted", orderNumber: 1 },
  { stepKey: "SECURITY_REVIEW", stepNameAr: "المراجعة الأمنية", stepNameEn: "Security review", orderNumber: 2 },
  { stepKey: "MEDICAL_TEST", stepNameAr: "فحص النظر / الفحص الطبي", stepNameEn: "Medical / vision test", orderNumber: 3 },
  { stepKey: "THEORY_EXAM", stepNameAr: "الامتحان النظري", stepNameEn: "Theory exam", orderNumber: 4 },
  { stepKey: "PRACTICAL_EXAM", stepNameAr: "الامتحان العملي", stepNameEn: "Practical exam", orderNumber: 5 },
  { stepKey: "LICENSE_ISSUANCE", stepNameAr: "إصدار الرخصة", stepNameEn: "License issuance", orderNumber: 6 },
];

const ACTIVE_STEP_BY_CURRENT_STEP: Record<string, string> = {
  SUBMITTED: "APPLICATION_SUBMITTED",
  SECURITY_REVIEW: "SECURITY_REVIEW",
  SECURITY_APPROVED: "MEDICAL_TEST",
  MEDICAL_BOOKING: "MEDICAL_TEST",
  MEDICAL_APPOINTMENT_BOOKED: "MEDICAL_TEST",
  MEDICAL_PASSED: "THEORY_EXAM",
  MEDICAL_REJECTED: "MEDICAL_TEST",
  THEORY_BOOKING: "THEORY_EXAM",
  THEORY_APPOINTMENT_BOOKED: "THEORY_EXAM",
  THEORY_PASSED: "PRACTICAL_EXAM",
  THEORY_FAILED: "THEORY_EXAM",
  PRACTICAL_BOOKING: "PRACTICAL_EXAM",
  PRACTICAL_APPOINTMENT_BOOKED: "PRACTICAL_EXAM",
  PRACTICAL_PASSED: "LICENSE_ISSUANCE",
  PRACTICAL_FAILED: "PRACTICAL_EXAM",
  LICENSE_ISSUANCE: "LICENSE_ISSUANCE",
  LICENSE_ISSUED: "LICENSE_ISSUANCE",
  REJECTED: "SECURITY_REVIEW",
  SECURITY_REJECTED: "SECURITY_REVIEW",
  // older workflow compatibility
  PROFILE_REVIEW: "APPLICATION_SUBMITTED",
  TRAINING_CENTER_SELECTION: "SECURITY_REVIEW",
  TRAINING: "SECURITY_REVIEW",
  MEDICAL_TEST: "MEDICAL_TEST",
  THEORY_EXAM: "THEORY_EXAM",
  PRACTICAL_EXAM: "PRACTICAL_EXAM",
};

function deriveStepStatus(stepKey: string, activeStep: string, appStatus: string) {
  const order = APPLICATION_STEPS.find((s) => s.stepKey === stepKey)?.orderNumber ?? 0;
  const activeOrder = APPLICATION_STEPS.find((s) => s.stepKey === activeStep)?.orderNumber ?? 0;
  if (["REJECTED", "SECURITY_REJECTED"].includes(appStatus) && stepKey === activeStep) return "FAILED";
  if (["MEDICAL_REJECTED"].includes(appStatus) && stepKey === "MEDICAL_TEST") return "FAILED";
  if (["THEORY_FAILED"].includes(appStatus) && stepKey === "THEORY_EXAM") return "FAILED";
  if (["PRACTICAL_FAILED"].includes(appStatus) && stepKey === "PRACTICAL_EXAM") return "FAILED";
  if (appStatus === "LICENSE_ISSUED") return "COMPLETED";
  if (order < activeOrder) return "COMPLETED";
  if (order === activeOrder) return "ACTIVE";
  return "PENDING";
}

async function syncApplicationSteps(applicationId: string, appStatus: string, currentStep: string) {
  const existing = await db.select().from(applicationStepsTable).where(eq(applicationStepsTable.applicationId, applicationId));
  if (existing.length === 0) {
    await db.insert(applicationStepsTable).values(
      APPLICATION_STEPS.map((s) => ({
        applicationId,
        ...s,
        status: deriveStepStatus(s.stepKey, ACTIVE_STEP_BY_CURRENT_STEP[currentStep] ?? "APPLICATION_SUBMITTED", appStatus),
        startedAt: s.orderNumber === 1 ? new Date() : null,
      }))
    );
    return;
  }
  const active = ACTIVE_STEP_BY_CURRENT_STEP[currentStep] ?? "APPLICATION_SUBMITTED";
  for (const s of APPLICATION_STEPS) {
    const row = existing.find((item) => item.stepKey === s.stepKey);
    const status = deriveStepStatus(s.stepKey, active, appStatus);
    if (row) {
      await db.update(applicationStepsTable).set({
        stepNameAr: s.stepNameAr,
        stepNameEn: s.stepNameEn,
        orderNumber: s.orderNumber,
        status,
        completedAt: status === "COMPLETED" ? (row.completedAt ?? new Date()) : row.completedAt,
      }).where(eq(applicationStepsTable.id, row.id));
    } else {
      await db.insert(applicationStepsTable).values({ applicationId, ...s, status });
    }
  }
}

async function getApplicationDetail(appId: string, userId: string | null) {
  const conditions = [eq(applicationsTable.id, appId)];
  if (userId) conditions.push(eq(applicationsTable.userId, userId));
  const [app] = await db.select().from(applicationsTable).where(and(...conditions)).limit(1);
  if (!app) return null;
  const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
  const [licenseCategory] = app.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, app.licenseCategoryId)).limit(1) : [null];
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, app.userId)).limit(1);
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, app.userId)).limit(1);
  await syncApplicationSteps(app.id, app.status, app.currentStep);
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
  return { ...app, service: service ?? null, licenseCategory: licenseCategory ?? null, user: user ?? null, profile: profile ?? null, steps, documents: docs, appointments: appointmentsWithCenter, trainingRecord: trainingWithCenter, medicalTest: medicalTest ?? null, exams };
}

router.get("/applications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId)).orderBy(desc(applicationsTable.createdAt));
  const detailed = await Promise.all(apps.map((a) => getApplicationDetail(a.id, userId)));
  res.json(detailed.filter(Boolean));
});

router.post("/applications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { serviceId, licenseCategoryId, governorate, residenceArea } = req.body;
  const [service] = serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1) : [null];
  const isIssueDrivingLicense = service?.code === "ISSUE_DRIVING_LICENSE";
  const appNumber = `RU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const [app] = await db.insert(applicationsTable).values({
    userId,
    serviceId,
    licenseCategoryId,
    applicationNumber: appNumber,
    status: isIssueDrivingLicense ? "SECURITY_REVIEW" : "DRAFT",
    currentStep: isIssueDrivingLicense ? "SECURITY_REVIEW" : "PROFILE_REVIEW",
    governorate,
    residenceArea,
    submittedAt: isIssueDrivingLicense ? new Date() : null,
  }).returning();
  await syncApplicationSteps(app.id, app.status, app.currentStep);
  if (isIssueDrivingLicense) {
    await db.insert(notificationsTable).values({
      userId,
      title: "تم تقديم طلبك للمراجعة الأمنية",
      message: `تم تقديم طلبك رقم ${app.applicationNumber} للمراجعة الأمنية.`,
      type: "SUCCESS",
    });
  }
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
    status: "SECURITY_REVIEW",
    currentStep: "SECURITY_REVIEW",
    submittedAt: new Date(),
    updatedAt: new Date(),
  }).where(and(eq(applicationsTable.id, routeParam(req, "id")), eq(applicationsTable.userId, userId))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await syncApplicationSteps(app.id, app.status, app.currentStep);
  await db.insert(notificationsTable).values({ userId, title: "تم تقديم طلبك للمراجعة الأمنية", message: `تم تقديم طلبك رقم ${app.applicationNumber} للمراجعة الأمنية.`, type: "SUCCESS" });
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
