import { pgTable, text, timestamp, boolean, uuid, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const centerStatusEnum = pgEnum("center_status", [
  "active",
  "inactive",
  "suspended",
]);

export const drivingCentersTable = pgTable("driving_centers", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email"),
  addressAr: text("address_ar").notNull(),
  addressEn: text("address_en").notNull(),
  city: text("city").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: centerStatusEnum("status").notNull().default("active"),
  offersVisionTest: boolean("offers_vision_test").notNull().default(false),
  offersTheoryTest: boolean("offers_theory_test").notNull().default(true),
  offersDrivingTraining: boolean("offers_driving_training").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDrivingCenterSchema = createInsertSchema(drivingCentersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDrivingCenter = z.infer<typeof insertDrivingCenterSchema>;
export type DrivingCenter = typeof drivingCentersTable.$inferSelect;
