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
  demoUser("admin", "admin@rukhsty.jo", "Admin123!", "ADMIN", "مدير", "رخصتي"),
  demoUser("user", "user@rukhsty.jo", "User123!", "USER", "محمد", "الأردني"),
  demoUser("training", "training.officer@rukhsty.jo", "Officer123!", "TRAINING_CENTER_OFFICER", "سامر", "رخصتي"),
  demoUser("medical", "medical.officer@rukhsty.jo", "Officer123!", "MEDICAL_CENTER_OFFICER", "ريم", "رخصتي"),
  demoUser("theory", "theory.officer@rukhsty.jo", "Officer123!", "THEORY_EXAM_OFFICER", "خالد", "رخصتي"),
  demoUser("practical", "practical.officer@rukhsty.jo", "Officer123!", "PRACTICAL_EXAM_OFFICER", "لينا", "رخصتي"),
];

const tokens = new Map<string, DemoUser>();

const notifications = [
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

const applications = [
  {
    id: "app-demo-1",
    applicationNumber: "RKH-2026-0001",
    status: "TRAINING_CENTER_SELECTED",
    serviceType: "ISSUE_DRIVING_LICENSE",
    governorate: "Amman",
    createdAt: now,
    updatedAt: now,
  },
];

const centers = [
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
    centerType: "MEDICAL",
    nameAr: "مركز الفحص الطبي عمان",
    nameEn: "Amman Medical Center",
    governorate: "Amman",
    city: "Amman",
    address: "Queen Noor Street, Amman",
    phone: "+962-6-555-0401",
    isActive: true,
  },
];

const licenseCategories = [
  {
    id: "cat-2",
    code: "CAT_2",
    nameAr: "الفئة الثانية",
    nameEn: "Category 2 - Light Vehicles",
    minimumAge: 18,
    description: "Cars and light vehicles up to 3.5 tons",
    isActive: true,
  },
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
            const token = createToken(user);
            sendJson(res, { token, user: publicUser(user) }, 201);
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
            sendJson(res, {
              totalApplications: applications.length,
              upcomingAppointments: 1,
              unreadNotifications: notifications.filter((item) => !item.isRead).length,
              profileCompletionPercent: 100,
              activeApplication: applications[0],
              myLicense: null,
            });
            return;
          }

          if (method === "GET" && path === "/notifications") {
            sendJson(res, notifications);
            return;
          }

          if (method === "GET" && path === "/applications") {
            sendJson(res, applications);
            return;
          }

          if (method === "GET" && path.startsWith("/applications/")) {
            sendJson(res, { ...applications[0], steps: [] });
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
            sendJson(res, [
              { id: "svc-license", nameAr: "استخراج رخصة قيادة", nameEn: "Issue Driving License", code: "ISSUE_DRIVING_LICENSE", isActive: true },
            ]);
            return;
          }

          if (method === "GET" && path === "/license-categories") {
            sendJson(res, licenseCategories);
            return;
          }

          if (method === "GET" && path === "/centers") {
            sendJson(res, centers);
            return;
          }

          if (method === "GET" && path === "/appointments") {
            sendJson(res, []);
            return;
          }

          if (method === "GET" && path === "/licenses/my") {
            sendJson(res, null);
            return;
          }

          if (method === "GET" && path === "/officer/dashboard") {
            sendJson(res, {
              center: centers[0],
              todayAppointments: 3,
              pendingAppointments: 2,
              completedToday: 1,
              recentAppointments: [],
            });
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
