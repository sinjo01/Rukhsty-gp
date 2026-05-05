import { Router } from "express";
import { db } from "@workspace/db";
import {
  applicationsTable, appointmentsTable, drivingLicensesTable,
  notificationsTable, userProfilesTable
} from "@workspace/db";
import { eq, and, gt, count } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId));
  const activeApp = apps.find((a) => !["LICENSE_ISSUED", "REJECTED", "CANCELLED"].includes(a.status)) ?? null;
  const now = new Date();
  const upcomingAppointments = await db.select().from(appointmentsTable).where(
    and(eq(appointmentsTable.userId, userId), eq(appointmentsTable.status, "BOOKED"))
  );
  const [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.userId, userId)).limit(1);
  const [{ value: unreadCount }] = await db.select({ value: count() }).from(notificationsTable).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  let profileCompletionPercent = 0;
  if (profile) {
    const fields = [profile.firstName, profile.secondName, profile.thirdName, profile.familyName, profile.nationalId, profile.phone, profile.governorate, profile.personalPhotoUrl, profile.idFrontUrl, profile.idBackUrl];
    const filled = fields.filter(Boolean).length;
    profileCompletionPercent = Math.round((filled / fields.length) * 100);
  }
  res.json({
    totalApplications: apps.length,
    activeApplication: activeApp,
    upcomingAppointments: upcomingAppointments.length,
    unreadNotifications: Number(unreadCount),
    myLicense: license ?? null,
    profileCompletionPercent,
  });
});

export default router;
