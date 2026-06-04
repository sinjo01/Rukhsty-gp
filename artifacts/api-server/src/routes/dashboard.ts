import { Router } from "express";
import { db } from "@workspace/db";
import {
  applicationsTable, appointmentsTable, drivingLicensesTable,
  notificationsTable, userProfilesTable, servicesTable
} from "@workspace/db";
import { eq, and, gt, count, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { autoIssuePendingLicenseForUser } from "../services/license-issuance";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  await autoIssuePendingLicenseForUser(userId);
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId)).orderBy(desc(applicationsTable.createdAt));
  const closedStatuses = ["LICENSE_ISSUED", "LICENSE_RENEWED", "REJECTED", "SECURITY_REJECTED", "CANCELLED"];
  const activeApp = apps.find((a) => !closedStatuses.includes(a.status)) ?? null;
  const [activeService] = activeApp?.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, activeApp.serviceId)).limit(1) : [null];
  const now = new Date();
  const upcomingAppointments = await db.select().from(appointmentsTable).where(
    and(eq(appointmentsTable.userId, userId), eq(appointmentsTable.status, "BOOKED"))
  );
  const [license] = await db.select().from(drivingLicensesTable)
    .where(and(eq(drivingLicensesTable.userId, userId), eq(drivingLicensesTable.status, "ACTIVE")))
    .orderBy(desc(drivingLicensesTable.createdAt))
    .limit(1);
  const [{ value: unreadCount }] = await db.select({ value: count() }).from(notificationsTable).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  let profileCompletionPercent = 0;
  if (profile) {
    const fields = [profile.firstName, profile.secondName, profile.thirdName, profile.familyName, profile.nationalId, profile.phone, profile.governorate, profile.personalPhotoUrl, profile.idFrontUrl, profile.idBackUrl];
    const filled = fields.filter(Boolean).length;
    profileCompletionPercent = Math.round((filled / fields.length) * 100);
  }
  res.json({
    totalApplications: apps.length,
    activeApplication: activeApp ? { ...activeApp, service: activeService ?? null } : null,
    upcomingAppointments: upcomingAppointments.length,
    unreadNotifications: Number(unreadCount),
    myLicense: license ?? null,
    profileCompletionPercent,
  });
});

export default router;
