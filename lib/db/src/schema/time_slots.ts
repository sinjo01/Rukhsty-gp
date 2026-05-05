import { pgTable, text, timestamp, integer, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { drivingCentersTable } from "./driving_centers";
import { medicalCentersTable } from "./medical_centers";

export const slotTypeEnum = pgEnum("slot_type", ["vision_test", "theory_test"]);

export const timeSlotsTable = pgTable("time_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotType: slotTypeEnum("slot_type").notNull(),
  drivingCenterId: uuid("driving_center_id").references(
    () => drivingCentersTable.id,
    { onDelete: "cascade" }
  ),
  medicalCenterId: uuid("medical_center_id").references(
    () => medicalCentersTable.id,
    { onDelete: "cascade" }
  ),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  capacity: integer("capacity").notNull().default(1),
  bookedCount: integer("booked_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlotsTable).omit({
  id: true,
  bookedCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlotsTable.$inferSelect;
