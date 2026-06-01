import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, centersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

router.get("/appointments", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const apts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.userId, userId));
  const withCenter = await Promise.all(apts.map(async (apt) => {
    if (!apt.centerId) return { ...apt, center: null };
    const [center] = await db.select().from(centersTable).where(eq(centersTable.id, apt.centerId)).limit(1);
    return { ...apt, center: center ?? null };
  }));
  res.json(withCenter);
});

router.post("/appointments", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId, centerId, appointmentType, appointmentDate, startTime, endTime, notes } = req.body;
  if (!applicationId || !appointmentType || !appointmentDate || !startTime || !endTime) {
    res.status(400).json({ message: "Missing required fields" }); return;
  }
  const queueNumber = Math.floor(Math.random() * 50) + 1;
  const [apt] = await db.insert(appointmentsTable).values({
    userId,
    applicationId,
    centerId: centerId ?? null,
    appointmentType,
    appointmentDate,
    startTime,
    endTime,
    queueNumber,
    status: "BOOKED",
    notes,
  }).returning();
  await db.insert(notificationsTable).values({
    userId,
    title: "تم حجز موعدك",
    message: `تم حجز موعدك بنجاح بتاريخ ${appointmentDate} الساعة ${startTime}. رقم دورك: ${queueNumber}`,
    type: "INFO",
  });
  const [center] = centerId ? await db.select().from(centersTable).where(eq(centersTable.id, centerId)).limit(1) : [null];
  res.status(201).json({ ...apt, center: center ?? null });
});

async function cancelAppointment(req: Request, res: Response) {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [apt] = await db.update(appointmentsTable).set({ status: "CANCELLED", updatedAt: new Date() }).where(and(eq(appointmentsTable.id, routeParam(req, "id")), eq(appointmentsTable.userId, userId))).returning();
  if (!apt) { res.status(404).json({ message: "Appointment not found" }); return; }
  res.json(apt);
}

router.post("/appointments/:id/cancel", requireAuth, cancelAppointment);
router.delete("/appointments/:id", requireAuth, cancelAppointment);

export default router;
