import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";
import { timeSlotsTable } from "./time_slots";
import { drivingCentersTable } from "./driving_centers";
import { medicalCentersTable } from "./medical_centers";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => usersTable.id),
  timeSlotId: uuid("time_slot_id")
    .notNull()
    .references(() => timeSlotsTable.id),
  drivingCenterId: uuid("driving_center_id").references(
    () => drivingCentersTable.id
  ),
  medicalCenterId: uuid("medical_center_id").references(
    () => medicalCentersTable.id
  ),
  appointmentType: text("appointment_type").notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  confirmedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
