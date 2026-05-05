import { pgTable, text, timestamp, boolean, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalCentersTable = pgTable("medical_centers", {
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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMedicalCenterSchema = createInsertSchema(medicalCentersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMedicalCenter = z.infer<typeof insertMedicalCenterSchema>;
export type MedicalCenter = typeof medicalCentersTable.$inferSelect;
