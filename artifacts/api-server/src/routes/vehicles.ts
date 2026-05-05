import { Router } from "express";
import { db } from "@workspace/db";
import { vehiclesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/vehicles", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.ownerUserId, userId));
  res.json(vehicles);
});

router.post("/vehicles", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { plateNumber, registrationNumber, vehicleType, brand, model, manufactureYear, color, currentLicenseExpiry } = req.body;
  if (!plateNumber) { res.status(400).json({ message: "plateNumber is required" }); return; }
  const [vehicle] = await db.insert(vehiclesTable).values({
    ownerUserId: userId,
    plateNumber,
    registrationNumber,
    vehicleType,
    brand,
    model,
    manufactureYear: manufactureYear ? Number(manufactureYear) : undefined,
    color,
    currentLicenseExpiry,
  }).returning();
  res.status(201).json(vehicle);
});

export default router;
