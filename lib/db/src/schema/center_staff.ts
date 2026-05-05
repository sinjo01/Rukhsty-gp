import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { drivingCentersTable } from "./driving_centers";
import { medicalCentersTable } from "./medical_centers";

export const centerTypeEnum = pgEnum("center_type", ["driving", "medical"]);

export const centerStaffTable = pgTable("center_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  centerType: centerTypeEnum("center_type").notNull(),
  drivingCenterId: uuid("driving_center_id").references(
    () => drivingCentersTable.id,
    { onDelete: "cascade" }
  ),
  medicalCenterId: uuid("medical_center_id").references(
    () => medicalCentersTable.id,
    { onDelete: "cascade" }
  ),
  role: text("role").notNull().default("staff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCenterStaffSchema = createInsertSchema(centerStaffTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCenterStaff = z.infer<typeof insertCenterStaffSchema>;
export type CenterStaff = typeof centerStaffTable.$inferSelect;
