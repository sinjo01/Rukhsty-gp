import { db, userProfilesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

type DemoAccount = {
  email: string;
  role: typeof usersTable.$inferSelect.role;
  password: string;
  profile: {
    firstName: string;
    secondName: string;
    thirdName: string;
    familyName: string;
    age: number;
    nationalId: string;
    phone?: string;
    governorate?: string;
    city?: string;
    area?: string;
    address?: string;
    personalPhotoUrl?: string;
  };
};

const demoAccounts: DemoAccount[] = [
  {
    email: "admin@rukhsty.jo",
    role: "ADMIN",
    password: "password123",
    profile: { firstName: "مدير", secondName: "النظام", thirdName: "", familyName: "رخصتي", age: 35, nationalId: "9000000001", phone: "+962-6-555-0000", governorate: "Amman", city: "Amman" },
  },
  {
    email: "user@rukhsty.jo",
    role: "USER",
    password: "password123",
    profile: { firstName: "محمد", secondName: "أحمد", thirdName: "علي", familyName: "الأردني", age: 25, nationalId: "9876543210", phone: "+962-7-9876-5432", governorate: "Amman", city: "Amman", area: "الشميساني", address: "شارع مكة، الشميساني، عمان", personalPhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan" },
  },
  {
    email: "test.user@rukhsty.jo",
    role: "USER",
    password: "password123",
    profile: { firstName: "Test", secondName: "Demo", thirdName: "", familyName: "Citizen", age: 24, nationalId: "5555555555", phone: "+962-7-5555-5555", governorate: "Amman", city: "Amman", area: "Demo", address: "Demo address, Amman", personalPhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo-citizen" },
  },
  {
    email: "security.officer@rukhsty.jo",
    role: "SECURITY_OFFICER",
    password: "password123",
    profile: { firstName: "Security", secondName: "Review", thirdName: "", familyName: "Officer", age: 32, nationalId: "9999999991", phone: "0790000001", governorate: "Amman", city: "Amman", address: "Public Security Directorate" },
  },
  {
    email: "training.officer@rukhsty.jo",
    role: "TRAINING_CENTER_OFFICER",
    password: "password123",
    profile: { firstName: "سامر", secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: "9900000001" },
  },
  {
    email: "medical.officer@rukhsty.jo",
    role: "MEDICAL_CENTER_OFFICER",
    password: "password123",
    profile: { firstName: "ريم", secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: "9900000002" },
  },
  {
    email: "theory.officer@rukhsty.jo",
    role: "THEORY_EXAM_OFFICER",
    password: "password123",
    profile: { firstName: "خالد", secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: "9900000003" },
  },
  {
    email: "practical.officer@rukhsty.jo",
    role: "PRACTICAL_EXAM_OFFICER",
    password: "password123",
    profile: { firstName: "لينا", secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: "9900000004" },
  },
  {
    email: "hahah@nbhds.com",
    role: "USER",
    password: "password123",
    profile: { firstName: "shorooq", secondName: "Jaber", thirdName: "Hamed", familyName: "Hamad", age: 23, nationalId: "3333333333", phone: "0793333333", governorate: "Amman", city: "Amman", address: "Demo address, Amman" },
  },
];

async function upsertProfile(userId: string, account: DemoAccount) {
  const [profileByNationalId] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.nationalId, account.profile.nationalId)).limit(1);
  if (profileByNationalId && profileByNationalId.userId !== userId) {
    throw new Error(`National ID ${account.profile.nationalId} already belongs to another user (${profileByNationalId.userId})`);
  }

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
  const values = { ...account.profile, profileStatus: "COMPLETE" as const, updatedAt: new Date() };
  if (!profile) {
    await db.insert(userProfilesTable).values({ userId, ...values });
    return "created profile";
  }
  await db.update(userProfilesTable).set(values).where(eq(userProfilesTable.id, profile.id));
  return "repaired profile";
}

async function repair() {
  const results: string[] = [];
  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, account.email)).limit(1);
    const user = existing
      ? (await db.update(usersTable).set({ passwordHash, role: account.role, isActive: true, isEmailVerified: true, updatedAt: new Date() }).where(eq(usersTable.id, existing.id)).returning())[0]
      : (await db.insert(usersTable).values({ email: account.email, passwordHash, role: account.role, isActive: true, isEmailVerified: true }).returning())[0];
    const profileAction = await upsertProfile(user.id, account);
    results.push(`${account.email} / ${account.profile.nationalId}: ${existing ? "repaired user" : "created user"}, ${profileAction}`);
  }

  console.log("Demo login repair complete:");
  for (const line of results) console.log(`- ${line}`);
  console.log("Password for repaired demo accounts: password123");
  process.exit(0);
}

repair().catch((error) => {
  console.error("Demo login repair failed:", error);
  process.exit(1);
});
