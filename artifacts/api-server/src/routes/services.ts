import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, drivingLicensesTable, licenseCategoriesTable, notificationsTable, paymentsTable, servicesTable, userProfilesTable } from "@workspace/db";
import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { getLicenseWithCategory } from "../services/license-issuance";

const router = Router();

const ACTIVE_RENEWAL_STATUSES = [
  "RENEWAL_SUBMITTED",
  "RENEWAL_MEDICAL_BOOKING",
  "RENEWAL_MEDICAL_BOOKED",
];

function addYears(dateValue: string | Date | null | undefined, years: number) {
  const base = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const start = Number.isNaN(base.getTime()) || base < new Date() ? new Date() : base;
  start.setFullYear(start.getFullYear() + years);
  return start.toISOString().slice(0, 10);
}

function ageFromDate(dateValue?: string | null) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

async function ensureService(code: string, nameEn: string, nameAr: string, description: string) {
  const [existing] = await db.select().from(servicesTable).where(eq(servicesTable.code, code)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(servicesTable).values({ code, nameEn, nameAr, description, isActive: true }).returning();
  return created;
}

router.get("/services", async (_req, res) => {
  const services = await db.select().from(servicesTable).where(eq(servicesTable.isActive, true));
  res.json(services);
});

router.get("/license-categories", async (_req, res) => {
  const cats = await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.isActive, true));
  res.json(cats);
});

router.post("/services/renew-driving-license/apply", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [license] = await db.select().from(drivingLicensesTable)
    .where(and(eq(drivingLicensesTable.userId, userId), eq(drivingLicensesTable.status, "ACTIVE")))
    .orderBy(desc(drivingLicensesTable.createdAt))
    .limit(1);
  if (!license) {
    res.status(404).json({ message: "No driving license found. You need to issue a driving license first before renewal." });
    return;
  }

  const service = await ensureService("RENEW_DRIVING_LICENSE", "Renew Driving License", "تجديد رخصة القيادة", "Renew an existing driving license.");
  const activeApps = await db.select().from(applicationsTable).where(and(
    eq(applicationsTable.userId, userId),
    eq(applicationsTable.serviceId, service.id),
    inArray(applicationsTable.status, ACTIVE_RENEWAL_STATUSES),
  ));
  if (activeApps[0]) {
    res.json({ application: activeApps[0], license: await getLicenseWithCategory(license), duplicate: true, medicalRequired: true });
    return;
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const appNumber = `RN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const [application] = await db.insert(applicationsTable).values({
    userId,
    serviceId: service.id,
    licenseCategoryId: license.licenseCategoryId,
    applicationNumber: appNumber,
    status: "RENEWAL_SUBMITTED",
    currentStep: "RENEWAL_MEDICAL_BOOKING",
    governorate: (profile as any)?.governorate ?? "Amman",
    residenceArea: (profile as any)?.area ?? (profile as any)?.city ?? "Amman",
    submittedAt: new Date(),
  }).returning();

  await db.insert(notificationsTable).values({
    userId,
    title: "Driving license renewal submitted",
    message: "Renewal request submitted. Please book your medical/vision test. تم تقديم طلب التجديد. يرجى حجز فحص النظر.",
    type: "INFO",
  });

  res.status(201).json({ application, license: await getLicenseWithCategory(license), medicalRequired: true });
});

router.post("/services/renew-driving-license/pay", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId } = req.body ?? {};
  const [application] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!application) { res.status(404).json({ message: "Application not found" }); return; }

  await db.insert(paymentsTable).values({
    applicationId: application.id,
    userId,
    amount: "21.00",
    currency: "JOD",
    paymentMethod: "MOCK_CARD",
    paymentStatus: "PAID",
    transactionReference: `MOCK-REN-${Date.now()}`,
    paidAt: new Date(),
  });
  const [updated] = await db.update(applicationsTable).set({ status: "RENEWAL_PAYMENT_PENDING", currentStep: "RENEWAL_PAYMENT_PENDING", updatedAt: new Date() }).where(eq(applicationsTable.id, application.id)).returning();
  res.json({ application: updated, payment: { status: "PAID", total: 21 } });
});

router.post("/services/renew-driving-license/complete", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId } = req.body ?? {};
  const [application] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!application) { res.status(404).json({ message: "Application not found" }); return; }
  const [license] = await db.select().from(drivingLicensesTable)
    .where(and(eq(drivingLicensesTable.userId, userId), eq(drivingLicensesTable.status, "ACTIVE")))
    .orderBy(desc(drivingLicensesTable.createdAt))
    .limit(1);
  if (!license) { res.status(404).json({ message: "No license found" }); return; }

  const newExpiry = addYears(license.expiryDate, 10);
  const [renewedLicense] = await db.update(drivingLicensesTable).set({ expiryDate: newExpiry, status: "ACTIVE" }).where(eq(drivingLicensesTable.id, license.id)).returning();
  const [updatedApp] = await db.update(applicationsTable).set({ status: "LICENSE_RENEWED", currentStep: "LICENSE_RENEWED", completedAt: new Date(), updatedAt: new Date() }).where(eq(applicationsTable.id, application.id)).returning();
  await db.insert(notificationsTable).values({
    userId,
    title: "Driving license renewed",
    message: "Your driving license has been renewed successfully.",
    type: "SUCCESS",
  });

  res.json({ application: updatedApp, license: await getLicenseWithCategory(renewedLicense), newExpiryDate: newExpiry });
});

export default router;
