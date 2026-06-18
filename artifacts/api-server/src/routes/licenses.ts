import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, drivingLicensesTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";
import { autoIssuePendingLicenseForUser, getLicenseWithCategory, issueLicenseForApplication } from "../services/license-issuance";

const router = Router();
const LICENSE_PAYMENT_AMOUNT = "3.00";
const PAYMENT_ELIGIBLE_STATUSES = ["PRACTICAL_PASSED", "LICENSE_ISSUANCE", "LICENSE_ISSUED"];
const JORDAN_PHONE_REGEX = /^(?:07[789]\d{7}|\+9627[789]\d{7})$/;

function normalizeLicense(license: any) {
  if (!license) return null;
  const category = license.licenseCategory;
  return {
    ...license,
    category: category?.code ?? category?.nameEn ?? null,
    fullName: license.fullNameEn ?? license.fullNameAr ?? null,
    profilePhotoUrl: license.photoUrl ?? null,
  };
}

function isPrivileged(role: string) {
  return ["ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"].includes(role);
}

function todayCompact() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export async function generateEfawateercomReference() {
  for (let i = 0; i < 8; i += 1) {
    const reference = `RKH-${todayCompact()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [existingLicense] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.paymentReference, reference)).limit(1);
    const [existingApplication] = await db.select().from(applicationsTable).where(eq(applicationsTable.paymentReference, reference)).limit(1);
    if (!existingLicense && !existingApplication) return reference;
  }
  return `RKH-${todayCompact()}-${String(Date.now()).slice(-6)}`;
}

function generateAramexTrackingNumber() {
  return `ARX${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

async function findApplicationOrLicense(id: string, user: JwtPayload) {
  const [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.id, id)).limit(1);
  if (license) {
    if (!isPrivileged(user.role) && license.userId !== user.userId) return { forbidden: true as const };
    const [application] = license.applicationId ? await db.select().from(applicationsTable).where(eq(applicationsTable.id, license.applicationId)).limit(1) : [null];
    return { license, application: application ?? null };
  }

  const [application] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
  if (!application) return null;
  if (!isPrivileged(user.role) && application.userId !== user.userId) return { forbidden: true as const };
  const [applicationLicense] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.applicationId, application.id)).limit(1);
  return { application, license: applicationLicense ?? null };
}

function paymentAllowed(status?: string | null) {
  return Boolean(status && PAYMENT_ELIGIBLE_STATUSES.includes(status));
}

router.get("/licenses/my", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await autoIssuePendingLicenseForUser(userId);
  const [license] = await db.select().from(drivingLicensesTable)
    .where(and(eq(drivingLicensesTable.userId, userId), eq(drivingLicensesTable.status, "ACTIVE")))
    .orderBy(desc(drivingLicensesTable.createdAt))
    .limit(1);
  if (!license) { res.status(404).json({ message: "No license found" }); return; }
  res.json(await getLicenseWithCategory(license));
});

router.get("/licenses/me", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await autoIssuePendingLicenseForUser(userId);
  const [license] = await db.select().from(drivingLicensesTable)
    .where(and(eq(drivingLicensesTable.userId, userId), eq(drivingLicensesTable.status, "ACTIVE")))
    .orderBy(desc(drivingLicensesTable.createdAt))
    .limit(1);
  res.json({ license: normalizeLicense(await getLicenseWithCategory(license ?? null)) });
});

router.post("/licenses/auto-issue-pending", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const license = await autoIssuePendingLicenseForUser(userId);
  res.json({ license: normalizeLicense(await getLicenseWithCategory(license ?? null)) });
});

router.get("/applications/:id/license", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const applicationId = routeParam(req, "id");
  const [app] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  let [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.applicationId, applicationId)).limit(1);
  if (!license && ["PRACTICAL_PASSED", "LICENSE_ISSUANCE", "LICENSE_ISSUED"].includes(app.status)) {
    license = await issueLicenseForApplication(applicationId, null);
  }
  res.json({ license: normalizeLicense(await getLicenseWithCategory(license ?? null)) });
});

