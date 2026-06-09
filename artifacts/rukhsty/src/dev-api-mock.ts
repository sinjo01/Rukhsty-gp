import type { Connect, Plugin } from "vite";
import type { ServerResponse } from "node:http";

type DemoUser = {
  id: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  profile: {
    id: string;
    userId: string;
    firstName: string;
    secondName: string;
    thirdName: string;
    familyName: string;
    age: number;
    dateOfBirth?: string;
    gender?: string;
    nationalId: string;
    phone: string;
    governorate: string;
    city: string;
    area?: string;
    address?: string;
    personalPhotoUrl?: string;
    profileStatus: string;
  };
};

const now = new Date().toISOString();

const demoUsers: DemoUser[] = [
  demoUser("admin", "admin@rukhsty.jo", "password123", "ADMIN", "مدير", "رخصتي", { nationalId: "9000000001" }),
  demoUser("user", "user@rukhsty.jo", "password123", "USER", "محمد", "الأردني", { nationalId: "9876543210" }),
  demoUser("test-user", "test.user@rukhsty.jo", "password123", "USER", "Test", "Citizen", {
    nationalId: "5555555555",
    phone: "+962-7-5555-5555",
    governorate: "Amman",
    address: "Demo address, Amman",
  }),
  demoUser("training", "training.officer@rukhsty.jo", "password123", "TRAINING_CENTER_OFFICER", "سامر", "رخصتي", { nationalId: "9900000001" }),
  demoUser("medical", "medical.officer@rukhsty.jo", "password123", "MEDICAL_CENTER_OFFICER", "ريم", "رخصتي", { nationalId: "9900000002" }),
  demoUser("theory", "theory.officer@rukhsty.jo", "password123", "THEORY_EXAM_OFFICER", "خالد", "رخصتي", { nationalId: "9900000003" }),
  demoUser("practical", "practical.officer@rukhsty.jo", "password123", "PRACTICAL_EXAM_OFFICER", "لينا", "رخصتي", { nationalId: "9900000004" }),
  demoUser("security", "security.officer@rukhsty.jo", "password123", "SECURITY_OFFICER", "Security", "Officer", {
    nationalId: "9999999991",
    phone: "0790000001",
    governorate: "Amman",
    address: "Public Security Directorate",
  }),
];

const tokens = new Map<string, DemoUser>();

const notifications: any[] = [
  {
    id: "notif-welcome",
    title: "مرحباً بك في رخصتي",
    message: "أهلاً بك في منصة رخصتي للترخيص الرقمي.",
    type: "INFO",
    isRead: false,
    createdAt: now,
  },
  {
    id: "notif-profile",
    title: "أكمل ملفك الشخصي",
    message: "يرجى مراجعة بياناتك قبل تقديم الطلب.",
    type: "WARNING",
    isRead: false,
    createdAt: now,
  },
];

const applications: any[] = [
  {
    id: "app-demo-1",
    applicationNumber: "RKH-2026-0001",
    userId: "user",
    status: "SECURITY_REVIEW",
    currentStep: "SECURITY_REVIEW",
    serviceId: "svc-license",
    licenseCategoryId: "cat-2",
    serviceType: "ISSUE_DRIVING_LICENSE",
    governorate: "Amman",
    residenceArea: "Shmeisani",
    paymentStatus: "unpaid",
    paymentAmount: "3.00",
    deliveryStatus: "not_requested",
    createdAt: now,
    updatedAt: now,
  },
];

const appointments: any[] = [];
const medicalTests: any[] = [];
const exams: any[] = [];
const licenses: any[] = [];
const documents: any[] = [];

const centers: any[] = [
  {
    id: "center-training-amman",
    centerType: "TRAINING",
    nameAr: "مركز تدريب عمان الأول",
    nameEn: "Amman Training Center 1",
    governorate: "Amman",
    city: "Amman",
    address: "Gardens Street, Amman",
    phone: "+962-6-555-0101",
    isActive: true,
  },
  {
    id: "center-medical-amman",
    centerType: "HEALTH_CENTER",
    nameAr: "مركز صحي عمان الشامل",
    nameEn: "Amman Comprehensive Health Center",
    governorate: "Amman",
    city: "Amman",
    address: "Queen Noor Street, Amman",
    phone: "+962-6-555-0401",
    isActive: true,
  },
  { id: "health-muqabalain", centerType: "HEALTH_CENTER", nameAr: "مركز صحي المقابلين الشامل", nameEn: "Al Muqabalain Comprehensive Health Center", governorate: "Amman", city: "Amman", address: "Al Muqabalain, Amman", phone: "+962-6-555-0402", isActive: true },
  { id: "health-sweileh", centerType: "HEALTH_CENTER", nameAr: "صويلح", nameEn: "Sweileh Health Center", governorate: "Amman", city: "Amman", address: "Sweileh, Amman", phone: "+962-6-555-0403", isActive: true },
  { id: "health-irbid", centerType: "HEALTH_CENTER", nameAr: "مركز صحي الصريح", nameEn: "Al Sareeh Health Center", governorate: "Irbid", city: "Irbid", address: "Al Sareeh, Irbid", phone: "+962-2-555-0501", isActive: true },
  { id: "health-zarqa", centerType: "HEALTH_CENTER", nameAr: "مركز صحي إسكان الهاشمية", nameEn: "Iskan Al Hashemiyah Health Center", governorate: "Zarqa", city: "Zarqa", address: "Hashemiyah Housing, Zarqa", phone: "+962-5-555-0401", isActive: true },
  { id: "health-salt", centerType: "HEALTH_CENTER", nameAr: "مستشفى الحسين / السلط الجديد", nameEn: "Al Hussein / New Salt Hospital", governorate: "Balqa", city: "Salt", address: "Salt, Balqa", phone: "+962-5-555-0502", isActive: true },
  { id: "lic-west-amman", centerType: "EXAM_CENTER", nameAr: "ترخيص غرب عمان", nameEn: "West Amman Licensing Center", governorate: "Amman", city: "Amman", address: "West Amman DVLD", phone: "+962-6-555-0601", isActive: true },
  { id: "lic-north-amman", centerType: "EXAM_CENTER", nameAr: "ترخيص شمال عمان", nameEn: "North Amman Licensing Center", governorate: "Amman", city: "Amman", address: "North Amman DVLD", phone: "+962-6-555-0602", isActive: true },
  { id: "lic-marka", centerType: "EXAM_CENTER", nameAr: "ترخيص ماركا", nameEn: "Marka Licensing Center", governorate: "Amman", city: "Amman", address: "Marka DVLD", phone: "+962-6-555-0603", isActive: true },
  { id: "lic-irbid", centerType: "EXAM_CENTER", nameAr: "ترخيص إربد", nameEn: "Irbid Licensing Center", governorate: "Irbid", city: "Irbid", address: "Irbid DVLD", phone: "+962-2-555-0601", isActive: true },
  { id: "lic-zarqa", centerType: "EXAM_CENTER", nameAr: "ترخيص الزرقاء", nameEn: "Zarqa Licensing Center", governorate: "Zarqa", city: "Zarqa", address: "Zarqa DVLD", phone: "+962-5-555-0601", isActive: true },
  { id: "lic-salt", centerType: "EXAM_CENTER", nameAr: "ترخيص السلط", nameEn: "Salt Licensing Center", governorate: "Balqa", city: "Salt", address: "Salt DVLD", phone: "+962-5-555-0602", isActive: true },
];

