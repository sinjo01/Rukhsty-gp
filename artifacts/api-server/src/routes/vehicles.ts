import { Router } from "express";
import { db, pool } from "@workspace/db";
import { applicationsTable, notificationsTable, paymentsTable, servicesTable, userProfilesTable, vehiclesTable } from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

const ACTIVE_VEHICLE_RENEWAL_STATUSES = [
  "VEHICLE_RENEWAL_SUBMITTED",
  "VEHICLE_ELIGIBILITY_CHECK",
  "INSURANCE_REQUIRED",
  "TECHNICAL_INSPECTION_REQUIRED",
  "VEHICLE_PAYMENT_PENDING",
];

let schemaReady: Promise<void> | null = null;

function addYears(dateValue: string | Date | null | undefined, years: number) {
  const base = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const start = Number.isNaN(base.getTime()) || base < new Date() ? new Date() : base;
  start.setFullYear(start.getFullYear() + years);
  return start.toISOString().slice(0, 10);
}

async function ensureVehicleColumns() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS make text`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year integer`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis_number text`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_national_id text`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiry_date date`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_status text NOT NULL DEFAULT 'VALID'`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS technical_inspection_status text NOT NULL DEFAULT 'PASSED'`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE'`);
      await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now()`);
    })();
  }
  return schemaReady;
}

async function ensureService(code: string, nameEn: string, nameAr: string, description: string) {
  const [existing] = await db.select().from(servicesTable).where(eq(servicesTable.code, code)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(servicesTable).values({ code, nameEn, nameAr, description, isActive: true }).returning();
  return created;
}

function normalizeVehicle(vehicle: any) {
  if (!vehicle) return null;
  return {
    ...vehicle,
    make: vehicle.make ?? vehicle.brand ?? null,
    brand: vehicle.brand ?? vehicle.make ?? null,
    year: vehicle.year ?? vehicle.manufactureYear ?? null,
    manufactureYear: vehicle.manufactureYear ?? vehicle.year ?? null,
    registrationExpiryDate: vehicle.registrationExpiryDate ?? vehicle.currentLicenseExpiry ?? null,
    currentLicenseExpiry: vehicle.currentLicenseExpiry ?? vehicle.registrationExpiryDate ?? null,
    insuranceStatus: vehicle.insuranceStatus ?? "VALID",
    technicalInspectionStatus: vehicle.technicalInspectionStatus ?? "PASSED",
    status: vehicle.status ?? "ACTIVE",
  };
}

router.get("/vehicles", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const vehicles = await db.select().from(vehiclesTable).where(eq(vehiclesTable.ownerUserId, userId));
  res.json(vehicles.map(normalizeVehicle));
});

router.post("/vehicles", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const body = req.body ?? {};
  const plateNumber = body.plateNumber;
  if (!plateNumber) { res.status(400).json({ message: "plateNumber is required" }); return; }

  const [vehicle] = await db.insert(vehiclesTable).values({
    ownerUserId: userId,
    plateNumber,
    registrationNumber: body.registrationNumber,
    vehicleType: body.vehicleType,
    brand: body.brand ?? body.make,
    make: body.make ?? body.brand,
    model: body.model,
    manufactureYear: body.manufactureYear ?? body.year ? Number(body.manufactureYear ?? body.year) : undefined,
    year: body.year ?? body.manufactureYear ? Number(body.year ?? body.manufactureYear) : undefined,
    color: body.color,
    chassisNumber: body.chassisNumber,
    ownerNationalId: body.ownerNationalId,
    currentLicenseExpiry: body.currentLicenseExpiry ?? body.registrationExpiryDate,
    registrationExpiryDate: body.registrationExpiryDate ?? body.currentLicenseExpiry,
    insuranceStatus: body.insuranceStatus ?? "VALID",
    technicalInspectionStatus: body.technicalInspectionStatus ?? "PASSED",
    status: body.status ?? "ACTIVE",
    updatedAt: new Date(),
  }).returning();
  res.status(201).json(normalizeVehicle(vehicle));
});

router.get("/vehicles/:id", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, routeParam(req, "id")), eq(vehiclesTable.ownerUserId, userId))).limit(1);
  if (!vehicle) { res.status(404).json({ message: "Vehicle not found" }); return; }
  res.json(normalizeVehicle(vehicle));
});

router.post("/services/renew-vehicle-registration/apply", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { vehicleId } = req.body ?? {};
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, vehicleId), eq(vehiclesTable.ownerUserId, userId))).limit(1);
  if (!vehicle) { res.status(404).json({ message: "Vehicle not found" }); return; }

  const service = await ensureService("RENEW_VEHICLE_REGISTRATION", "Renew Vehicle Registration", "تجديد ترخيص المركبة", "Renew an existing vehicle registration.");
  const activeApps = await db.select().from(applicationsTable).where(and(
    eq(applicationsTable.userId, userId),
    eq(applicationsTable.serviceId, service.id),
    eq(applicationsTable.residenceArea, `VEHICLE:${vehicle.id}`),
    inArray(applicationsTable.status, ACTIVE_VEHICLE_RENEWAL_STATUSES),
  ));
  if (activeApps[0]) {
    res.json({ application: activeApps[0], vehicle: normalizeVehicle(vehicle), duplicate: true });
    return;
  }

  const normalized = normalizeVehicle(vehicle)!;
  const nextStatus = normalized.insuranceStatus !== "VALID"
    ? "INSURANCE_REQUIRED"
    : normalized.technicalInspectionStatus !== "PASSED"
    ? "TECHNICAL_INSPECTION_REQUIRED"
    : "VEHICLE_PAYMENT_PENDING";
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const [application] = await db.insert(applicationsTable).values({
    userId,
    serviceId: service.id,
    applicationNumber: `VR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: nextStatus,
    currentStep: nextStatus,
    governorate: (profile as any)?.governorate ?? "Amman",
    residenceArea: `VEHICLE:${vehicle.id}`,
    submittedAt: new Date(),
  }).returning();

  res.status(201).json({ application, vehicle: normalized });
});

