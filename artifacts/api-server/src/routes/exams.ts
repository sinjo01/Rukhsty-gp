import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { routeParam } from "../lib/route-params";

const router = Router();

router.get("/exams/:applicationId", requireAuth, async (req, res) => {
  const records = await db.select().from(examsTable).where(eq(examsTable.applicationId, routeParam(req, "applicationId")));
  res.json(records);
});

export default router;
