import { Router } from "express";
import { db } from "@workspace/db";
import { drivingLicensesTable, licenseCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/license", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.userId, userId)).limit(1);
  if (!license) { res.status(404).json({ message: "No license found" }); return; }
  const [category] = license.licenseCategoryId ? await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.id, license.licenseCategoryId)).limit(1) : [null];
  res.json({ ...license, licenseCategory: category ?? null });
});

export default router;
