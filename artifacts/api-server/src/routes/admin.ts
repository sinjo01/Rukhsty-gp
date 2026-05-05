import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, applicationsTable, centersTable, drivingLicensesTable,
  medicalTestsTable, examsTable, appointmentsTable, notificationsTable,
  servicesTable, licenseCategoriesTable
} from "@workspace/db";
import { eq, count, desc, ilike, or } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/admin/stats", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const [{ value: totalApplications }] = await db.select({ value: count() }).from(applicationsTable);
  const [{ value: pendingReview }] = await db.select({ value: count() }).from(applicationsTable).where(eq(applicationsTable.status, "DRAFT"));
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

router.get("/admin/applications", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { status, page = "1", limit = "20" } = req.query as { status?: string; page?: string; limit?: string };
  const offset = (Number(page) - 1) * Number(limit);
  const apps = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt)).limit(Number(limit)).offset(offset);
  res.json({ data: apps, page: Number(page), limit: Number(limit), total: apps.length });
});

router.put("/admin/applications/:id/review", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { decision, rejectionReason } = req.body;
  const newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
  const [app] = await db.update(applicationsTable).set({
    status: newStatus,
    rejectionReason: decision === "REJECT" ? rejectionReason : null,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, req.params.id)).returning();
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

router.get("/admin/activity", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const recentApps = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt)).limit(10);
  res.json(recentApps);
});

export default router;
