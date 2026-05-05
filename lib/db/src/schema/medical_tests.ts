import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { centersTable } from "./centers";
import { usersTable } from "./users";

export const medicalTestsTable = pgTable("medical_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  officerId: uuid("officer_id").references(() => usersTable.id),
  result: text("result").notNull(),
  leftEyeScore: text("left_eye_score"),
  rightEyeScore: text("right_eye_score"),
  requiresGlasses: boolean("requires_glasses").notNull().default(false),
  isAllowedToDrive: boolean("is_allowed_to_drive").notNull().default(true),
  notes: text("notes"),
  testedAt: timestamp("tested_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMedicalTestSchema = createInsertSchema(medicalTestsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMedicalTest = z.infer<typeof insertMedicalTestSchema>;
export type MedicalTest = typeof medicalTestsTable.$inferSelect;
