import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, applicationsTable, centersTable, drivingLicensesTable,
  medicalTestsTable, examsTable, appointmentsTable, notificationsTable,
  servicesTable, licenseCategoriesTable, userProfilesTable,
  applicationStepsTable, auditLogsTable, documentsTable
} from "@workspace/db";
import { and, eq, count, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-params";
import type { JwtPayload } from "../middlewares/auth";
import { getLicenseWithCategory, issueLicenseForApplication } from "../services/license-issuance";

const router = Router();
const TRAINING_CERTIFICATE_DOCUMENT_TYPE = "TRAINING_CERTIFICATE";

router.get("/admin/stats", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), async (_req, res) => {
  const [{ value: totalApplications }] = await db.select({ value: count() }).from(applicationsTable);
  const [{ value: pendingReview }] = await db.select({ value: count() }).from(applicationsTable).where(eq(applicationsTable.status, "SECURITY_REVIEW"));
  const [{ value: totalCitizens }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.role, "USER"));
  const [{ value: totalCenters }] = await db.select({ value: count() }).from(centersTable).where(eq(centersTable.isActive, true));
  const [{ value: licensesIssued }] = await db.select({ value: count() }).from(drivingLicensesTable);
  const [{ value: passedExamsCount }] = await db.select({ value: count() }).from(examsTable).where(eq(examsTable.result, "PASSED"));
  const [{ value: failedExamsCount }] = await db.select({ value: count() }).from(examsTable).where(eq(examsTable.result, "FAILED"));
  const allApps = await db.select({ status: applicationsTable.status, governorate: applicationsTable.governorate }).from(applicationsTable);
  const byStatus: Record<string, number> = {};
  const byGovernorate: Record<string, number> = {};
  for (const app of allApps) {
    byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    if (app.governorate) byGovernorate[app.governorate] = (byGovernorate[app.governorate] ?? 0) + 1;
  }
  const applicationsByStatus = Object.entries(byStatus).map(([status, count]) => ({ status, count }));
  const applicationsByGovernorate = Object.entries(byGovernorate).map(([governorate, count]) => ({ governorate, count }));
  res.json({
    totalApplications: Number(totalApplications),
    pendingReview: Number(pendingReview),
    approvedToday: 0,
    totalCitizens: Number(totalCitizens),
    totalCenters: Number(totalCenters),
    applicationsByStatus,
    applicationsByGovernorate,
    passedExamsCount: Number(passedExamsCount),
    failedExamsCount: Number(failedExamsCount),
    pendingMedicalTests: 0,
    licensesIssued: Number(licensesIssued),
  });
});

async function enrichApplication(app: typeof applicationsTable.$inferSelect) {
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, app.userId)).limit(1);
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, app.userId)).limit(1);
  const [licenseCategory] = app.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, app.licenseCategoryId)).limit(1) : [null];
  const [service] = app.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, app.serviceId)).limit(1) : [null];
  const steps = await db.select().from(applicationStepsTable).where(eq(applicationStepsTable.applicationId, app.id));
  const documents = await db.select().from(documentsTable).where(eq(documentsTable.applicationId, app.id));
  return { ...app, user: user ?? null, profile: profile ?? null, licenseCategory: licenseCategory ?? null, service: service ?? null, steps, documents };
}

router.get("/admin/applications", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), async (req, res) => {
  const { status, serviceCode, page = "1", limit = "20" } = req.query as { status?: string; serviceCode?: string; page?: string; limit?: string };
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  if (status && status !== "ALL") conditions.push(eq(applicationsTable.status, status));
  if (serviceCode) {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.code, serviceCode)).limit(1);
    if (!service) {
      res.json({ data: [], page: Number(page), limit: Number(limit), total: 0 });
      return;
    }
    conditions.push(eq(applicationsTable.serviceId, service.id));
  }
  const query = db.select().from(applicationsTable);
  const apps = conditions.length
    ? await query.where(and(...conditions)).orderBy(desc(applicationsTable.createdAt)).limit(Number(limit)).offset(offset)
    : await query.orderBy(desc(applicationsTable.createdAt)).limit(Number(limit)).offset(offset);
  const data = await Promise.all(apps.map(enrichApplication));
  res.json({ data, page: Number(page), limit: Number(limit), total: data.length });
});

router.get("/admin/applications/:id", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), async (req, res) => {
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  res.json(await enrichApplication(app));
});

async function securityApprove(req: Request, res: Response) {
  const actor = (req as Request & { user: JwtPayload }).user;
  const [currentApp] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!currentApp) { res.status(404).json({ message: "Application not found" }); return; }
  if (currentApp.status !== "SECURITY_REVIEW") { res.status(409).json({ message: "Application is not in security review" }); return; }
  const [service] = currentApp.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, currentApp.serviceId)).limit(1) : [null];
  if (service?.code === "ISSUE_DRIVING_LICENSE") {
    const [trainingCertificate] = await db.select().from(documentsTable).where(and(
      eq(documentsTable.applicationId, currentApp.id),
      eq(documentsTable.documentType, TRAINING_CERTIFICATE_DOCUMENT_TYPE),
    )).limit(1);
    if (!trainingCertificate) {
      res.status(409).json({ message: "Training certificate image is required before approving this application" });
      return;
    }
  }
  const [app] = await db.update(applicationsTable).set({
    status: "SECURITY_APPROVED",
    currentStep: "MEDICAL_BOOKING",
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, routeParam(req, "id"))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.update(applicationStepsTable).set({ status: "COMPLETED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "SECURITY_REVIEW")));
  await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "MEDICAL_TEST")));
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: "Security review approved",
    message: "Security review approved. You can now book your medical/vision test. تمت الموافقة على المراجعة الأمنية. يمكنك الآن حجز موعد فحص النظر.",
    type: "SUCCESS",
  });
  await db.insert(auditLogsTable).values({ actorUserId: actor.userId, action: "SECURITY_APPROVE", entityType: "application", entityId: app.id, newValue: { status: app.status, currentStep: app.currentStep } });
  res.json(app);
}

