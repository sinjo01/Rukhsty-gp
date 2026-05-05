import { pgTable, text, timestamp, integer, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const profileStatusEnum = pgEnum("profile_status", [
  "INCOMPLETE",
  "COMPLETE",
]);

export const userProfilesTable = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  secondName: text("second_name").notNull(),
  thirdName: text("third_name").notNull(),
  familyName: text("family_name").notNull(),
  age: integer("age").notNull(),
  nationalId: text("national_id").notNull().unique(),
  phone: text("phone"),
  governorate: text("governorate"),
  city: text("city"),
  area: text("area"),
  address: text("address"),
  personalPhotoUrl: text("personal_photo_url"),
  idFrontUrl: text("id_front_url"),
  idBackUrl: text("id_back_url"),
  profileStatus: profileStatusEnum("profile_status").notNull().default("INCOMPLETE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
