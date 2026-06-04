import { db } from "@workspace/db";
import {
  usersTable, userProfilesTable, servicesTable, licenseCategoriesTable,
  centersTable, centerOfficersTable, notificationsTable
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");
  const jordanianLicenseCategories = [
    { code: "CAT_1_1", nameAr: "الفئة الأولى 1-1 - دراجة آلية", nameEn: "Category 1-1 - Motorcycle", minimumAge: 18, description: "Motorcycles according to Jordanian licensing categories." },
    { code: "CAT_1_2", nameAr: "الفئة الأولى 1-2 - سكوتر", nameEn: "Category 1-2 - Scooter", minimumAge: 18, description: "Scooters / light motorcycles." },
    { code: "CAT_2_1", nameAr: "الفئة الثانية 2-1 - مركبة إنشائية", nameEn: "Category 2-1 - Construction Vehicle", minimumAge: 18, description: "Construction vehicles." },
    { code: "CAT_2_2", nameAr: "الفئة الثانية 2-2 - مركبة زراعية", nameEn: "Category 2-2 - Agricultural Vehicle", minimumAge: 18, description: "Agricultural vehicles." },
    { code: "CAT_3_1", nameAr: "الفئة الثالثة 3-1 - خصوصي / تأجير يدوي", nameEn: "Category 3-1 - Private/Rental Light Vehicle Manual", minimumAge: 18, description: "Private passenger or rental vehicle up to 5000 kg, manual transmission." },
    { code: "CAT_3_2", nameAr: "الفئة الثالثة 3-2 - خصوصي / تأجير أوتوماتيك", nameEn: "Category 3-2 - Private/Rental Light Vehicle Automatic", minimumAge: 18, description: "Private passenger or rental vehicle up to 5000 kg, automatic transmission." },
    { code: "CAT_4", nameAr: "الفئة الرابعة - ركوب عمومي أو شحن خفيف", nameEn: "Category 4 - Public Passenger or Light Cargo", minimumAge: 21, description: "Public passenger or cargo vehicle up to 7500 kg." },
    { code: "CAT_5", nameAr: "الفئة الخامسة - حافلة متوسطة أو شحن ثقيل", nameEn: "Category 5 - Minibus or Heavy Cargo", minimumAge: 21, description: "Minibus and cargo vehicles over 7500 kg." },
    { code: "CAT_6_1", nameAr: "الفئة السادسة 6-1 - مقطورة ونصف مقطورة", nameEn: "Category 6-1 - Trailer and Semi-Trailer", minimumAge: 21, description: "Trailer and semi-trailer vehicles." },
    { code: "CAT_6_2", nameAr: "الفئة السادسة 6-2 - حافلة", nameEn: "Category 6-2 - Bus", minimumAge: 24, description: "Bus license category." },
    { code: "CAT_7", nameAr: "الفئة السابعة - مركبة ذوي الإعاقة", nameEn: "Category 7 - Vehicle for Persons with Disabilities", minimumAge: 18, description: "Vehicles adapted for persons with disabilities." },
  ];

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
    await db.insert(licenseCategoriesTable).values(jordanianLicenseCategories.map((category) => ({ ...category, isActive: true })));
    console.log("License categories seeded.");
  }
  for (const category of jordanianLicenseCategories) {
    const [existing] = await db.select().from(licenseCategoriesTable).where(eq(licenseCategoriesTable.code, category.code)).limit(1);
    if (!existing) {
      await db.insert(licenseCategoriesTable).values({ ...category, isActive: true });
    }
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

  const healthCenters = [
    ["مركز صحي عمان الشامل", "Amman Comprehensive Health Center", "Amman"],
    ["مركز صحي المقابلين الشامل", "Al Muqabalain Comprehensive Health Center", "Amman"],
    ["أبو نصير الشامل", "Abu Nuseir Comprehensive Health Center", "Amman"],
    ["القويسمة", "Al Qweismeh Health Center", "Amman"],
    ["طبربور", "Tabarbour Health Center", "Amman"],
    ["وادي السير", "Wadi Al Seer Health Center", "Amman"],
    ["ماركا", "Marka Health Center", "Amman"],
    ["مرج الحمام", "Marj Al Hamam Health Center", "Amman"],
    ["صويلح", "Sweileh Health Center", "Amman"],
    ["الجبيهة", "Al Jubaiha Health Center", "Amman"],
    ["الهاشمي الشمالي", "North Hashemi Health Center", "Amman"],
    ["الأميرة بسمة الشامل", "Princess Basma Comprehensive Health Center", "Amman"],
    ["مركز صحي الصريح", "Al Sareeh Health Center", "Irbid"],
    ["مستشفى الرمثا", "Ramtha Hospital", "Irbid"],
    ["الحصن الشامل", "Al Husn Comprehensive Health Center", "Irbid"],
    ["نعيمة الشامل", "Naimeh Comprehensive Health Center", "Irbid"],
    ["الطيبة الشامل", "Al Taybeh Comprehensive Health Center", "Irbid"],
    ["دير أبي سعيد الشامل", "Deir Abi Saeed Comprehensive Health Center", "Irbid"],
    ["مركز صحي القادسية الشامل", "Al Qadisiyah Comprehensive Health Center", "Jerash"],
    ["مركز صحي عجلون الشامل", "Ajloun Comprehensive Health Center", "Ajloun"],
    ["مستشفى الحسين / السلط الجديد", "Al Hussein / New Salt Hospital", "Balqa"],
    ["قسم الأمراض الصدرية وصحة الوافدين", "Chest Diseases and Expatriate Health Department", "Mafraq"],
    ["مستشفى الرويشد", "Ruwaished Hospital", "Mafraq"],
    ["مركز صحي المرج الأولي", "Al Marj Primary Health Center", "Karak"],
    ["مركز صحي ومركز الأمومة والطفولة الأميرة صالحة بنت عاصم", "Princess Salha Maternal and Child Health Center", "Karak"],
    ["مركز صحي معان الغربي", "West Ma'an Health Center", "Ma'an"],
    ["مديرية صحة إقليم البتراء", "Petra Region Health Directorate", "Ma'an"],
    ["مركز صحي إسكان الهاشمية", "Iskan Al Hashemiyah Health Center", "Zarqa"],
    ["مركز صحي العقبة الشامل", "Aqaba Comprehensive Health Center", "Aqaba"],
    ["مركز صحي القادسية الشامل", "Al Qadisiyah Comprehensive Health Center", "Tafileh"],
    ["مركز صحي حنينا", "Hanina Health Center", "Madaba"],
  ].map(([nameAr, nameEn, governorate]) => ({ nameAr, nameEn, governorate, city: governorate, address: `${nameEn}, ${governorate}` }));

  const licensingCenters = [
    ["ترخيص غرب عمان", "West Amman Licensing Center", "Amman"],
    ["ترخيص شمال عمان", "North Amman Licensing Center", "Amman"],
    ["ترخيص ماركا", "Marka Licensing Center", "Amman"],
    ["ترخيص جمرك عمان", "Amman Customs Licensing Center", "Amman"],
    ["ترخيص مرج الحمام", "Marj Al Hamam Licensing Center", "Amman"],
    ["ترخيص الدوار السابع", "7th Circle Licensing Center", "Amman"],
    ["ترخيص إربد", "Irbid Licensing Center", "Irbid"],
    ["ترخيص غرب إربد", "West Irbid Licensing Center", "Irbid"],
    ["ترخيص الزرقاء", "Zarqa Licensing Center", "Zarqa"],
    ["ترخيص الكرك", "Karak Licensing Center", "Karak"],
    ["ترخيص العقبة", "Aqaba Licensing Center", "Aqaba"],
    ["ترخيص معان", "Ma'an Licensing Center", "Ma'an"],
    ["ترخيص السلط", "Salt Licensing Center", "Balqa"],
  ].map(([nameAr, nameEn, governorate]) => ({ nameAr, nameEn, governorate, city: governorate, address: `${nameEn}, ${governorate}` }));

  for (const center of healthCenters) {
    const existing = await db.select().from(centersTable).where(eq(centersTable.nameEn, center.nameEn)).limit(1);
    if (existing.length === 0) {
      await db.insert(centersTable).values({
        centerType: "HEALTH_CENTER",
        nameAr: center.nameAr,
        nameEn: center.nameEn,
        governorate: center.governorate,
        city: center.city,
        address: center.address,
        phone: "+962-6-555-0400",
        isActive: true,
      });
    }
  }
  console.log("Government health centers seeded.");

  for (const center of licensingCenters) {
    const existing = await db.select().from(centersTable).where(eq(centersTable.nameEn, center.nameEn)).limit(1);
    if (existing.length === 0) {
      await db.insert(centersTable).values({
        centerType: "EXAM_CENTER",
        nameAr: center.nameAr,
        nameEn: center.nameEn,
        governorate: center.governorate,
        city: center.city,
        address: center.address,
        phone: "+962-6-555-0600",
        isActive: true,
      });
    }
  }
  console.log("Licensing centers seeded.");

  // Admin user
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@rukhsty.jo")).limit(1);
  const adminHash = await bcrypt.hash("password123", 10);
  if (existingAdmin.length === 0) {
    const [admin] = await db.insert(usersTable).values({ email: "admin@rukhsty.jo", passwordHash: adminHash, role: "ADMIN", isEmailVerified: true }).returning();
    await db.insert(userProfilesTable).values({ userId: admin.id, firstName: "مدير", secondName: "النظام", thirdName: "", familyName: "رخصتي", age: 35, nationalId: "9000000001", phone: "+962-6-555-0000", governorate: "Amman", city: "Amman", profileStatus: "COMPLETE" });
    console.log("Admin user seeded.");
  } else {
    await db.update(usersTable).set({ passwordHash: adminHash, isActive: true }).where(eq(usersTable.email, "admin@rukhsty.jo"));
  }

  // Demo citizen
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "user@rukhsty.jo")).limit(1);
  const userHash = await bcrypt.hash("password123", 10);
  if (existingUser.length === 0) {
    const [citizen] = await db.insert(usersTable).values({ email: "user@rukhsty.jo", passwordHash: userHash, role: "USER", isEmailVerified: true }).returning();
    await db.insert(userProfilesTable).values({ userId: citizen.id, firstName: "محمد", secondName: "أحمد", thirdName: "علي", familyName: "الأردني", age: 25, nationalId: "9876543210", phone: "+962-7-9876-5432", governorate: "Amman", city: "Amman", area: "الشميساني", address: "شارع مكة، الشميساني، عمان", personalPhotoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", profileStatus: "COMPLETE" });
    await db.insert(notificationsTable).values([
      { userId: citizen.id, title: "مرحباً بك في رخصتي", message: "أهلاً محمد! مرحباً بك في منصة رخصتي للترخيص الرقمي.", type: "INFO" },
      { userId: citizen.id, title: "أكمل ملفك الشخصي", message: "يرجى إكمال ملفك الشخصي وتحميل وثائقك للبدء في تقديم طلبك.", type: "WARNING" },
    ]);
    console.log("Demo citizen seeded.");
  } else {
    await db.update(usersTable).set({ passwordHash: userHash, isActive: true }).where(eq(usersTable.email, "user@rukhsty.jo"));
  }

  // Officer accounts
  const officers = [
    { email: "training.officer@rukhsty.jo", role: "TRAINING_CENTER_OFFICER", name: "سامر", nationalId: "9900000001", centerIdx: 0 },
    { email: "medical.officer@rukhsty.jo", role: "MEDICAL_CENTER_OFFICER", name: "ريم", nationalId: "9900000002", centerIdx: 3 },
    { email: "theory.officer@rukhsty.jo", role: "THEORY_EXAM_OFFICER", name: "خالد", nationalId: "9900000003", centerIdx: 5 },
    { email: "practical.officer@rukhsty.jo", role: "PRACTICAL_EXAM_OFFICER", name: "لينا", nationalId: "9900000004", centerIdx: 7 },
  ] as const;

  const allCenters = await db.select().from(centersTable);
  for (const o of officers) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, o.email)).limit(1);
    const hash = await bcrypt.hash("password123", 10);
    if (existing.length === 0) {
      const [officer] = await db.insert(usersTable).values({ email: o.email, passwordHash: hash, role: o.role, isEmailVerified: true }).returning();
      await db.insert(userProfilesTable).values({ userId: officer.id, firstName: o.name, secondName: "الموظف", thirdName: "", familyName: "رخصتي", age: 30, nationalId: o.nationalId, profileStatus: "COMPLETE" });
      if (allCenters[o.centerIdx]) {
        await db.insert(centerOfficersTable).values({ userId: officer.id, centerId: allCenters[o.centerIdx].id, positionTitle: o.role, isActive: true });
      }
    } else {
      await db.update(usersTable).set({ passwordHash: hash, role: o.role, isActive: true }).where(eq(usersTable.email, o.email));
    }
  }
  console.log("Officers seeded.");

  const existingSecurityOfficer = await db.select().from(usersTable).where(eq(usersTable.email, "security.officer@rukhsty.jo")).limit(1);
  const securityHash = await bcrypt.hash("password123", 10);
  if (existingSecurityOfficer.length === 0) {
    const [securityOfficer] = await db.insert(usersTable).values({
      email: "security.officer@rukhsty.jo",
      passwordHash: securityHash,
      role: "SECURITY_OFFICER",
      isEmailVerified: true,
    }).returning();
    await db.insert(userProfilesTable).values({
      userId: securityOfficer.id,
      firstName: "Security",
      secondName: "Review",
      thirdName: "",
      familyName: "Officer",
      age: 32,
      nationalId: "9999999991",
      phone: "0790000001",
      governorate: "Amman",
      city: "Amman",
      address: "Public Security Directorate",
      profileStatus: "COMPLETE",
    });
    console.log("Security officer seeded.");
  } else {
    await db.update(usersTable).set({ passwordHash: securityHash, role: "SECURITY_OFFICER", isActive: true }).where(eq(usersTable.email, "security.officer@rukhsty.jo"));
  }

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
