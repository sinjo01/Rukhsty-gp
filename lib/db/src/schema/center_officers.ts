import { pgTable, text, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { centersTable } from "./centers";

export const centerOfficersTable = pgTable("center_officers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id")
    .notNull()
    .references(() => centersTable.id, { onDelete: "cascade" }),
  positionTitle: text("position_title"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCenterOfficerSchema = createInsertSchema(centerOfficersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCenterOfficer = z.infer<typeof insertCenterOfficerSchema>;
export type CenterOfficer = typeof centerOfficersTable.$inferSelect;
