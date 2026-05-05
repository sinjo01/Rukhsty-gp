import { pgTable, text, boolean, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const centersTable = pgTable("centers", {
  id: uuid("id").primaryKey().defaultRandom(),
  centerType: text("center_type").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en"),
  governorate: text("governorate").notNull(),
  city: text("city"),
  area: text("area"),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCenterSchema = createInsertSchema(centersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCenter = z.infer<typeof insertCenterSchema>;
export type Center = typeof centersTable.$inferSelect;
