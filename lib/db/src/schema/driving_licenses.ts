import { pgTable, text, timestamp, date, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";
import { licenseCategoriesTable } from "./license_categories";

export const drivingLicensesTable = pgTable("driving_licenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applicationsTable.id),
  licenseNumber: text("license_number").notNull().unique(),
  nationalId: text("national_id").notNull(),
  fullNameAr: text("full_name_ar"),
  fullNameEn: text("full_name_en"),
  licenseCategoryId: uuid("license_category_id").references(() => licenseCategoriesTable.id),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  photoUrl: text("photo_url"),
  qrCodeUrl: text("qr_code_url"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDrivingLicenseSchema = createInsertSchema(drivingLicensesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDrivingLicense = z.infer<typeof insertDrivingLicenseSchema>;
export type DrivingLicense = typeof drivingLicensesTable.$inferSelect;
