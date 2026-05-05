import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";
import { appointmentsTable } from "./appointments";

export const testTypeEnum = pgEnum("test_type", ["vision", "theory"]);
export const testOutcomeEnum = pgEnum("test_outcome", ["pass", "fail", "absent"]);

export const testResultsTable = pgTable("test_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointmentsTable.id),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => usersTable.id),
  testType: testTypeEnum("test_type").notNull(),
  outcome: testOutcomeEnum("outcome").notNull(),
  score: integer("score"),
  passingScore: integer("passing_score"),
  notes: text("notes"),
  recordedByStaffId: uuid("recorded_by_staff_id")
    .notNull()
    .references(() => usersTable.id),
  testedAt: timestamp("tested_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