router.patch("/licenses/:id/mock-pay", requireAuth, async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const found = await findApplicationOrLicense(routeParam(req, "id"), user);
  if (!found) { res.status(404).json({ success: false, message: "License or application not found." }); return; }
  if ("forbidden" in found) { res.status(403).json({ success: false, message: "Forbidden" }); return; }

  const application = found.application;
  const existingLicense = found.license;
  const status = application?.status ?? (existingLicense ? "LICENSE_ISSUED" : null);
  if (!paymentAllowed(status)) {
    res.status(409).json({ success: false, message: "Application must be approved before payment." });
    return;
  }

  if ((existingLicense?.paymentStatus ?? application?.paymentStatus) === "paid") {
    res.json({
      success: true,
      message: "Payment completed successfully. Your license has been issued.",
      data: {
        application,
        license: normalizeLicense(await getLicenseWithCategory(existingLicense ?? null)),
      },
    });
    return;
  }

  const paymentReference = existingLicense?.paymentReference ?? application?.paymentReference ?? await generateEfawateercomReference();
  const paidAt = new Date();
  const shouldConfirmDelivery = (existingLicense?.deliveryMethod ?? application?.deliveryMethod) === "aramex";
  const aramexTrackingNumber = shouldConfirmDelivery
    ? existingLicense?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? generateAramexTrackingNumber()
    : existingLicense?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? null;

  let updatedApplication = application;
  if (application) {
    [updatedApplication] = await db.update(applicationsTable).set({
      paymentMethod: "efawateercom",
      paymentStatus: "paid",
      paymentAmount: LICENSE_PAYMENT_AMOUNT,
      paymentReference,
      paymentPaidAt: paidAt,
      status: "LICENSE_ISSUED",
      currentStep: "LICENSE_ISSUANCE",
      completedAt: new Date(),
      updatedAt: new Date(),
      deliveryStatus: shouldConfirmDelivery ? "payment_confirmed" : application.deliveryStatus,
      aramexTrackingNumber,
    }).where(eq(applicationsTable.id, application.id)).returning();
  }

  // TODO: Replace mock-pay endpoint with real eFAWATEERcom callback/API integration in production.
  // TODO: Replace mock Aramex tracking number with real Aramex shipment API integration in production.
  const license = existingLicense ?? (application ? await issueLicenseForApplication(application.id, null) : null);
  if (!license) { res.status(404).json({ success: false, message: "License not found." }); return; }

  const [updatedLicense] = await db.update(drivingLicensesTable).set({
    paymentMethod: "efawateercom",
    paymentStatus: "paid",
    paymentAmount: LICENSE_PAYMENT_AMOUNT,
    paymentReference,
    paymentPaidAt: paidAt,
    deliveryMethod: license.deliveryMethod ?? application?.deliveryMethod,
    deliveryStatus: shouldConfirmDelivery ? "payment_confirmed" : license.deliveryStatus ?? application?.deliveryStatus,
    deliveryAddress: license.deliveryAddress ?? application?.deliveryAddress,
    deliveryCity: license.deliveryCity ?? application?.deliveryCity,
    deliveryPhone: license.deliveryPhone ?? application?.deliveryPhone,
    deliveryLocationLink: license.deliveryLocationLink ?? application?.deliveryLocationLink,
    deliveryDate: license.deliveryDate ?? application?.deliveryDate,
    deliveryTimeSlot: license.deliveryTimeSlot ?? application?.deliveryTimeSlot,
    aramexTrackingNumber,
  }).where(eq(drivingLicensesTable.id, license.id)).returning();

  res.json({
    success: true,
    message: "Payment completed successfully. Your license has been issued.",
    data: {
      application: updatedApplication,
      license: normalizeLicense(await getLicenseWithCategory(updatedLicense)),
    },
  });
});

router.post("/licenses/:id/delivery/aramex", requireAuth, async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const found = await findApplicationOrLicense(routeParam(req, "id"), user);
  if (!found) { res.status(404).json({ message: "License or application not found." }); return; }
  if ("forbidden" in found) { res.status(403).json({ message: "Forbidden" }); return; }

  const deliveryAddress = String(req.body?.deliveryAddress ?? "").trim();
  const deliveryCity = String(req.body?.deliveryCity ?? "").trim();
  const deliveryPhone = String(req.body?.deliveryPhone ?? "").trim();
  const deliveryLocationLink = String(req.body?.deliveryLocationLink ?? "").trim();
  const deliveryDate = String(req.body?.deliveryDate ?? "").trim();
  const deliveryTimeSlot = String(req.body?.deliveryTimeSlot ?? "").trim();
  if (deliveryAddress.length < 10) { res.status(400).json({ message: "Delivery address must be at least 10 characters." }); return; }
  if (!deliveryCity) { res.status(400).json({ message: "Delivery city is required." }); return; }
  if (!JORDAN_PHONE_REGEX.test(deliveryPhone)) { res.status(400).json({ message: "Enter a valid Jordanian phone number." }); return; }
  if (!deliveryLocationLink || !/^https?:\/\/.+/i.test(deliveryLocationLink)) { res.status(400).json({ message: "A valid location link is required." }); return; }
  if (!deliveryDate) { res.status(400).json({ message: "Delivery date is required." }); return; }
  if (!deliveryTimeSlot) { res.status(400).json({ message: "Delivery time slot is required." }); return; }

  const application = found.application;
  const license = found.license;
  const status = application?.status ?? (license ? "LICENSE_ISSUED" : null);
  if (!paymentAllowed(status)) {
    res.status(409).json({ message: "Application must be approved before delivery can be requested." });
    return;
  }

  const isPaid = (license?.paymentStatus ?? application?.paymentStatus) === "paid";
  if (!isPaid) {
    res.status(409).json({ message: "License fees must be paid before delivery can be requested." });
    return;
  }
  const aramexTrackingNumber = isPaid ? license?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? generateAramexTrackingNumber() : license?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? null;
  const deliveryStatus = isPaid ? "payment_confirmed" : "pending_payment";

  let updatedApplication = application;
  if (application) {
    [updatedApplication] = await db.update(applicationsTable).set({
      deliveryMethod: "aramex",
      deliveryAddress,
      deliveryCity,
      deliveryPhone,
      deliveryLocationLink,
      deliveryDate,
      deliveryTimeSlot,
      deliveryStatus,
      aramexTrackingNumber,
      updatedAt: new Date(),
    }).where(eq(applicationsTable.id, application.id)).returning();
  }

  let updatedLicense = license;
  if (license) {
    [updatedLicense] = await db.update(drivingLicensesTable).set({
      deliveryMethod: "aramex",
      deliveryAddress,
      deliveryCity,
      deliveryPhone,
      deliveryLocationLink,
      deliveryDate,
      deliveryTimeSlot,
      deliveryStatus,
      aramexTrackingNumber,
    }).where(eq(drivingLicensesTable.id, license.id)).returning();
  }

  res.json({
    application: updatedApplication,
    license: normalizeLicense(await getLicenseWithCategory(updatedLicense ?? null)),
  });
});

export default router;
