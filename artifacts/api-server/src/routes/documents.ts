import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/documents", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, userId));
  res.json(docs);
});

router.post("/documents", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { documentType, fileUrl, fileName, mimeType, applicationId } = req.body;
  if (!documentType || !fileUrl) { res.status(400).json({ message: "documentType and fileUrl required" }); return; }
  const [doc] = await db.insert(documentsTable).values({
    userId,
    applicationId: applicationId ?? null,
    documentType,
    fileUrl,
    fileName,
    mimeType,
    verificationStatus: "PENDING",
  }).returning();
  res.status(201).json(doc);
});

export default router;
