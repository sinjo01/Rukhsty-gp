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
  model: text("model"),
  manufactureYear: integer("manufacture_year"),
  color: text("color"),
  currentLicenseExpiry: date("current_license_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
