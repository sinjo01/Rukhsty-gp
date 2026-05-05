import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const licenseTypeEnum = pgEnum("license_type", [
  "car",
  "motorcycle",
  "truck",
  "bus",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "documents_under_review",
  "documents_approved",
  "documents_rejected",
  "vision_test_scheduled",
  "vision_test_passed",
  "vision_test_failed",
  "theory_test_scheduled",
  "theory_test_passed",
  "theory_test_failed",
  "approved",
  "rejected",
  "cancelled",
]);

export const applicationsTable = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationNumber: text("application_number").notNull().unique(),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  licenseType: licenseTypeEnum("license_type").notNull().default("car"),
  status: applicationStatusEnum("status").notNull().default("draft"),
  reviewedByAdminId: uuid("reviewed_by_admin_id").references(
    () => usersTable.id
  ),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  reviewedAt: true,
  approvedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
