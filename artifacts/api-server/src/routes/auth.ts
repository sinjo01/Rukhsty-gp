import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userProfilesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { generateToken, requireAuth, JwtPayload } from "../middlewares/auth";
import type { Request } from "express";

const router = Router();
const nationalIdPattern = /^\d{10}$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function toCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAgeFromDateOfBirth(dateOfBirth: string): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

router.post("/auth/register", async (req, res) => {
  const email = toCleanString(req.body.email).toLowerCase();
  const password = toCleanString(req.body.password);
  const firstName = toCleanString(req.body.firstName);
  const secondName = toCleanString(req.body.secondName);
  const thirdName = toCleanString(req.body.thirdName);
  const familyName = toCleanString(req.body.familyName);
  const nationalId = toCleanString(req.body.nationalId);
  const phone = toCleanString(req.body.phone);
  const governorate = toCleanString(req.body.governorate);
  const city = toCleanString(req.body.city);
  const area = toCleanString(req.body.area);
  const address = toCleanString(req.body.address);
  const dateOfBirth = toCleanString(req.body.dateOfBirth);
  const gender = toCleanString(req.body.gender);
  const personalPhotoUrl = toCleanString(req.body.personalPhotoUrl);
  const idFrontUrl = toCleanString(req.body.idFrontUrl);
  const idBackUrl = toCleanString(req.body.idBackUrl);

  if (!email || !password || !firstName || !familyName || !nationalId || !phone || !dateOfBirth || !gender || !governorate || !address) {
    res.status(400).json({ message: "Required registration fields are missing" });
    return;
  }
  if (!email.includes("@")) {
    res.status(400).json({ message: "A valid email address is required" });
    return;
  }
  if (!nationalIdPattern.test(nationalId)) {
    res.status(400).json({ message: "National ID must be 10 digits" });
    return;
  }
  if (!strongPasswordPattern.test(password)) {
    res.status(400).json({ message: "Password does not meet security requirements" });
    return;
  }
  const parsedDateOfBirth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(parsedDateOfBirth.getTime()) || parsedDateOfBirth > new Date()) {
    res.status(400).json({ message: "A valid date of birth is required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }
  const existingNationalId = await db.select().from(userProfilesTable).where(eq(userProfilesTable.nationalId, nationalId)).limit(1);
  if (existingNationalId.length > 0) {
    res.status(409).json({ message: "National ID already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, role: "USER" }).returning();
  await db.insert(userProfilesTable).values({
    userId: user.id,
    firstName,
    secondName,
    thirdName,
    familyName,
    age: req.body.age ? Number(req.body.age) : getAgeFromDateOfBirth(dateOfBirth),
    dateOfBirth,
    gender,
    nationalId,
    phone,
    governorate,
    city,
    area,
    address,
    personalPhotoUrl,
    idFrontUrl,
    idBackUrl,
    profileStatus: "COMPLETE",
  });
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/auth/login", async (req, res) => {
  const identifier = toCleanString(req.body.identifier || req.body.email).toLowerCase();
  const password = toCleanString(req.body.password);

  if (!identifier || !password) {
    res.status(400).json({ message: "Email or National ID and password are required" });
    return;
  }
  const [user] = identifier.includes("@")
    ? await db.select().from(usersTable).where(eq(usersTable.email, identifier)).limit(1)
    : await db
      .select()
      .from(usersTable)
      .leftJoin(userProfilesTable, eq(userProfilesTable.userId, usersTable.id))
      .where(or(eq(userProfilesTable.nationalId, identifier), eq(usersTable.email, identifier)))
      .limit(1)
      .then((rows) => rows.map((row) => row.users));

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