const licenseCategories = [
  { id: "cat-1-1", code: "CAT_1_1", nameAr: "الفئة الأولى 1-1 - دراجة آلية", nameEn: "Category 1-1 - Motorcycle", minimumAge: 18, description: "Motorcycles according to Jordanian licensing categories.", isActive: true },
  { id: "cat-1-2", code: "CAT_1_2", nameAr: "الفئة الأولى 1-2 - سكوتر", nameEn: "Category 1-2 - Scooter", minimumAge: 18, description: "Scooters / light motorcycles.", isActive: true },
  { id: "cat-2-1", code: "CAT_2_1", nameAr: "الفئة الثانية 2-1 - مركبة إنشائية", nameEn: "Category 2-1 - Construction Vehicle", minimumAge: 18, description: "Construction vehicles.", isActive: true },
  { id: "cat-2-2", code: "CAT_2_2", nameAr: "الفئة الثانية 2-2 - مركبة زراعية", nameEn: "Category 2-2 - Agricultural Vehicle", minimumAge: 18, description: "Agricultural vehicles.", isActive: true },
  { id: "cat-3-1", code: "CAT_3_1", nameAr: "الفئة الثالثة 3-1 - خصوصي / تأجير يدوي", nameEn: "Category 3-1 - Private/Rental Light Vehicle Manual", minimumAge: 18, description: "Private passenger or rental vehicle up to 5000 kg, manual transmission.", isActive: true },
  { id: "cat-3-2", code: "CAT_3_2", nameAr: "الفئة الثالثة 3-2 - خصوصي / تأجير أوتوماتيك", nameEn: "Category 3-2 - Private/Rental Light Vehicle Automatic", minimumAge: 18, description: "Private passenger or rental vehicle up to 5000 kg, automatic transmission.", isActive: true },
  { id: "cat-4", code: "CAT_4", nameAr: "الفئة الرابعة - ركوب عمومي أو شحن خفيف", nameEn: "Category 4 - Public Passenger or Light Cargo", minimumAge: 21, description: "Public passenger or cargo vehicle up to 7500 kg.", isActive: true },
  { id: "cat-5", code: "CAT_5", nameAr: "الفئة الخامسة - حافلة متوسطة أو شحن ثقيل", nameEn: "Category 5 - Minibus or Heavy Cargo", minimumAge: 21, description: "Minibus and cargo vehicles over 7500 kg.", isActive: true },
  { id: "cat-6-1", code: "CAT_6_1", nameAr: "الفئة السادسة 6-1 - مقطورة ونصف مقطورة", nameEn: "Category 6-1 - Trailer and Semi-Trailer", minimumAge: 21, description: "Trailer and semi-trailer vehicles.", isActive: true },
  { id: "cat-6-2", code: "CAT_6_2", nameAr: "الفئة السادسة 6-2 - حافلة", nameEn: "Category 6-2 - Bus", minimumAge: 24, description: "Bus license category.", isActive: true },
  { id: "cat-7", code: "CAT_7", nameAr: "الفئة السابعة - مركبة ذوي الإعاقة", nameEn: "Category 7 - Vehicle for Persons with Disabilities", minimumAge: 18, description: "Vehicles adapted for persons with disabilities.", isActive: true },
];

const services = [
  { id: "svc-license", nameAr: "استخراج رخصة قيادة", nameEn: "Issue Driving License", code: "ISSUE_DRIVING_LICENSE", isActive: true },
  { id: "svc-renew-license", nameAr: "تجديد رخصة قيادة", nameEn: "Renew Driving License", code: "RENEW_DRIVING_LICENSE", isActive: true },
  { id: "svc-renew-vehicle", nameAr: "تجديد ترخيص المركبة", nameEn: "Renew Vehicle Registration", code: "RENEW_VEHICLE_REGISTRATION", isActive: true },
];

