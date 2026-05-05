import { Router } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.get("/profile", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ message: "Profile not found" }); return; }
  res.json(profile);
});

router.put("/profile", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { firstName, secondName, thirdName, familyName, age, nationalId, phone, governorate, city, area, address, personalPhotoUrl, idFrontUrl, idBackUrl } = req.body;
  const existing = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const isComplete = !!(firstName && secondName && thirdName && familyName && age && nationalId);
  if (existing.length === 0) {
    const [profile] = await db.insert(userProfilesTable).values({
      userId,
      firstName: firstName ?? "",
      secondName: secondName ?? "",
      thirdName: thirdName ?? "",
      familyName: familyName ?? "",
      age: age ? Number(age) : 18,
      nationalId: nationalId ?? "",
      phone,
      governorate,
      city,
      area,
      address,
      personalPhotoUrl,
      idFrontUrl,
      idBackUrl,
      profileStatus: isComplete ? "COMPLETE" : "INCOMPLETE",
    }).returning();
    res.json(profile);
  } else {
    const [profile] = await db.update(userProfilesTable).set({
      firstName,
      secondName,
      thirdName,
      familyName,
      age: age ? Number(age) : undefined,
      nationalId,
      phone,
      governorate,
      city,
      area,
      address,
      personalPhotoUrl,
      idFrontUrl,
      idBackUrl,
      profileStatus: isComplete ? "COMPLETE" : "INCOMPLETE",
      updatedAt: new Date(),
    }).where(eq(userProfilesTable.userId, userId)).returning();
    res.json(profile);
  }
});

export default router;
