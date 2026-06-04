import { db } from "@workspace/db";
import {
  applicationsTable,
  applicationStepsTable,
  drivingLicensesTable,
  licenseCategoriesTable,
  notificationsTable,
  userProfilesTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

const ELIGIBLE_STATUSES = ["PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_PASSED", "LICENSE_ISSUANCE", "LICENSE_ISSUED"];
const ELIGIBLE_STEPS = ["PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_BOOKING", "LICENSE_ISSUANCE"];

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function profileFullName(profile: typeof userProfilesTable.$inferSelect | null) {
  return [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.familyName].filter(Boolean).join(" ");
}

async function generateUniqueLicenseNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 8; i += 1) {
    const licenseNumber = `JO-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [existing] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.licenseNumber, licenseNumber)).limit(1);
    if (!existing) return licenseNumber;
  }
  return `JO-${year}-${Date.now().toString().slice(-6)}`;
}

export async function issueLicenseForApplication(applicationId: string, _issuedBy?: string | null) {
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
  if (!app) throw Object.assign(new Error("Application not found"), { statusCode: 404 });

  const isEligible = ELIGIBLE_STATUSES.includes(app.status) || ELIGIBLE_STEPS.includes(app.currentStep ?? "");
  if (!isEligible) throw Object.assign(new Error("Application is not eligible for license issuance"), { statusCode: 409 });

  const [existingByApplication] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.applicationId, applicationId)).limit(1);
  if (existingByApplication) {
    await completeIssuedApplication(app.id);
    return existingByApplication;
  }

  if (app.licenseCategoryId) {
    const [existingByUserAndCategory] = await db.select().from(drivingLicensesTable).where(and(
      eq(drivingLicensesTable.userId, app.userId),
      eq(drivingLicensesTable.licenseCategoryId, app.licenseCategoryId),
      eq(drivingLicensesTable.status, "ACTIVE"),
    )).limit(1);
    if (existingByUserAndCategory) {
      await completeIssuedApplication(app.id);
      return existingByUserAndCategory;
    }
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, app.userId)).limit(1);
  const issueDate = new Date();
  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 10);
  const licenseNumber = await generateUniqueLicenseNumber();
  const qrPayload = JSON.stringify({
    licenseNumber,
    nationalId: profile?.nationalId ?? "UNKNOWN",
    issueDate: toIsoDate(issueDate),
    status: "ACTIVE",
  });

  const [license] = await db.insert(drivingLicensesTable).values({
    userId: app.userId,
    applicationId: app.id,
    licenseNumber,
    nationalId: profile?.nationalId ?? "UNKNOWN",
    fullNameAr: profileFullName(profile ?? null),
    fullNameEn: profileFullName(profile ?? null),
    licenseCategoryId: app.licenseCategoryId,
    issueDate: toIsoDate(issueDate),
    expiryDate: toIsoDate(expiryDate),
    status: "ACTIVE",
    photoUrl: profile?.personalPhotoUrl,
    qrCodeUrl: qrPayload,
  }).returning();

  await completeIssuedApplication(app.id);
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: "License issued",
    message: "Congratulations! You passed the practical exam and received your driving license. مبروك! لقد اجتزت الامتحان العملي وحصلت على الرخصة.",
    type: "SUCCESS",
  });
  return license;
}

export async function getLicenseWithCategory(license: typeof drivingLicensesTable.$inferSelect | null) {
  if (!license) return null;
  const [category] = license.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, license.licenseCategoryId)).limit(1) : [null];
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, license.userId)).limit(1);
  return {
    ...license,
    licenseCategory: category ?? null,
    dateOfBirth: profile?.dateOfBirth ?? null,
    address: profile?.address ?? null,
    governorate: profile?.governorate ?? null,
    bloodGroup: (profile as any)?.bloodGroup ?? null,
    profilePhotoUrl: license.photoUrl ?? profile?.personalPhotoUrl ?? null,
  };
}

export async function autoIssuePendingLicenseForUser(userId: string) {
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId));
  const pending = apps.find((app) => app.status === "PRACTICAL_PASSED" || app.currentStep === "LICENSE_ISSUANCE");
  if (!pending) return null;
  const [existing] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.applicationId, pending.id)).limit(1);
  if (existing) return existing;
  return issueLicenseForApplication(pending.id, null);
}

async function completeIssuedApplication(applicationId: string) {
  await db.update(applicationsTable).set({
    status: "LICENSE_ISSUED",
    currentStep: "LICENSE_ISSUANCE",
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, applicationId));
  await db.update(applicationStepsTable).set({ status: "COMPLETED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "LICENSE_ISSUANCE")));
}
