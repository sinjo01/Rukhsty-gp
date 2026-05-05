import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { centersTable } from "./centers";

export const trainingRecordsTable = pgTable("training_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  theoreticalLessonsRequired: integer("theoretical_lessons_required").notNull().default(20),
  practicalLessonsRequired: integer("practical_lessons_required").notNull().default(40),
  theoreticalLessonsCompleted: integer("theoretical_lessons_completed").notNull().default(0),
  practicalLessonsCompleted: integer("practical_lessons_completed").notNull().default(0),
  status: text("status").notNull().default("NOT_STARTED"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  instructorName: text("instructor_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTrainingRecordSchema = createInsertSchema(trainingRecordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;
export type TrainingRecord = typeof trainingRecordsTable.$inferSelect;
