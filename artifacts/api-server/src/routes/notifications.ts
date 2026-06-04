import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request, Response } from "express";
import { routeParam } from "../lib/route-params";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const notifs = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId)).orderBy(desc(notificationsTable.createdAt));
  res.json(notifs);
});

async function markNotificationRead(req: Request, res: Response) {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [notif] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, routeParam(req, "id")), eq(notificationsTable.userId, userId))).returning();
  if (!notif) { res.status(404).json({ message: "Notification not found" }); return; }
  res.json(notif);
}

async function markAllNotificationsRead(req: Request, res: Response) {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, userId));
  res.json({ message: "All notifications marked as read" });
}

router.post("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.put("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.patch("/notifications/read-all", requireAuth, markAllNotificationsRead);

router.patch("/notifications/:id/read", requireAuth, markNotificationRead);
router.put("/notifications/:id/read", requireAuth, markNotificationRead);
router.post("/notifications/:id/read", requireAuth, markNotificationRead);

export default router;
