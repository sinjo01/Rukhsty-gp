import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applicationsTable.id, {
    onDelete: "set null",
  }),
  documentType: text("document_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  verificationStatus: text("verification_status").notNull().default("PENDING"),
  verifiedBy: uuid("verified_by").references(() => usersTable.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
