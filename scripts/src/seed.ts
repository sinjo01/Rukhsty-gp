import { db } from "@workspace/db";
import {
  usersTable, userProfilesTable, servicesTable, licenseCategoriesTable,
  centersTable, centerOfficersTable, notificationsTable
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Services
  const existingServices = await db.select().from(servicesTable).limit(1);
  if (existingServices.length === 0) {
    await db.insert(servicesTable).values([
      { nameAr: "استخراج رخصة قيادة", nameEn: "Issue Driving License", code: "ISSUE_DRIVING_LICENSE", description: "Apply for a new driving license", isActive: true },
      { nameAr: "تجديد رخصة قيادة", nameEn: "Renew Driving License", code: "RENEW_DRIVING_LICENSE", description: "Renew an existing driving license", isActive: true },
      { nameAr: "تجديد تسجيل مركبة", nameEn: "Renew Vehicle Registration", code: "RENEW_VEHICLE_REGISTRATION", description: "Renew vehicle registration", isActive: true },
    ]);
    console.log("Services seeded.");
  }

  // License Categories
  const existingCats = await db.select().from(licenseCategoriesTable).limit(1);
  if (existingCats.length === 0) {
    await db.insert(licenseCategoriesTable).values([
      { code: "CAT_1", nameAr: "الفئة الأولى", nameEn: "Category 1 - Motorcycles", minimumAge: 18, description: "Motorcycles and light motor vehicles", isActive: true },
      { code: "CAT_2", nameAr: "الفئة الثانية", nameEn: "Category 2 - Light Vehicles", minimumAge: 18, description: "Cars and light vehicles up to 3.5 tons", isActive: true },
      { code: "CAT_3", nameAr: "الفئة الثالثة", nameEn: "Category 3 - Heavy Vehicles", minimumAge: 21, description: "Trucks and heavy vehicles", isActive: true },
      { code: "CAT_4", nameAr: "الفئة الرابعة", nameEn: "Category 4 - Buses", minimumAge: 24, description: "Public transport buses", isActive: true },
      { code: "CAT_5", nameAr: "الفئة الخامسة", nameEn: "Category 5 - Special Vehicles", minimumAge: 21, description: "Special purpose vehicles", isActive: true },
      { code: "CAT_6", nameAr: "الفئة السادسة", nameEn: "Category 6 - Agricultural", minimumAge: 18, description: "Agricultural machinery", isActive: true },
    ]);
    console.log("License categories seeded.");
  }

  // Centers
  const existingCenters = await db.select().from(centersTable).limit(1);
  if (existingCenters.length === 0) {
    await db.insert(centersTable).values([
      // Training Centers
      { centerType: "TRAINING", nameAr: "مركز تدريب عمان الأول", nameEn: "Amman Training Center 1", governorate: "Amman", city: "Amman", address: "شارع الجاردنز، عمان", phone: "+962-6-555-0101", isActive: true },
      { centerType: "TRAINING", nameAr: "مركز تدريب إربد", nameEn: "Irbid Training Center", governorate: "Irbid", city: "Irbid", address: "شارع الجامعة، إربد", phone: "+962-2-555-0201", isActive: true },
      { centerType: "TRAINING", nameAr: "مركز تدريب الزرقاء", nameEn: "Zarqa Training Center", governorate: "Zarqa", city: "Zarqa", address: "شارع المدينة، الزرقاء", phone: "+962-5-555-0301", isActive: true },
      // Medical Centers
      { centerType: "MEDICAL", nameAr: "مركز الفحص الطبي عمان", nameEn: "Amman Medical Center", governorate: "Amman", city: "Amman", address: "شارع الملكة نور، عمان", phone: "+962-6-555-0401", isActive: true },
      { centerType: "MEDICAL", nameAr: "مركز الفحص الطبي إربد", nameEn: "Irbid Medical Center", governorate: "Irbid", city: "Irbid", address: "شارع الحسن، إربد", phone: "+962-2-555-0501", isActive: true },
      // Theory Exam Centers
      { centerType: "THEORY_EXAM", nameAr: "مركز الاختبار النظري عمان", nameEn: "Amman Theory Exam Center", governorate: "Amman", city: "Amman", address: "مجمع الدوار الأول، عمان", phone: "+962-6-555-0601", isActive: true },
      { centerType: "THEORY_EXAM", nameAr: "مركز الاختبار النظري الزرقاء", nameEn: "Zarqa Theory Exam Center", governorate: "Zarqa", city: "Zarqa", address: "شارع الأمير محمد، الزرقاء", phone: "+962-5-555-0701", isActive: true },
      // Practical Exam Centers
      { centerType: "PRACTICAL_EXAM", nameAr: "مضمار الاختبار العملي عمان", nameEn: "Amman Practical Exam Track", governorate: "Amman", city: "Amman", address: "طريق المطار، عمان", phone: "+962-6-555-0801", isActive: true },
      { centerType: "PRACTICAL_EXAM", nameAr: "مضمار الاختبار العملي إربد", nameEn: "Irbid Practical Exam Track", governorate: "Irbid", city: "Irbid", address: "المنطقة الصناعية، إربد", phone: "+962-2-555-0901", isActive: true },
      // DVLD Office
      { centerType: "DVLD", nameAr: "مديرية الترخيص والأمن عمان", nameEn: "DVLD Amman Office", governorate: "Amman", city: "Amman", address: "دوار الداخلية، عمان", phone: "+962-6-555-1001", isActive: true },
    ]);
    console.log("Centers seeded.");
  }

  // Admin user
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@rukhsty.jo")).limit(1);
  if (existingAdmin.length === 0) {
    const adminHash = await bcrypt.hash("Admin123!", 10);
    const [admin] = await db.insert(usersTable).values({ email: "admin@rukhsty.jo", passwordHash: adminHash, role: "ADMIN", isEmailVerified: true }).returning();
    await db.insert(userProfilesTable).values({ userId: admin.id, firstName: "مدير", secondName: "النظام", thirdName: "", familyName: "رخصتي", age: 35, nationalId: "9000000001", phone: "+962-6-555-0000", governorate: "Amman", city: "Amman", profileStatus: "COMPLETE" });
    console.log("Admin user seeded.");
  }

  // Demo citizen
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "user@rukhsty.jo")).limit(1);
  if (existingUser.length === 0) {
    const userHash = await bcrypt.hash("User123!", 10);
    const [citizen] = await db.insert(usersTable).values({ email: "user@rukhsty.jo", passwordHash: userHash, role: "USER", isEmailVerified: true }).returning();
    await db.insert(userProfilesTable).values({ userId: citizen.id, firstName: "محمد", secondName: "أحمد", thirdName: "علي", familyName: "الأردني", age: 25, nationalId: "9876543210", phone: "+962-7-9876-5432", governorate: "Amman", city: "Amman", area: "الشميساني", address: "شارع مكة، الشميساني، عمان", personalPhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", profileStatus: "COMPLETE" });
    await db.insert(notificationsTable).values([
      { userId: citizen.id, title: "مرحباً بك في رخصتي", message: "أهلاً محمد! مرحباً بك في منصة رخصتي للترخيص الرقمي.", type: "INFO" },
      { userId: citizen.id, title: "أكمل ملفك الشخصي", message: "يرجى إكمال ملفك الشخصي وتحميل وثائقك للبدء في تقديم طلبك.", type: "WARNING" },
    ]);
    console.log("Demo citizen seeded.");
  }

  // Officer accounts
  const officers = [
    { email: "training.officer@rukhsty.jo", role: "TRAINING_CENTER_OFFICER", name: "سامر", centerIdx: 0 },
    { email: "medical.officer@rukhsty.jo", role: "MEDICAL_CENTER_OFFICER", name: "ريم", centerIdx: 3 },
    { email: "theory.officer@rukhsty.jo", role: "THEORY_EXAM_OFFICER", name: "خالد", centerIdx: 5 },
    { email: "practical.officer@rukhsty.jo", role: "PRACTICAL_EXAM_OFFICER", name: "لينا", centerIdx: 7 },
  ] as const;

  const allCenters = await db.select().from(centersTable);
  for (const o of officers) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, o.email)).limit(1);
    if (existing.length === 0) {
      const hash = await bcrypt.hash("Officer123!", 10);
      const [officer] = await db.insert(usersTable).values({ email: o.email, passwordHash: hash, role: o.role, isEmailVerified: true }).returning();
      await db.insert(userProfilesTable).values({ userId: officer.id, firstName: o.name, secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: `${Math.floor(Math.random() * 9000000000) + 1000000000}`, profileStatus: "COMPLETE" });
      if (allCenters[o.centerIdx]) {
        await db.insert(centerOfficersTable).values({ userId: officer.id, centerId: allCenters[o.centerIdx].id, positionTitle: o.role, isActive: true });
      }
    }
  }
  console.log("Officers seeded.");

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
