import { pgTable, text, timestamp, integer, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vehiclesTable = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  plateNumber: text("plate_number").notNull().unique(),
  registrationNumber: text("registration_number"),
  vehicleType: text("vehicle_type"),
  brand: text("brand"),
  make: text("make"),
  model: text("model"),
  manufactureYear: integer("manufacture_year"),
  year: integer("year"),
  color: text("color"),
  chassisNumber: text("chassis_number"),
  ownerNationalId: text("owner_national_id"),
  currentLicenseExpiry: date("current_license_expiry"),
  registrationExpiryDate: date("registration_expiry_date"),
  insuranceStatus: text("insurance_status").notNull().default("VALID"),
  technicalInspectionStatus: text("technical_inspection_status").notNull().default("PASSED"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
