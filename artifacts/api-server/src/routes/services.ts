import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable, licenseCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/services", async (_req, res) => {
  const services = await db.select().from(servicesTable).where(eq(servicesTable.isActive, true));
  res.json(services);
});

router.get("/license-categories", async (_req, res) => {
  const cats = await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.isActive, true));
  res.json(cats);
});

export default router;
