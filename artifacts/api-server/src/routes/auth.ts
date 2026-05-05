import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken, requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { email, password, firstName, secondName, thirdName, familyName, age, nationalId, phone, governorate, city, area, address, personalPhotoUrl, idFrontUrl, idBackUrl } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, role: "USER" }).returning();
  if (firstName && nationalId) {
    await db.insert(userProfilesTable).values({
      userId: user.id,
      firstName: firstName ?? "",
      secondName: secondName ?? "",
      thirdName: thirdName ?? "",
      familyName: familyName ?? "",
      age: age ? Number(age) : 18,
      nationalId,
      phone,
      governorate,
      city,
      area,
      address,
      personalPhotoUrl,
      idFrontUrl,
      idBackUrl,
      profileStatus: firstName && nationalId ? "COMPLETE" : "INCOMPLETE",
    });
  }
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  res.json({ id: user.id, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified, isActive: user.isActive, createdAt: user.createdAt, profile: profile ?? null });
});

export default router;
