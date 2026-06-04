import { Router } from "express";
import { db } from "@workspace/db";
import { centersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/centers", async (req, res) => {
  const { centerType, type, governorate } = req.query as { centerType?: string; type?: string; governorate?: string };
  const conditions = [eq(centersTable.isActive, true)];
  const requestedType = centerType ?? type;
  if (requestedType) {
    const aliases: Record<string, string[]> = {
      HEALTH_CENTER: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
      health_center: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
      MEDICAL_TEST: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
      VISION_TEST: ["HEALTH_CENTER", "MEDICAL", "MEDICAL_CENTER"],
      EXAM_CENTER: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER"],
      licensing_center: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER", "PRACTICAL_EXAM_CENTER", "PRACTICAL_EXAM", "PRACTICAL_CENTER"],
      THEORY_EXAM: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER"],
      PRACTICAL_EXAM_CENTER: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER", "PRACTICAL_EXAM_CENTER", "PRACTICAL_EXAM", "PRACTICAL_CENTER"],
      PRACTICAL_EXAM: ["EXAM_CENTER", "THEORY_EXAM", "THEORY_EXAM_CENTER", "PRACTICAL_EXAM_CENTER", "PRACTICAL_EXAM", "PRACTICAL_CENTER"],
    };
    const values = aliases[requestedType] ?? [requestedType];
    conditions.push(values.length === 1 ? eq(centersTable.centerType, values[0]) : inArray(centersTable.centerType, values));
  }
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
