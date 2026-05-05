import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const notifs = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId)).orderBy(desc(notificationsTable.createdAt));
  res.json(notifs);
});

router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [notif] = await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, req.params.id), eq(notificationsTable.userId, userId))).returning();
  if (!notif) { res.status(404).json({ message: "Notification not found" }); return; }
  res.json(notif);
});

router.put("/notifications/read-all", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