router.post("/services/renew-vehicle-registration/insurance", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { vehicleId, applicationId } = req.body ?? {};
  const [vehicle] = await db.update(vehiclesTable).set({ insuranceStatus: "VALID", updatedAt: new Date() }).where(and(eq(vehiclesTable.id, vehicleId), eq(vehiclesTable.ownerUserId, userId))).returning();
  if (!vehicle) { res.status(404).json({ message: "Vehicle not found" }); return; }
  if (applicationId) {
    const next = normalizeVehicle(vehicle)!.technicalInspectionStatus !== "PASSED" ? "TECHNICAL_INSPECTION_REQUIRED" : "VEHICLE_PAYMENT_PENDING";
    await db.update(applicationsTable).set({ status: next, currentStep: next, updatedAt: new Date() }).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId)));
  }
  res.json({ vehicle: normalizeVehicle(vehicle) });
});

router.post("/services/renew-vehicle-registration/pay", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId } = req.body ?? {};
  const [application] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!application) { res.status(404).json({ message: "Application not found" }); return; }
  await db.insert(paymentsTable).values({
    applicationId: application.id,
    userId,
    amount: "36.00",
    currency: "JOD",
    paymentMethod: "MOCK_CARD",
    paymentStatus: "PAID",
    transactionReference: `MOCK-VEH-${Date.now()}`,
    paidAt: new Date(),
  });
  const [updated] = await db.update(applicationsTable).set({ status: "VEHICLE_PAYMENT_PENDING", currentStep: "VEHICLE_PAYMENT_PENDING", updatedAt: new Date() }).where(eq(applicationsTable.id, application.id)).returning();
  res.json({ application: updated, payment: { status: "PAID", total: 36 } });
});

router.post("/services/renew-vehicle-registration/complete", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId, vehicleId } = req.body ?? {};
  const [application] = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId))).limit(1);
  if (!application) { res.status(404).json({ message: "Application not found" }); return; }
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, vehicleId), eq(vehiclesTable.ownerUserId, userId))).limit(1);
  if (!vehicle) { res.status(404).json({ message: "Vehicle not found" }); return; }

  const normalized = normalizeVehicle(vehicle)!;
  const newExpiry = addYears(normalized.registrationExpiryDate, 1);
  const [renewedVehicle] = await db.update(vehiclesTable).set({
    currentLicenseExpiry: newExpiry,
    registrationExpiryDate: newExpiry,
    status: "ACTIVE",
    updatedAt: new Date(),
  }).where(eq(vehiclesTable.id, vehicle.id)).returning();
  const [updatedApp] = await db.update(applicationsTable).set({ status: "VEHICLE_REGISTRATION_RENEWED", currentStep: "VEHICLE_REGISTRATION_RENEWED", completedAt: new Date(), updatedAt: new Date() }).where(eq(applicationsTable.id, application.id)).returning();
  await db.insert(notificationsTable).values({
    userId,
    title: "Vehicle registration renewed",
    message: "Vehicle registration renewed successfully.",
    type: "SUCCESS",
  });
  res.json({ application: updatedApp, vehicle: normalizeVehicle(renewedVehicle), newExpiryDate: newExpiry });
});

router.get("/vehicles/:id/registration-document", requireAuth, async (req, res) => {
  await ensureVehicleColumns();
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [vehicle] = await db.select().from(vehiclesTable).where(and(eq(vehiclesTable.id, routeParam(req, "id")), eq(vehiclesTable.ownerUserId, userId))).limit(1);
  if (!vehicle) { res.status(404).json({ message: "Vehicle not found" }); return; }
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  res.json({
    document: {
      vehicle: normalizeVehicle(vehicle),
      owner: profile ?? null,
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: normalizeVehicle(vehicle)!.registrationExpiryDate,
      status: "ACTIVE",
    },
  });
});

export default router;
