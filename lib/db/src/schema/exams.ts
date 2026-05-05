import { pgTable, text, timestamp, integer, numeric, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { centersTable } from "./centers";
import { usersTable } from "./users";

export const examsTable = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  officerId: uuid("officer_id").references(() => usersTable.id),
  examType: text("exam_type").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }),
  result: text("result").notNull(),
  attemptNumber: integer("attempt_number").notNull().default(1),
  notes: text("notes"),
  examDate: timestamp("exam_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(examsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;
