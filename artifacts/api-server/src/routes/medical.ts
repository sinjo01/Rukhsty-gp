import { Router } from "express";
import { db } from "@workspace/db";
import { medicalTestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { routeParam } from "../lib/route-params";

const router = Router();

router.get("/medical/:applicationId", requireAuth, async (req, res) => {
  const [test] = await db.select().from(medicalTestsTable).where(eq(medicalTestsTable.applicationId, routeParam(req, "applicationId"))).limit(1);
  if (!test) { res.status(404).json({ message: "Medical test not found" }); return; }
  res.json(test);
});

export default router;
