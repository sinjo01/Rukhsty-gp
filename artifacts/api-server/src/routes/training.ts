import { Router } from "express";
import { db } from "@workspace/db";
import { trainingRecordsTable, centersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

router.get("/training/:applicationId", requireAuth, async (req, res) => {
  const [record] = await db.select().from(trainingRecordsTable).where(eq(trainingRecordsTable.applicationId, routeParam(req, "applicationId"))).limit(1);
  if (!record) { res.status(404).json({ message: "Training record not found" }); return; }
  const [center] = record.centerId ? await db.select().from(centersTable).where(eq(centersTable.id, record.centerId)).limit(1) : [null];
  res.json({ ...record, center: center ?? null });
});

export default router;
