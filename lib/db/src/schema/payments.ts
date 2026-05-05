import { pgTable, text, timestamp, numeric, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";
import { usersTable } from "./users";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applicationsTable.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").references(() => usersTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("JOD"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").notNull().default("PENDING"),
  transactionReference: text("transaction_reference"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
