import { date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { servicesTable } from "./services";
import { licenseCategoriesTable } from "./license_categories";

export const applicationsTable = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => servicesTable.id),
  licenseCategoryId: uuid("license_category_id").references(() => licenseCategoriesTable.id),
  applicationNumber: text("application_number").notNull().unique(),
  status: text("status").notNull().default("DRAFT"),
  currentStep: text("current_step").notNull().default("PROFILE_REVIEW"),
  governorate: text("governorate"),
  residenceArea: text("residence_area"),
  rejectionReason: text("rejection_reason"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }).default("3.00"),
  paymentReference: text("payment_reference"),
  paymentPaidAt: timestamp("payment_paid_at"),
  deliveryMethod: text("delivery_method"),
  deliveryStatus: text("delivery_status").default("not_requested"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryPhone: text("delivery_phone"),
  deliveryLocationLink: text("delivery_location_link"),
  deliveryDate: date("delivery_date"),
  deliveryTimeSlot: text("delivery_time_slot"),
  aramexTrackingNumber: text("aramex_tracking_number"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  completedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
