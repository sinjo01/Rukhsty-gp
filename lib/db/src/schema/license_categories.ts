import { pgTable, text, boolean, integer, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const licenseCategoriesTable = pgTable("license_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  minimumAge: integer("minimum_age").notNull().default(18),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLicenseCategorySchema = createInsertSchema(licenseCategoriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLicenseCategory = z.infer<typeof insertLicenseCategorySchema>;
export type LicenseCategory = typeof licenseCategoriesTable.$inferSelect;
