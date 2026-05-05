import { Router } from "express";
import { db } from "@workspace/db";
import { centersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/centers", async (req, res) => {
  const { centerType, governorate } = req.query as { centerType?: string; governorate?: string };
  const conditions = [eq(centersTable.isActive, true)];
  if (centerType) conditions.push(eq(centersTable.centerType, centerType));
  if (governorate) conditions.push(eq(centersTable.governorate, governorate));
  const centers = await db.select().from(centersTable).where(and(...conditions));
  res.json(centers);
});

router.get("/centers/:id", async (req, res) => {
  const [center] = await db.select().from(centersTable).where(eq(centersTable.id, req.params.id)).limit(1);
  if (!center) { res.status(404).json({ message: "Center not found" }); return; }
  res.json(center);
});

export default router;
