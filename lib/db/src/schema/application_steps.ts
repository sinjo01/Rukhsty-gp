import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const applicationStepsTable = pgTable("application_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  stepKey: text("step_key").notNull(),
  stepNameAr: text("step_name_ar").notNull(),
  stepNameEn: text("step_name_en").notNull(),
  status: text("status").notNull().default("PENDING"),
  orderNumber: integer("order_number").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertApplicationStepSchema = createInsertSchema(applicationStepsTable).omit({
  id: true,
});

export type InsertApplicationStep = z.infer<typeof insertApplicationStepSchema>;
export type ApplicationStep = typeof applicationStepsTable.$inferSelect;
