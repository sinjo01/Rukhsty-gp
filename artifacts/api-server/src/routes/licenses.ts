import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, drivingLicensesTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";
import { autoIssuePendingLicenseForUser, getLicenseWithCategory, issueLicenseForApplication } from "../services/license-issuance";

const router = Router();

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

export default router;