async function securityReject(req: Request, res: Response) {
  const actor = (req as Request & { user: JwtPayload }).user;
  const { rejectionReason } = req.body;
  if (!rejectionReason) { res.status(400).json({ message: "rejectionReason is required" }); return; }
  const [currentApp] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!currentApp) { res.status(404).json({ message: "Application not found" }); return; }
  if (currentApp.status !== "SECURITY_REVIEW") { res.status(409).json({ message: "Application is not in security review" }); return; }
  const [app] = await db.update(applicationsTable).set({
    status: "SECURITY_REJECTED",
    currentStep: "SECURITY_REJECTED",
    rejectionReason,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, routeParam(req, "id"))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.update(applicationStepsTable).set({ status: "FAILED", notes: rejectionReason }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "SECURITY_REVIEW")));
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: "Security review rejected",
    message: `Your application was rejected. Reason: ${rejectionReason}`,
    type: "ERROR",
  });
  await db.insert(auditLogsTable).values({ actorUserId: actor.userId, action: "SECURITY_REJECT", entityType: "application", entityId: app.id, newValue: { status: app.status, rejectionReason } });
  res.json(app);
}

router.post("/admin/applications/:id/security/approve", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), securityApprove);
router.post("/admin/applications/:id/security/reject", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), securityReject);

async function requestMoreInfo(req: Request, res: Response) {
  const message = String(req.body?.message ?? req.body?.note ?? "").trim();
  if (!message) { res.status(400).json({ message: "message or note is required" }); return; }
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.update(applicationsTable).set({ status: "SECURITY_REVIEW", currentStep: "SECURITY_REVIEW", rejectionReason: message, updatedAt: new Date() }).where(eq(applicationsTable.id, app.id));
  await db.update(applicationStepsTable).set({ notes: message }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "SECURITY_REVIEW")));
  await db.insert(notificationsTable).values({ userId: app.userId, title: "Additional information requested", message, type: "INFO" });
  const actor = (req as Request & { user: JwtPayload }).user;
  await db.insert(auditLogsTable).values({ actorUserId: actor.userId, action: "SECURITY_REQUEST_MORE_INFO", entityType: "application", entityId: app.id, newValue: { message } });
  res.json({ ok: true });
}

router.post("/admin/applications/:id/request-more-info", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), requestMoreInfo);

router.post("/security/applications/:id/approve", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), securityApprove);
router.post("/security/applications/:id/reject", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), securityReject);
router.post("/security/applications/:id/request-more-info", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), requestMoreInfo);

router.put("/admin/applications/:id/review", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), async (req, res) => {
  const { decision, status, rejectionReason } = req.body;
  const action = decision ?? (status === "APPROVED" || status === "SECURITY_APPROVED" ? "APPROVE" : "REJECT");
  if (action === "APPROVE") { await securityApprove(req, res); return; }
  if (action === "REJECT") { await securityReject(req, res); return; }
  const newStatus = "REJECTED";
  const [app] = await db.update(applicationsTable).set({
    status: newStatus,
    rejectionReason: decision === "REJECT" ? rejectionReason : null,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, routeParam(req, "id"))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: decision === "APPROVE" ? "تم الموافقة على طلبك" : "تم رفض طلبك",
    message: decision === "APPROVE" ? "تهانينا! تمت الموافقة على طلبك." : `تم رفض طلبك. السبب: ${rejectionReason ?? "غير محدد"}`,
    type: decision === "APPROVE" ? "SUCCESS" : "ERROR",
  });
  res.json(app);
});

router.get("/admin/users", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { search, page = "1", limit = "20" } = req.query as { search?: string; page?: string; limit?: string };
  const offset = (Number(page) - 1) * Number(limit);
  const users = await db.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt }).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(Number(limit)).offset(offset);
  res.json({ data: users, page: Number(page), limit: Number(limit), total: users.length });
});

router.get("/admin/centers", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const centers = await db.select().from(centersTable).orderBy(desc(centersTable.createdAt));
  res.json(centers);
});

router.post("/admin/centers", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { centerType, nameAr, nameEn, governorate, city, area, address, phone, email } = req.body;
  if (!centerType || !nameAr || !governorate) { res.status(400).json({ message: "centerType, nameAr, and governorate are required" }); return; }
  const [center] = await db.insert(centersTable).values({ centerType, nameAr, nameEn, governorate, city, area, address, phone, email }).returning();
  res.status(201).json(center);
});

router.post("/admin/applications/:id/issue-license", requireAuth, requireRole("ADMIN", "DVLD_OFFICER"), async (req, res) => {
  const actor = (req as Request & { user: JwtPayload }).user;
  const applicationId = routeParam(req, "id");
  const license = await issueLicenseForApplication(applicationId, actor.userId);
  await db.insert(auditLogsTable).values({
    actorUserId: actor.userId,
    action: "ISSUE_LICENSE",
    entityType: "application",
    entityId: applicationId,
    newValue: { licenseId: license.id, licenseNumber: license.licenseNumber },
  });

  res.status(201).json(await getLicenseWithCategory(license));
});

async function listRecentActivity(_req: Request, res: Response) {
  const recentApps = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt)).limit(10);
  res.json(recentApps);
}

router.get("/admin/recent-activity", requireAuth, requireRole("ADMIN"), listRecentActivity);
router.get("/admin/activity", requireAuth, requireRole("ADMIN"), listRecentActivity);

export default router;