export function devApiMock(): Plugin {
  return {
    name: "rukhsty-dev-api-mock",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const method = req.method ?? "GET";
        const path = getPath(req);

        try {
          if (method === "GET" && path === "/healthz") {
            sendJson(res, { ok: true });
            return;
          }

          if (method === "POST" && path === "/auth/login") {
            const body = await readJson(req);
            const identifier = asString(body.identifier || body.email).toLowerCase();
            const user = demoUsers.find((item) => {
              const matchesIdentifier = item.email.toLowerCase() === identifier || item.profile.nationalId === identifier;
              return matchesIdentifier && item.password === body.password;
            });
            if (!user) {
              sendJson(res, { message: "Invalid credentials" }, 401);
              return;
            }
            const token = createToken(user);
            sendJson(res, { token, user: publicUser(user) });
            return;
          }

          if (method === "POST" && path === "/auth/register") {
            const body = await readJson(req);
            if (!body.email || !body.password) {
              sendJson(res, { message: "Email and password are required" }, 400);
              return;
            }
            if (demoUsers.some((user) => user.email.toLowerCase() === asString(body.email).toLowerCase())) {
              sendJson(res, { message: "Email already registered" }, 409);
              return;
            }
            if (demoUsers.some((user) => user.profile.nationalId === asString(body.nationalId))) {
              sendJson(res, { message: "National ID already registered" }, 409);
              return;
            }
            const user = demoUser(
              `registered-${Date.now()}`,
              asString(body.email),
              asString(body.password),
              "USER",
              asString(body.firstName, "Citizen"),
              asString(body.familyName, "User"),
              body,
            );
            demoUsers.push(user);
            sendJson(res, { message: "Account created. Please log in.", user: publicUser(user) }, 201);
            return;
          }

          if (method === "POST" && path === "/auth/logout") {
            sendJson(res, { message: "Logged out" });
            return;
          }

          const user = requireUser(req, res);
          if (!user) return;

          if (method === "GET" && path === "/auth/me") {
            sendJson(res, publicUser(user));
            return;
          }

          if (method === "GET" && path === "/dashboard/summary") {
            const userApplications = applications.filter((app) => app.userId === user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
            const userAppointments = appointments.filter((item) => item.userId === user.id && item.status === "BOOKED");
            const userLicense = licenses.find((item) => item.userId === user.id && item.status === "ACTIVE") ?? null;
            const closedStatuses = ["LICENSE_ISSUED", "LICENSE_RENEWED", "REJECTED", "SECURITY_REJECTED", "CANCELLED"];
            const activeApplication = userApplications.find((app) => !closedStatuses.includes(app.status));
            sendJson(res, {
              totalApplications: userApplications.length,
              upcomingAppointments: userAppointments.length,
              unreadNotifications: userNotifications(user.id).filter((item) => !item.isRead).length,
              profileCompletionPercent: 100,
              activeApplication: activeApplication ? applicationDetail(activeApplication) : null,
              myLicense: userLicense,
            });
            return;
          }

          if (method === "GET" && path === "/notifications") {
            sendJson(res, userNotifications(user.id));
            return;
          }

          if (method === "GET" && path === "/applications") {
            sendJson(res, applications.filter((app) => app.userId === user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map((app) => applicationDetail(app)));
            return;
          }

          if (method === "POST" && path === "/applications") {
            const body = await readJson(req);
            const service = services.find((item) => item.id === asString(body.serviceId));
            const isIssueDrivingLicense = service?.code === "ISSUE_DRIVING_LICENSE";
            const trainingCertificate = body.trainingCertificate as Record<string, unknown> | undefined;
            const certificateFileUrl = asString(trainingCertificate?.fileUrl);
            const certificateFileName = asString(trainingCertificate?.fileName);
            const certificateMimeType = asString(trainingCertificate?.mimeType);
            if (isIssueDrivingLicense && (!certificateFileUrl || !certificateFileName || !certificateMimeType.startsWith("image/"))) {
              sendJson(res, { message: "Training certificate image is required for first-time driving license applications" }, 400);
              return;
            }
            const app = {
              id: `app-${Date.now()}`,
              applicationNumber: `RKH-${new Date().getFullYear()}-${String(applications.length + 1).padStart(4, "0")}`,
              status: isIssueDrivingLicense ? "SECURITY_REVIEW" : "DRAFT",
              currentStep: isIssueDrivingLicense ? "SECURITY_REVIEW" : "PROFILE_REVIEW",
              userId: user.id,
              serviceId: asString(body.serviceId),
              licenseCategoryId: asString(body.licenseCategoryId),
              serviceType: service?.code ?? "ISSUE_DRIVING_LICENSE",
              governorate: asString(body.governorate, user.profile.governorate),
              residenceArea: asString(body.residenceArea, user.profile.area ?? user.profile.city),
              submittedAt: isIssueDrivingLicense ? new Date().toISOString() : null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            applications.unshift(app);
            if (isIssueDrivingLicense) {
              documents.unshift({
                id: `doc-${Date.now()}`,
                userId: user.id,
                applicationId: app.id,
                documentType: "TRAINING_CERTIFICATE",
                fileUrl: certificateFileUrl,
                fileName: certificateFileName,
                mimeType: certificateMimeType,
                verificationStatus: "PENDING",
                createdAt: new Date().toISOString(),
              });
            }
            addNotification(user.id, "Application submitted successfully", `تم تقديم طلبك رقم ${app.applicationNumber} بنجاح.`);
            sendJson(res, applicationDetail(app), 201);
            return;
          }

          if (method === "GET" && path.match(/^\/applications\/[^/]+\/license$/)) {
            const id = path.split("/")[2];
            sendJson(res, { license: licenseForApplication(id) });
            return;
          }

          if (method === "GET" && path.startsWith("/applications/")) {
            const id = path.split("/")[2];
            const app = applications.find((item) => item.id === id);
            if (!app) {
              sendJson(res, { message: "Application not found" }, 404);
              return;
            }
            sendJson(res, applicationDetail(app));
            return;
          }

          if (method === "GET" && path === "/admin/applications") {
            const url = new URL(req.url ?? "/", "http://localhost");
            const status = url.searchParams.get("status");
            const serviceCode = url.searchParams.get("serviceCode");
            const limit = Number(url.searchParams.get("limit") ?? applications.length);
            const filtered = applications
              .filter((app) => !status || status === "ALL" || app.status === status)
              .filter((app) => !serviceCode || app.serviceType === serviceCode)
              .slice(0, Number.isFinite(limit) ? limit : applications.length)
              .map((app) => applicationDetail(app));
            sendJson(res, { data: filtered, applications: filtered, total: filtered.length, page: 1, totalPages: 1 });
            return;
          }

          if (method === "POST" && path.startsWith("/admin/applications/") && path.includes("/security/")) {
            const [, , , id, , action] = path.split("/");
            const body = await readJson(req);
            if (action === "approve" && !documents.some((item) => item.applicationId === id && item.documentType === "TRAINING_CERTIFICATE")) {
              sendJson(res, { message: "Training certificate image is required before approving this application" }, 409);
              return;
            }
            const updated = updateSecurityApplication(id, action, asString(body.rejectionReason || body.note || body.message));
            if (!updated) {
              sendJson(res, { message: "Application not found" }, 404);
              return;
            }
            sendJson(res, applicationDetail(updated));
            return;
          }

          if (method === "POST" && path.startsWith("/security/applications/")) {
            const [, , , id, action] = path.split("/");
            const body = await readJson(req);
            if (action === "approve" && !documents.some((item) => item.applicationId === id && item.documentType === "TRAINING_CERTIFICATE")) {
              sendJson(res, { message: "Training certificate image is required before approving this application" }, 409);
              return;
            }
            const updated = updateSecurityApplication(id, action, asString(body.rejectionReason || body.note || body.message));
            if (!updated) {
              sendJson(res, { message: "Application not found" }, 404);
              return;
            }
            sendJson(res, applicationDetail(updated));
            return;
          }

          if (method === "GET" && path === "/profile") {
            sendJson(res, user.profile);
            return;
          }

          if (method === "PUT" && path === "/profile") {
            const body = await readJson(req);
            user.profile = { ...user.profile, ...body, profileStatus: "COMPLETE" };
            sendJson(res, user.profile);
            return;
          }

          if (method === "GET" && path === "/services") {
            sendJson(res, services);
            return;
          }

          if (method === "GET" && path === "/license-categories") {
            sendJson(res, licenseCategories);
            return;
          }

          if (method === "GET" && path === "/centers") {
            const url = new URL(req.url ?? "/", "http://localhost");
            sendJson(res, filterCenters(url.searchParams.get("centerType") ?? url.searchParams.get("type"), url.searchParams.get("governorate")));
            return;
          }

          if (method === "GET" && path === "/appointments/slots") {
            const url = new URL(req.url ?? "/", "http://localhost");
            const centerId = url.searchParams.get("centerId") ?? "";
            const date = url.searchParams.get("date") ?? today();
            sendJson(res, appointmentSlots(centerId, date));
            return;
          }

          if (method === "GET" && path === "/appointments") {
            sendJson(res, appointments.filter((item) => item.userId === user.id).map(withCenter));
            return;
          }

          if (method === "POST" && path === "/appointments") {
            const body = await readJson(req);
            const app = applications.find((item) => item.id === asString(body.applicationId) && item.userId === user.id);
            if (!app) {
              sendJson(res, { message: "Application not found" }, 404);
              return;
            }
            const appointmentType = asString(body.appointmentType || body.type);
            const appointmentDate = asString(body.appointmentDate || body.date);
            const startTime = asString(body.startTime || body.timeSlot);
            const centerId = asString(body.centerId);
            const validation = validateBooking(app, appointmentType, appointmentDate);
            if (validation) {
              sendJson(res, { message: validation }, 409);
              return;
            }
            const appointment = {
              id: `apt-${Date.now()}`,
              applicationId: app.id,
              userId: user.id,
              centerId,
              appointmentType,
              appointmentDate,
              startTime,
              endTime: addMinutes(startTime, 30),
              queueNumber: Math.floor(Math.random() * 40) + 1,
              status: "BOOKED",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            appointments.unshift(appointment);
            transitionAfterBooking(app, appointmentType);
            addNotification(user.id, "Appointment booked successfully", appointmentType === "MEDICAL_TEST"
              ? "تم حجز موعد فحص النظر بنجاح."
              : appointmentType === "THEORY_EXAM"
              ? "تم حجز موعد الامتحان النظري بنجاح."
              : "تم حجز موعد الامتحان العملي بنجاح.");
            sendJson(res, withCenter(appointment), 201);
            return;
          }

          if (method === "PATCH" && path.match(/^\/licenses\/[^/]+\/mock-pay$/)) {
            const id = path.split("/")[2];
            const found = findApplicationOrLicense(id);
            if (!found?.app && !found?.license) {
              sendJson(res, { success: false, message: "License or application not found." }, 404);
              return;
            }
            const app = found.app;
            if (app && !paymentEligible(app)) {
              sendJson(res, { success: false, message: "Application must be approved before payment." }, 409);
              return;
            }
            if ((found.license?.paymentStatus ?? app?.paymentStatus) === "paid") {
              sendJson(res, { success: true, message: "Payment completed successfully. Your license has been issued.", data: { application: app, license: found.license } });
              return;
            }
            const paymentReference = found.license?.paymentReference ?? app?.paymentReference ?? generateEfawateercomReference();
            const shouldConfirmDelivery = (found.license?.deliveryMethod ?? app?.deliveryMethod) === "aramex";
            const tracking = shouldConfirmDelivery ? found.license?.aramexTrackingNumber ?? app?.aramexTrackingNumber ?? generateMockAramexTrackingNumber() : found.license?.aramexTrackingNumber ?? app?.aramexTrackingNumber;
            if (app) {
              app.status = "LICENSE_ISSUED";
              app.currentStep = "LICENSE_ISSUANCE";
              app.paymentMethod = "efawateercom";
              app.paymentStatus = "paid";
              app.paymentAmount = "3.00";
              app.paymentReference = paymentReference;
              app.paymentPaidAt = new Date().toISOString();
              app.completedAt = new Date().toISOString();
              app.updatedAt = new Date().toISOString();
              if (shouldConfirmDelivery) app.deliveryStatus = "payment_confirmed";
              if (tracking) app.aramexTrackingNumber = tracking;
            }
            // TODO: Replace mock-pay endpoint with real eFAWATEERcom callback/API integration in production.
            // TODO: Replace mock Aramex tracking number with real Aramex shipment API integration in production.
            const license = found.license ?? (app ? issueLicense(app) : null);
            if (license) {
              license.paymentMethod = "efawateercom";
              license.paymentStatus = "paid";
              license.paymentAmount = "3.00";
              license.paymentReference = paymentReference;
              license.paymentPaidAt = new Date().toISOString();
              license.deliveryMethod = license.deliveryMethod ?? app?.deliveryMethod;
              license.deliveryStatus = shouldConfirmDelivery ? "payment_confirmed" : license.deliveryStatus ?? app?.deliveryStatus;
              license.deliveryAddress = license.deliveryAddress ?? app?.deliveryAddress;
              license.deliveryCity = license.deliveryCity ?? app?.deliveryCity;
              license.deliveryPhone = license.deliveryPhone ?? app?.deliveryPhone;
              license.deliveryLocationLink = license.deliveryLocationLink ?? app?.deliveryLocationLink;
              license.deliveryDate = license.deliveryDate ?? app?.deliveryDate;
              license.deliveryTimeSlot = license.deliveryTimeSlot ?? app?.deliveryTimeSlot;
              if (tracking) license.aramexTrackingNumber = tracking;
            }
            sendJson(res, { success: true, message: "Payment completed successfully. Your license has been issued.", data: { application: app, license } });
            return;
          }

          if (method === "POST" && path.match(/^\/licenses\/[^/]+\/delivery\/aramex$/)) {
            const id = path.split("/")[2];
            const found = findApplicationOrLicense(id);
            const body = await readJson(req);
            if (!found?.app && !found?.license) {
              sendJson(res, { message: "License or application not found." }, 404);
              return;
            }
            const app = found.app;
            if (app && !paymentEligible(app)) {
              sendJson(res, { message: "Application must be approved before delivery can be requested." }, 409);
              return;
            }
            const deliveryAddress = asString(body.deliveryAddress).trim();
            const deliveryCity = asString(body.deliveryCity).trim();
            const deliveryPhone = asString(body.deliveryPhone).trim();
            const deliveryLocationLink = asString(body.deliveryLocationLink).trim();
            const deliveryDate = asString(body.deliveryDate).trim();
            const deliveryTimeSlot = asString(body.deliveryTimeSlot).trim();
            if (deliveryAddress.length < 10) {
              sendJson(res, { message: "Delivery address must be at least 10 characters." }, 400);
              return;
            }
            if (!deliveryCity) {
              sendJson(res, { message: "Delivery city is required." }, 400);
              return;
            }
            if (!/^(?:07[789]\d{7}|\+9627[789]\d{7})$/.test(deliveryPhone)) {
              sendJson(res, { message: "Enter a valid Jordanian phone number." }, 400);
              return;
            }
            if (!/^https?:\/\/.+/i.test(deliveryLocationLink)) {
              sendJson(res, { message: "A valid location link is required." }, 400);
              return;
            }
            if (!deliveryDate || !deliveryTimeSlot) {
              sendJson(res, { message: "Delivery date and time slot are required." }, 400);
              return;
            }
            const isPaid = (found.license?.paymentStatus ?? app?.paymentStatus) === "paid";
            const tracking = isPaid ? found.license?.aramexTrackingNumber ?? app?.aramexTrackingNumber ?? generateMockAramexTrackingNumber() : found.license?.aramexTrackingNumber ?? app?.aramexTrackingNumber;
            const deliveryStatus = isPaid ? "payment_confirmed" : "pending_payment";
            for (const target of [app, found.license].filter(Boolean)) {
              target.deliveryMethod = "aramex";
              target.deliveryAddress = deliveryAddress;
              target.deliveryCity = deliveryCity;
              target.deliveryPhone = deliveryPhone;
              target.deliveryLocationLink = deliveryLocationLink;
              target.deliveryDate = deliveryDate;
              target.deliveryTimeSlot = deliveryTimeSlot;
              target.deliveryStatus = deliveryStatus;
              if (tracking) target.aramexTrackingNumber = tracking;
            }
            sendJson(res, { application: app, license: found.license ?? null });
            return;
          }

          if (method === "GET" && path === "/licenses/my") {
            const license = licenses.find((item) => item.userId === user.id);
            if (!license) {
              sendJson(res, { message: "No license found" }, 404);
              return;
            }
            sendJson(res, license);
            return;
          }

          if (method === "GET" && path === "/licenses/me") {
            sendJson(res, { license: licenses.find((item) => item.userId === user.id) ?? null });
            return;
          }

          if (method === "GET" && path === "/officer/dashboard") {
            const stageApps = officerApplications(user);
            sendJson(res, {
              center: centers.find((item) => item.centerType !== "TRAINING") ?? centers[0],
              todayAppointments: stageApps.length,
              pendingAppointments: stageApps.length,
              completedToday: 0,
              recentAppointments: stageApps.map((app) => latestAppointment(app.id)).filter(Boolean),
            });
            return;
          }

          if (method === "GET" && path === "/officer/appointments") {
            sendJson(res, officerApplications(user).map((app) => latestAppointment(app.id)).filter(Boolean).map(withApplication));
            return;
          }

          if (method === "GET" && path === "/officer/applications/search") {
            const url = new URL(req.url ?? "/", "http://localhost");
            const nationalId = url.searchParams.get("nationalId");
            const foundUser = demoUsers.find((item) => item.profile.nationalId === nationalId);
            const apps = foundUser ? applications.filter((app) => app.userId === foundUser.id && officerCanAccessApplication(user, app)) : [];
            sendJson(res, apps.map((app) => applicationDetail(app)));
            return;
          }

          if (method === "POST" && path === "/officer/medical/record") {
            const body = await readJson(req);
            const app = applications.find((item) => item.id === asString(body.applicationId));
            if (!app) {
              sendJson(res, { message: "Application is not in the medical/vision stage" }, 409);
              return;
            }
            const result = normalizeMedicalResult(asString(body.result));
            if (result === "NOT_FIT_TO_DRIVE" && !asString(body.notes).trim()) {
              sendJson(res, { message: "Notes are required when the citizen is not fit to drive" }, 400);
              return;
            }
            medicalTests.unshift({ id: `med-${Date.now()}`, applicationId: app.id, officerId: user.id, result, notes: asString(body.notes), createdAt: new Date().toISOString() });
            completeAppointment(app.id, "MEDICAL_TEST");
            if (result === "NOT_FIT_TO_DRIVE") {
              app.status = "MEDICAL_REJECTED";
              app.currentStep = "MEDICAL_REJECTED";
              addNotification(app.userId, "Vision test result rejected", `لم يتم السماح باستكمال إجراءات الرخصة بناءً على نتيجة فحص النظر. السبب: ${asString(body.notes)}`);
            } else {
              app.status = "MEDICAL_PASSED";
              app.currentStep = "THEORY_BOOKING";
              addNotification(app.userId, "Vision test completed", "تم اجتياز فحص النظر. يرجى اختيار موعد للامتحان النظري.");
            }
            app.updatedAt = new Date().toISOString();
            sendJson(res, medicalTests[0], 201);
            return;
          }

          if (method === "POST" && path === "/officer/exams/record") {
            const body = await readJson(req);
            sendJson(res, recordExamMock(body, user), 201);
            return;
          }

          if (method === "POST" && path === "/officer/practical/record") {
            const body = await readJson(req);
            const checklist = Array.isArray(body.checklist) ? body.checklist : [];
            const score = practicalScore(checklist);
            sendJson(res, recordExamMock({ ...body, examType: "PRACTICAL", score, result: score >= 70 ? "PASSED" : "FAILED", notes: JSON.stringify({ notes: body.notes ?? "", checklist }) }, user), 201);
            return;
          }

          if (method === "GET" && path === "/admin/stats") {
            sendJson(res, {
              totalApplications: 24,
              pendingReview: 5,
              totalCitizens: 18,
              totalCenters: centers.length,
              licensesIssued: 7,
              passedExamsCount: 11,
              failedExamsCount: 2,
              applicationsByStatus: [{ status: "TRAINING_CENTER_SELECTED", count: 8 }],
              applicationsByGovernorate: [{ governorate: "Amman", count: 14 }],
            });
            return;
          }

          if (method === "GET" && path === "/admin/recent-activity") {
            sendJson(res, []);
            return;
          }

          next();
        } catch (error) {
          sendJson(res, { message: error instanceof Error ? error.message : "Unexpected dev API error" }, 500);
        }
      });
    },
  };
}

function demoUser(id: string, email: string, password: string, role: string, firstName: string, familyName: string, overrides: Record<string, unknown> = {}): DemoUser {
  return {
    id,
    email,
    password,
    role,
    isEmailVerified: true,
    isActive: true,
    createdAt: now,
    profile: {
      id: `profile-${id}`,
      userId: id,
      firstName,
      secondName: String(overrides.secondName ?? ""),
      thirdName: String(overrides.thirdName ?? ""),
      familyName,
      age: Number(overrides.age ?? 25),
      dateOfBirth: typeof overrides.dateOfBirth === "string" ? overrides.dateOfBirth : undefined,
      gender: typeof overrides.gender === "string" ? overrides.gender : undefined,
      nationalId: String(overrides.nationalId ?? "9876543210"),
      phone: String(overrides.phone ?? "+962-7-9876-5432"),
      governorate: String(overrides.governorate ?? "Amman"),
      city: String(overrides.city ?? "Amman"),
      area: String(overrides.area ?? "Shmeisani"),
      address: String(overrides.address ?? "Mecca Street, Amman"),
      personalPhotoUrl: typeof overrides.personalPhotoUrl === "string" ? overrides.personalPhotoUrl : undefined,
      profileStatus: "COMPLETE",
    },
  };
}

function getPath(req: Connect.IncomingMessage): string {
  return new URL(req.url ?? "/", "http://localhost").pathname;
}

function publicUser(user: DemoUser) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function compactDate() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function generateEfawateercomReference() {
  for (let i = 0; i < 8; i += 1) {
    const reference = `RKH-${compactDate()}-${Math.floor(100000 + Math.random() * 900000)}`;
    if (!applications.some((item) => item.paymentReference === reference) && !licenses.some((item) => item.paymentReference === reference)) return reference;
  }
  return `RKH-${compactDate()}-${String(Date.now()).slice(-6)}`;
}

function generateMockAramexTrackingNumber() {
  return `ARX${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

function paymentEligible(app: any) {
  return ["PRACTICAL_PASSED", "LICENSE_ISSUANCE", "LICENSE_ISSUED"].includes(app?.status ?? "");
}

function findApplicationOrLicense(id: string) {
  const license = licenses.find((item) => item.id === id);
  if (license) {
    return { license, app: applications.find((item) => item.id === license.applicationId) ?? null };
  }
  const app = applications.find((item) => item.id === id);
  return app ? { app, license: licenses.find((item) => item.applicationId === app.id) ?? null } : null;
}

function applicationDetail(app: (typeof applications)[number]) {
  const owner = demoUsers.find((item) => item.id === app.userId) ?? demoUsers[1];
  const service = services.find((item) => item.id === app.serviceId) ?? services[0];
  const licenseCategory = licenseCategories.find((item) => item.id === app.licenseCategoryId) ?? licenseCategories[0];
  const appAppointments = appointments.filter((item) => item.applicationId === app.id).map(withCenter);
  const appMedicalTest = medicalTests.find((item) => item.applicationId === app.id) ?? null;
  const appExams = exams.filter((item) => item.applicationId === app.id);

  return {
    ...app,
    service,
    licenseCategory,
    profile: owner.profile,
    user: { id: owner.id, email: owner.email },
    documents: documents.filter((item) => item.applicationId === app.id),
    appointments: appAppointments,
    trainingRecord: null,
    medicalTest: appMedicalTest,
    exams: appExams,
    license: licenseForApplication(app.id),
    steps: stepper(app),
  };
}

function updateSecurityApplication(id: string, action: string | undefined, note = ""): (typeof applications)[number] | null {
  const app = applications.find((item) => item.id === id);
  if (!app) return null;
  if (app.status !== "SECURITY_REVIEW") return app;

  if (action === "approve") {
    const certificate = documents.find((item) => item.applicationId === app.id && item.documentType === "TRAINING_CERTIFICATE");
    if (!certificate) return app;
    app.status = "SECURITY_APPROVED";
    app.currentStep = "MEDICAL_BOOKING";
    addNotification(app.userId, "Security review approved", "تمت الموافقة على طلبك، يرجى الانتقال للمرحلة التالية وحجز موعد فحص النظر.");
  } else if (action === "reject") {
    app.status = "SECURITY_REJECTED";
    app.currentStep = "SECURITY_REJECTED";
    app.rejectionReason = note;
    addNotification(app.userId, "Security review rejected", `تم رفض طلبك. السبب: ${note || "لم يتم تحديد سبب"}`, "ERROR");
  } else if (action === "request-more-info") {
    app.status = "SECURITY_REVIEW";
    app.currentStep = "SECURITY_REVIEW";
    app.rejectionReason = note;
    addNotification(app.userId, "Additional information requested", note || "يرجى مراجعة طلبك وتحديث المعلومات المطلوبة.", "INFO");
  }

  app.updatedAt = new Date().toISOString();
  return app;
}

function userNotifications(userId: string) {
  return notifications.filter((item) => !item.userId || item.userId === userId);
}

function addNotification(userId: string, title: string, message: string, type = "SUCCESS") {
  notifications.unshift({ id: `notif-${Date.now()}-${Math.random()}`, userId, title, message, type, isRead: false, createdAt: new Date().toISOString() });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number) {
  const [hour = 9, minute = 0] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function filterCenters(type: string | null, governorate: string | null) {
  const aliases: Record<string, string[]> = {
    HEALTH_CENTER: ["HEALTH_CENTER", "MEDICAL"],
    health_center: ["HEALTH_CENTER", "MEDICAL"],
    MEDICAL_TEST: ["HEALTH_CENTER", "MEDICAL"],
    EXAM_CENTER: ["EXAM_CENTER", "THEORY_EXAM", "PRACTICAL_EXAM_CENTER"],
    licensing_center: ["EXAM_CENTER", "THEORY_EXAM", "PRACTICAL_EXAM_CENTER"],
    THEORY_EXAM: ["EXAM_CENTER", "THEORY_EXAM"],
    PRACTICAL_EXAM: ["EXAM_CENTER", "PRACTICAL_EXAM_CENTER"],
    PRACTICAL_EXAM_CENTER: ["EXAM_CENTER", "PRACTICAL_EXAM_CENTER"],
  };
  const allowed = type ? aliases[type] ?? [type] : null;
  return centers.filter((center) => center.isActive && (!allowed || allowed.includes(center.centerType)) && (!governorate || center.governorate === governorate));
}

function appointmentSlots(centerId: string, date: string) {
  const starts = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"];
  return starts.map((startTime) => {
    const booked = appointments.filter((item) => item.centerId === centerId && item.appointmentDate === date && item.startTime === startTime && item.status === "BOOKED").length;
    return { startTime, endTime: addMinutes(startTime, 30), capacity: 5, booked, available: booked < 5 };
  });
}

function withCenter(appointment: any) {
  return { ...appointment, center: centers.find((item) => item.id === appointment.centerId) ?? null };
}

function withApplication(appointment: any) {
  const app = applications.find((item) => item.id === appointment.applicationId);
  const owner = app ? demoUsers.find((item) => item.id === app.userId) : null;
  return { ...appointment, application: app ?? null, profile: owner?.profile ?? null, user: owner ? { id: owner.id, email: owner.email } : null };
}

function validateBooking(app: any, appointmentType: string, appointmentDate: string) {
  if (appointmentType === "MEDICAL_TEST" && !["SECURITY_APPROVED", "MEDICAL_BOOKING"].includes(app.status) && app.currentStep !== "MEDICAL_BOOKING") return "Application is not ready for medical/vision test booking";
  if (appointmentType === "THEORY_EXAM" && !["MEDICAL_PASSED", "THEORY_FAILED", "THEORY_BOOKING"].includes(app.status) && app.currentStep !== "THEORY_BOOKING") return "Application is not ready for theory exam booking";
  if (appointmentType === "PRACTICAL_EXAM" && !["THEORY_PASSED", "PRACTICAL_FAILED", "PRACTICAL_BOOKING"].includes(app.status) && app.currentStep !== "PRACTICAL_BOOKING") return "Application is not ready for practical exam booking";
  const existing = appointments.find((item) => item.applicationId === app.id && item.appointmentType === appointmentType && item.status === "BOOKED");
  if (existing) return "An active appointment already exists for this stage";
  const failed = latestFailedExam(app.id, appointmentType === "THEORY_EXAM" ? "THEORY" : appointmentType === "PRACTICAL_EXAM" ? "PRACTICAL" : "");
  if (failed && ["THEORY_EXAM", "PRACTICAL_EXAM"].includes(appointmentType)) {
    const earliest = new Date(failed.createdAt);
    earliest.setDate(earliest.getDate() + 10);
    if (new Date(`${appointmentDate}T00:00:00`) < earliest) return `${appointmentType === "THEORY_EXAM" ? "Theory" : "Practical"} exam can be rebooked from ${earliest.toISOString().slice(0, 10)}`;
  }
  return "";
}

function transitionAfterBooking(app: any, appointmentType: string) {
  if (appointmentType === "MEDICAL_TEST") {
    app.status = "MEDICAL_APPOINTMENT_BOOKED";
    app.currentStep = "MEDICAL_APPOINTMENT_BOOKED";
  } else if (appointmentType === "THEORY_EXAM") {
    app.status = "THEORY_APPOINTMENT_BOOKED";
    app.currentStep = "THEORY_APPOINTMENT_BOOKED";
  } else if (appointmentType === "PRACTICAL_EXAM") {
    app.status = "PRACTICAL_APPOINTMENT_BOOKED";
    app.currentStep = "PRACTICAL_APPOINTMENT_BOOKED";
  }
  app.updatedAt = new Date().toISOString();
}

function completeAppointment(applicationId: string, appointmentType: string) {
  const appointment = appointments.find((item) => item.applicationId === applicationId && item.appointmentType === appointmentType && item.status === "BOOKED");
  if (appointment) appointment.status = "COMPLETED";
}

function officerApplications(user: DemoUser) {
  const role = user.role;
  const statuses = role.includes("MEDICAL") ? ["MEDICAL_APPOINTMENT_BOOKED"]
    : role.includes("THEORY") ? ["THEORY_APPOINTMENT_BOOKED"]
    : role.includes("PRACTICAL") ? ["PRACTICAL_APPOINTMENT_BOOKED"]
    : role === "SECURITY_OFFICER" ? ["SECURITY_REVIEW"]
    : [];
  return statuses.length ? applications.filter((app) => statuses.includes(app.status)) : applications;
}

function officerCanAccessApplication(user: DemoUser, app: any) {
  const role = user.role;
  const appointmentTypes = appointments.filter((item) => item.applicationId === app.id).map((item) => item.appointmentType);
  const examTypes = exams.filter((item) => item.applicationId === app.id).map((item) => item.examType);
  if (role.includes("MEDICAL")) return ["MEDICAL_APPOINTMENT_BOOKED", "MEDICAL_PASSED", "MEDICAL_REJECTED", "LICENSE_RENEWED", "RENEWAL_MEDICAL_REJECTED"].includes(app.status) || appointmentTypes.includes("MEDICAL_TEST") || medicalTests.some((item) => item.applicationId === app.id);
  if (role.includes("THEORY")) return ["THEORY_APPOINTMENT_BOOKED", "THEORY_PASSED", "THEORY_FAILED"].includes(app.status) || appointmentTypes.includes("THEORY_EXAM") || examTypes.includes("THEORY");
  if (role.includes("PRACTICAL")) return ["PRACTICAL_APPOINTMENT_BOOKED", "PRACTICAL_FAILED", "LICENSE_ISSUED"].includes(app.status) || appointmentTypes.includes("PRACTICAL_EXAM") || examTypes.includes("PRACTICAL");
  if (role === "SECURITY_OFFICER") return app.status === "SECURITY_REVIEW";
  return true;
}

function latestAppointment(applicationId: string) {
  return appointments.find((item) => item.applicationId === applicationId && item.status === "BOOKED") ?? appointments.find((item) => item.applicationId === applicationId);
}

function normalizeMedicalResult(value: string) {
  if (["APPROVED_NO_GLASSES", "PASS_NO_GLASSES", "no_glasses"].includes(value)) return "DOES_NOT_NEED_GLASSES";
  if (["APPROVED_NEEDS_GLASSES", "PASS_WITH_GLASSES", "needs_glasses"].includes(value)) return "NEEDS_GLASSES";
  if (["NOT_APPROVED_NOT_FIT", "unfit_to_drive"].includes(value)) return "NOT_FIT_TO_DRIVE";
  return value;
}

function recordExamMock(body: Record<string, unknown>, officer: DemoUser) {
  const app = applications.find((item) => item.id === asString(body.applicationId));
  if (!app) throw new Error("Application not found");
  const examType = asString(body.examType);
  const score = Number(body.score ?? 0);
  const result = score >= 70 ? "PASSED" : "FAILED";
  const exam = { id: `exam-${Date.now()}`, applicationId: app.id, officerId: officer.id, examType, score: String(score), maxScore: "100", result, notes: asString(body.notes), createdAt: new Date().toISOString() };
  exams.unshift(exam);
  completeAppointment(app.id, examType === "THEORY" ? "THEORY_EXAM" : "PRACTICAL_EXAM");
  if (examType === "THEORY") {
    app.status = result === "PASSED" ? "THEORY_PASSED" : "THEORY_FAILED";
    app.currentStep = result === "PASSED" ? "PRACTICAL_BOOKING" : "THEORY_BOOKING";
    addNotification(app.userId, result === "PASSED" ? "Theory exam passed" : "Theory exam failed", result === "PASSED"
      ? "لقد نجحت في الامتحان النظري. يرجى حجز موعد الامتحان العملي."
      : "لم تجتز الامتحان النظري. يمكنك حجز موعد جديد بعد 10 أيام.", result === "PASSED" ? "SUCCESS" : "ERROR");
  } else {
    if (result === "PASSED") {
      app.status = "LICENSE_ISSUED";
      app.currentStep = "LICENSE_ISSUANCE";
      const license = issueLicense(app);
      addNotification(app.userId, "License issued", "مبروك! لقد اجتزت الامتحان العملي وحصلت على الرخصة.");
      return { exam, application: app, license };
    }
    app.status = "PRACTICAL_FAILED";
    app.currentStep = "PRACTICAL_BOOKING";
    const license = licenses.find((item) => item.applicationId === app.id);
    if (license) license.status = "CANCELLED";
    const unchecked = practicalUnchecked(asString(body.notes));
    addNotification(app.userId, "Practical exam failed", `لم تجتز الامتحان العملي. أسباب الرسوب: ${unchecked || "راجع ملاحظات الفاحص"}`, "ERROR");
  }
  app.updatedAt = new Date().toISOString();
  return { exam, application: app, license: null };
}

function practicalScore(checklist: any[]) {
  const weights: Record<string, number> = { seatbelt_mirrors: 8, traffic_signals: 12, vehicle_control: 12, correct_parking: 10, parallel_parking: 8, reverse: 8, lane_discipline: 8, safe_distance: 6, use_signals: 8, mirror_check: 6, smooth_braking: 6, hill_start: 4, pedestrian_awareness: 4 };
  return checklist.reduce((total, item) => total + (item?.checked ? weights[item.key] ?? 0 : 0), 0);
}

function practicalUnchecked(notes: string) {
  try {
    const parsed = JSON.parse(notes);
    return Array.isArray(parsed.checklist) ? parsed.checklist.filter((item: any) => !item.checked).map((item: any) => item.labelAr ?? item.ar ?? item.label ?? item.key).join(", ") : "";
  } catch {
    return "";
  }
}

function latestFailedExam(applicationId: string, examType: string) {
  return exams.find((item) => item.applicationId === applicationId && item.examType === examType && item.result === "FAILED");
}

function issueLicense(app: any) {
  const existing = licenses.find((item) => item.applicationId === app.id);
  if (existing) return existing;
  const owner = demoUsers.find((item) => item.id === app.userId) ?? demoUsers[1];
  const issue = today();
  const expiry = new Date(`${issue}T00:00:00`);
  expiry.setFullYear(expiry.getFullYear() + 10);
  const licenseNumber = `JO-${new Date().getFullYear()}-${String(licenses.length + 1).padStart(6, "0")}`;
  const license = {
    id: `lic-${Date.now()}`,
    applicationId: app.id,
    userId: app.userId,
    licenseNumber,
    nationalId: owner.profile.nationalId,
    fullNameEn: fullName(owner.profile),
    fullNameAr: fullName(owner.profile),
    licenseCategory: licenseCategories.find((item) => item.id === app.licenseCategoryId) ?? licenseCategories[0],
    issueDate: issue,
    expiryDate: expiry.toISOString().slice(0, 10),
    status: "ACTIVE",
    photoUrl: owner.profile.personalPhotoUrl,
    profilePhotoUrl: owner.profile.personalPhotoUrl,
    dateOfBirth: owner.profile.dateOfBirth,
    address: owner.profile.address,
    governorate: owner.profile.governorate,
    qrCodeUrl: JSON.stringify({ licenseNumber, nationalId: owner.profile.nationalId, issueDate: issue, status: "ACTIVE" }),
    paymentMethod: app.paymentMethod,
    paymentStatus: app.paymentStatus ?? "unpaid",
    paymentAmount: app.paymentAmount ?? "3.00",
    paymentReference: app.paymentReference,
    paymentPaidAt: app.paymentPaidAt,
    deliveryMethod: app.deliveryMethod,
    deliveryStatus: app.deliveryStatus ?? "not_requested",
    deliveryAddress: app.deliveryAddress,
    deliveryCity: app.deliveryCity,
    deliveryPhone: app.deliveryPhone,
    deliveryLocationLink: app.deliveryLocationLink,
    deliveryDate: app.deliveryDate,
    deliveryTimeSlot: app.deliveryTimeSlot,
    aramexTrackingNumber: app.aramexTrackingNumber,
  };
  licenses.unshift(license);
  return license;
}

function licenseForApplication(applicationId: string) {
  const app = applications.find((item) => item.id === applicationId);
  if (!app) return null;
  return licenses.find((item) => item.applicationId === applicationId) ?? (app.status === "LICENSE_ISSUED" ? issueLicense(app) : null);
}

function stepper(app: any) {
  const steps = [
    ["APPLICATION_SUBMITTED", "تقديم الطلب", "Application submitted"],
    ["SECURITY_REVIEW", "المراجعة الأمنية", "Security review"],
    ["MEDICAL_TEST", "فحص النظر", "Vision test"],
    ["THEORY_EXAM", "الامتحان النظري", "Theory exam"],
    ["PRACTICAL_EXAM", "الامتحان العملي", "Practical exam"],
    ["LICENSE_ISSUANCE", "إصدار الرخصة", "License issuance"],
  ];
  const activeIndex = app.status.startsWith("SECURITY") ? 1
    : app.status.startsWith("MEDICAL") ? 2
    : app.status.startsWith("THEORY") ? 3
    : app.status.startsWith("PRACTICAL") ? 4
    : app.status === "LICENSE_ISSUED" ? 5
    : 0;
  return steps.map(([stepKey, stepNameAr, stepNameEn], index) => ({
    id: `${app.id}-${stepKey}`,
    applicationId: app.id,
    stepKey,
    stepNameAr,
    stepNameEn,
    orderNumber: index + 1,
    status: app.status.includes("REJECTED") && index === activeIndex ? "FAILED" : index < activeIndex || app.status === "LICENSE_ISSUED" ? "COMPLETED" : index === activeIndex ? "ACTIVE" : "PENDING",
  }));
}

function fullName(profile: DemoUser["profile"]) {
  return [profile.firstName, profile.secondName, profile.thirdName, profile.familyName].filter(Boolean).join(" ");
}

function createToken(user: DemoUser): string {
  const token = `dev-token-${user.id}-${Date.now()}`;
  tokens.set(token, user);
  return token;
}

function requireUser(req: Connect.IncomingMessage, res: ServerResponse): DemoUser | null {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const user = token ? tokens.get(token) : null;

  if (!user) {
    sendJson(res, { message: "Unauthorized" }, 401);
    return null;
  }

  return user;
}

async function readJson(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const data: unknown = raw ? JSON.parse(raw) : {};
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}
