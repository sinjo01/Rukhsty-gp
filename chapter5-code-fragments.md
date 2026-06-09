# Chapter 5 Code Fragments for RukhsTy

This document extracts real implemented code from the current RukhsTy codebase for Chapter 5 documentation. No code below is invented; missing features are marked explicitly.

## 5.2 Tools and Technologies Used

RukhsTy is implemented as a TypeScript monorepo using `pnpm`. The frontend is a React application built with Vite, Wouter routing, React Query, React Hook Form, Zod validation, Tailwind CSS, Radix UI components, Lucide icons, and Framer Motion. The backend is an Express 5 API server written in TypeScript and bundled with esbuild. PostgreSQL is used as the database, with Drizzle ORM and Drizzle Zod for schema definitions and type-safe database access. Authentication uses JWT tokens and bcryptjs password hashing. OpenAPI and Orval are used to define and generate API client and validation code. Pino and pino-http provide structured API logging.

Compared with alternatives, React and Vite were selected instead of heavier frontend frameworks because the project needs fast development, reusable components, and a single-page dashboard experience. Express was selected instead of a more opinionated backend framework such as NestJS because the API is route-focused and benefits from simple middleware composition. PostgreSQL was selected instead of a document database because the application has strong relational requirements between citizens, profiles, applications, appointments, documents, exams, licenses, payments, and notifications. Drizzle ORM was selected instead of raw SQL-only implementation because it keeps database schema and TypeScript types aligned while still producing explicit query logic.

## 5.3 Important Code Fragments

### 1. Authentication and Login Backend

File path: `artifacts/api-server/src/routes/auth.ts`

Function/component name: `POST /auth/login`

```ts
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
```

This route allows login using either email or national ID. It compares the submitted password against the stored bcrypt password hash and returns a JWT token containing the user ID, email, and role.

Suggested figure caption: **Figure 18: Authentication login route using email/national ID, bcrypt comparison, and JWT generation.**

### 2. JWT and Role-Based Access Control

File path: `artifacts/api-server/src/middlewares/auth.ts`

Function/component name: `generateToken`, `requireAuth`, `requireRole`

```ts
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JwtPayload }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}
```

This middleware signs JWTs, validates bearer tokens, stores the decoded user in the request, and blocks access when the authenticated user does not have the required role.

Suggested figure caption: **Figure 18: JWT authentication middleware and backend role guard.**

### 3. Frontend Login and Role Redirection

File path: `artifacts/rukhsty/src/pages/public/login.tsx`

Function/component name: `Login.onSubmit`

```tsx
const onSubmit = async (values: z.infer<typeof loginSchema>) => {
  try {
    const normalizedIdentifier = values.identifier.trim();
    const response = await loginMutation.mutateAsync({
      data: {
        identifier: normalizedIdentifier,
        email: normalizedIdentifier.includes("@") ? normalizedIdentifier : undefined,
        password: values.password,
      },
    });
    login(response.token, response.user);

    toast({
      title: t("loginSuccessTitle"),
      description: t("loginSuccessDescription"),
    });

    if (response.user.role === "SECURITY_OFFICER") {
      setLocation("/security/review");
    } else if (response.user.role === "ADMIN") {
      setLocation("/admin/dashboard");
    } else if (response.user.role.includes("OFFICER")) {
      setLocation("/officer/dashboard");
    } else {
      setLocation("/dashboard");
    }
  } catch {
    toast({
      variant: "destructive",
      title: t("loginFailedTitle"),
      description: t("loginFailedDescription"),
    });
  }
};
```

This frontend login handler sends the identifier and password to the generated API client, stores the token through the auth context, and redirects users to dashboards based on their role.

Suggested figure caption: **Figure 23: Frontend login component with role-based dashboard redirection.**

### 4. User Registration Backend

File path: `artifacts/api-server/src/routes/auth.ts`

Function/component name: `POST /auth/register`

```ts
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

  if (!email || !password || !firstName || !secondName || !thirdName || !familyName || !nationalId || !phone || !dateOfBirth || !gender || !governorate || !address || !personalPhotoUrl) {
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
```

This first part of the registration route cleans request values and validates required fields, email format, national ID format, and password strength before creating any database rows.

Suggested figure caption: **Figure 18: Backend registration validation for citizen account creation.**

File path: `artifacts/api-server/src/routes/auth.ts`

Function/component name: `POST /auth/register`

```ts
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
  res.status(201).json({ message: "Account created. Please log in.", user: { id: user.id, email: user.email, role: user.role } });
});
```

This second part prevents duplicate email and national ID registrations, hashes the password with bcrypt, creates the user row, and creates the linked citizen profile row.

Suggested figure caption: **Figure 18: User and profile creation with bcrypt password hashing.**

### 5. Database Schema / Model Layer

File path: `lib/db/src/schema/users.ts`

Function/component name: `usersTable`

```ts
export const userRoleEnum = pgEnum("user_role", [
  "USER",
  "ADMIN",
  "TRAINING_CENTER_OFFICER",
  "MEDICAL_OFFICER",
  "MEDICAL_CENTER_OFFICER",
  "THEORY_OFFICER",
  "THEORY_EXAM_OFFICER",
  "PRACTICAL_OFFICER",
  "PRACTICAL_EXAM_OFFICER",
  "DVLD_OFFICER",
  "SECURITY_OFFICER",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

This schema defines system users, including role values used by backend and frontend guards.

Suggested figure caption: **Figure 16: User model and role enum schema.**

File path: `lib/db/src/schema/user_profiles.ts`

Function/component name: `userProfilesTable`

```ts
export const userProfilesTable = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  secondName: text("second_name").notNull(),
  thirdName: text("third_name").notNull(),
  familyName: text("family_name").notNull(),
  age: integer("age").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  nationalId: text("national_id").notNull().unique(),
  phone: text("phone"),
  governorate: text("governorate"),
  city: text("city"),
  area: text("area"),
  address: text("address"),
  personalPhotoUrl: text("personal_photo_url"),
  idFrontUrl: text("id_front_url"),
  idBackUrl: text("id_back_url"),
  profileStatus: profileStatusEnum("profile_status").notNull().default("INCOMPLETE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

This schema stores the citizen identity profile and national ID, linked one-to-one with a user account.

Suggested figure caption: **Figure 16: Citizen profile model linked to the user account.**

File path: `lib/db/src/schema/applications.ts`

Function/component name: `applicationsTable`

```ts
export const applicationsTable = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => servicesTable.id),
  licenseCategoryId: uuid("license_category_id").references(() => licenseCategoriesTable.id),
  applicationNumber: text("application_number").notNull().unique(),
  status: text("status").notNull().default("DRAFT"),
  currentStep: text("current_step").notNull().default("PROFILE_REVIEW"),
  governorate: text("governorate"),
  residenceArea: text("residence_area"),
  rejectionReason: text("rejection_reason"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }).default("3.00"),
  paymentReference: text("payment_reference"),
  paymentPaidAt: timestamp("payment_paid_at"),
  deliveryMethod: text("delivery_method"),
  deliveryStatus: text("delivery_status").default("not_requested"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryPhone: text("delivery_phone"),
  deliveryLocationLink: text("delivery_location_link"),
  deliveryDate: date("delivery_date"),
  deliveryTimeSlot: text("delivery_time_slot"),
  aramexTrackingNumber: text("aramex_tracking_number"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

This schema stores driving license service applications, workflow status, payment fields, delivery fields, and Aramex tracking information.

Suggested figure caption: **Figure 16: Application model with payment, delivery, and workflow status fields.**

File path: `lib/db/src/schema/application_steps.ts`

Function/component name: `applicationStepsTable`

```ts
export const applicationStepsTable = pgTable("application_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  stepKey: text("step_key").notNull(),
  stepNameAr: text("step_name_ar").notNull(),
  stepNameEn: text("step_name_en").notNull(),
  status: text("status").notNull().default("PENDING"),
  orderNumber: integer("order_number").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});
```

This schema stores the step-by-step progress tracker for every application.

Suggested figure caption: **Figure 16: Application step model for tracking workflow progress.**

File path: `lib/db/src/schema/documents.ts`

Function/component name: `documentsTable`

```ts
export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applicationsTable.id, {
    onDelete: "set null",
  }),
  documentType: text("document_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  verificationStatus: text("verification_status").notNull().default("PENDING"),
  verifiedBy: uuid("verified_by").references(() => usersTable.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This schema stores uploaded documents such as the required training certificate image.

Suggested figure caption: **Figure 16: Documents model for storing certificate uploads.**

File path: `lib/db/src/schema/appointments.ts`

Function/component name: `appointmentsTable`

```ts
export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  appointmentType: text("appointment_type").notNull(),
  appointmentDate: date("appointment_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  queueNumber: integer("queue_number"),
  status: text("status").notNull().default("BOOKED"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

This schema stores citizen appointments for medical, theory, and practical stages.

Suggested figure caption: **Figure 16: Appointment model for booked service appointments.**

File path: `lib/db/src/schema/medical_tests.ts`

Function/component name: `medicalTestsTable`

```ts
export const medicalTestsTable = pgTable("medical_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  officerId: uuid("officer_id").references(() => usersTable.id),
  result: text("result").notNull(),
  leftEyeScore: text("left_eye_score"),
  rightEyeScore: text("right_eye_score"),
  requiresGlasses: boolean("requires_glasses").notNull().default(false),
  isAllowedToDrive: boolean("is_allowed_to_drive").notNull().default(true),
  notes: text("notes"),
  testedAt: timestamp("tested_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This schema stores the vision/medical test result and the officer who recorded it.

Suggested figure caption: **Figure 16: Medical test model for officer result recording.**

File path: `lib/db/src/schema/exams.ts`

Function/component name: `examsTable`

```ts
export const examsTable = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applicationsTable.id, { onDelete: "cascade" }),
  centerId: uuid("center_id").references(() => centersTable.id),
  officerId: uuid("officer_id").references(() => usersTable.id),
  examType: text("exam_type").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }),
  result: text("result").notNull(),
  attemptNumber: integer("attempt_number").notNull().default(1),
  notes: text("notes"),
  examDate: timestamp("exam_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This schema stores theory and practical exam attempts, scores, and pass/fail results.

Suggested figure caption: **Figure 16: Exam model for theory and practical results.**

File path: `lib/db/src/schema/driving_licenses.ts`

Function/component name: `drivingLicensesTable`

```ts
export const drivingLicensesTable = pgTable("driving_licenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applicationsTable.id),
  licenseNumber: text("license_number").notNull().unique(),
  nationalId: text("national_id").notNull(),
  fullNameAr: text("full_name_ar"),
  fullNameEn: text("full_name_en"),
  licenseCategoryId: uuid("license_category_id").references(() => licenseCategoriesTable.id),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  photoUrl: text("photo_url"),
  qrCodeUrl: text("qr_code_url"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }).default("3.00"),
  paymentReference: text("payment_reference"),
  paymentPaidAt: timestamp("payment_paid_at"),
  deliveryMethod: text("delivery_method"),
  deliveryStatus: text("delivery_status").default("not_requested"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryPhone: text("delivery_phone"),
  deliveryLocationLink: text("delivery_location_link"),
  deliveryDate: date("delivery_date"),
  deliveryTimeSlot: text("delivery_time_slot"),
  aramexTrackingNumber: text("aramex_tracking_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This schema stores issued digital driving licenses, QR payload URL field, payment details, delivery details, and Aramex tracking number.

Suggested figure caption: **Figure 16: Driving license model with digital card, payment, and delivery fields.**

File path: `lib/db/src/schema/notifications.ts`

Function/component name: `notificationsTable`

```ts
export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("INFO"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

This schema stores citizen notifications generated by security approval, exam results, license issuance, and other workflow events.

Suggested figure caption: **Figure 16: Notification model for citizen workflow updates.**

### 6. Submit First-Time Driving License Application

File path: `artifacts/api-server/src/routes/applications.ts`

Function/component name: `POST /applications`

```ts
router.post("/applications", requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const { serviceId, licenseCategoryId, governorate, residenceArea, trainingCertificate } = req.body;
  const [service] = serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1) : [null];
  const isIssueDrivingLicense = service?.code === "ISSUE_DRIVING_LICENSE";
  if (isIssueDrivingLicense) {
    const fileUrl = typeof trainingCertificate?.fileUrl === "string" ? trainingCertificate.fileUrl.trim() : "";
    const fileName = typeof trainingCertificate?.fileName === "string" ? trainingCertificate.fileName.trim() : "";
    const mimeType = typeof trainingCertificate?.mimeType === "string" ? trainingCertificate.mimeType.trim() : "";
    if (!fileUrl || !fileName || !mimeType.startsWith("image/")) {
      res.status(400).json({ message: "Training certificate image is required for first-time driving license applications" });
      return;
    }
  }
  const appNumber = `RU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const [app] = await db.insert(applicationsTable).values({
    userId,
    serviceId,
    licenseCategoryId,
    applicationNumber: appNumber,
    status: isIssueDrivingLicense ? "SECURITY_REVIEW" : "DRAFT",
    currentStep: isIssueDrivingLicense ? "SECURITY_REVIEW" : "PROFILE_REVIEW",
    governorate,
    residenceArea,
    submittedAt: isIssueDrivingLicense ? new Date() : null,
  }).returning();
```

This route creates a citizen application and requires a training certificate image when the selected service is first-time driving license issuance.

Suggested figure caption: **Figure 19: First-time driving license application submission route.**

File path: `artifacts/api-server/src/routes/applications.ts`

Function/component name: `POST /applications`

```ts
  if (isIssueDrivingLicense) {
    await db.insert(documentsTable).values({
      userId,
      applicationId: app.id,
      documentType: TRAINING_CERTIFICATE_DOCUMENT_TYPE,
      fileUrl: trainingCertificate.fileUrl,
      fileName: trainingCertificate.fileName,
      mimeType: trainingCertificate.mimeType,
      verificationStatus: "PENDING",
    });
  }
  await syncApplicationSteps(app.id, app.status, app.currentStep);
  if (isIssueDrivingLicense) {
    await db.insert(notificationsTable).values({
      userId,
      title: "تم تقديم طلبك للمراجعة الأمنية",
      message: `تم تقديم طلبك رقم ${app.applicationNumber} للمراجعة الأمنية.`,
      type: "SUCCESS",
    });
  }
  const detail = await getApplicationDetail(app.id, userId);
  res.status(201).json(detail);
});
```

This code saves the uploaded certificate as a document, creates application tracking steps, sends a notification, and returns the detailed application response.

Suggested figure caption: **Figure 19: Saving certificate document and initializing application tracking.**

### 7. Frontend Application Submission

File path: `artifacts/rukhsty/src/pages/citizen/service-issue-license.tsx`

Function/component name: `ServiceIssueLicense.submit`

```tsx
const submit = async () => {
  if (!selectedCategoryId) {
    toast({ variant: "destructive", title: language === "ar" ? "يرجى اختيار فئة الرخصة" : "Please choose a license category" });
    return;
  }
  if (!trainingCertificate) {
    toast({ variant: "destructive", title: language === "ar" ? "يرجى رفع صورة شهادة التدريب" : "Please upload the training certificate image" });
    setStep(1);
    return;
  }
  const service = services?.find((item: any) => item.code === "ISSUE_DRIVING_LICENSE");
  if (!service) {
    toast({ variant: "destructive", title: language === "ar" ? "الخدمة غير متاحة" : "Issue license service is not available" });
    return;
  }
  try {
    const app = await createApp.mutateAsync({
      data: {
        serviceId: service.id,
        licenseCategoryId: selectedCategoryId,
        governorate: profile?.governorate || "Amman",
        residenceArea: profile?.area || profile?.city || profile?.address || "Amman",
        trainingCertificate,
      },
    });
    toast({
      title: language === "ar" ? "تم تقديم طلبك للمراجعة الأمنية." : "Your application has been submitted for security review.",
      description: (app as any).applicationNumber,
    });
    setLocation(`/applications/${(app as any).id}`);
  } catch (error) {
    toast({ variant: "destructive", title: language === "ar" ? "تعذر تقديم الطلب" : "Failed to submit application", description: error instanceof Error ? error.message : undefined });
  }
};
```

This frontend function validates category and certificate selection, calls the generated API client to create the application, and sends the citizen to the application tracking page.

Suggested figure caption: **Figure 23: Frontend first-time license application submission component.**

### 8. Security Officer Workflow

File path: `artifacts/api-server/src/routes/admin.ts`

Function/component name: `GET /admin/applications`

```ts
router.get("/admin/applications", requireAuth, requireRole("ADMIN", "DVLD_OFFICER", "SECURITY_OFFICER"), async (req, res) => {
  const { status, serviceCode, page = "1", limit = "20" } = req.query as { status?: string; serviceCode?: string; page?: string; limit?: string };
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  if (status && status !== "ALL") conditions.push(eq(applicationsTable.status, status));
  if (serviceCode) {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.code, serviceCode)).limit(1);
    if (!service) {
      res.json({ data: [], page: Number(page), limit: Number(limit), total: 0 });
      return;
    }
    conditions.push(eq(applicationsTable.serviceId, service.id));
  }
  const query = db.select().from(applicationsTable);
  const apps = conditions.length
    ? await query.where(and(...conditions)).orderBy(desc(applicationsTable.createdAt)).limit(Number(limit)).offset(offset)
    : await query.orderBy(desc(applicationsTable.createdAt)).limit(Number(limit)).offset(offset);
  const data = await Promise.all(apps.map(enrichApplication));
  res.json({ data, page: Number(page), limit: Number(limit), total: data.length });
});
```

This route lists applications for admin, DVLD, and security officers. The frontend uses it with `status=SECURITY_REVIEW` and `serviceCode=ISSUE_DRIVING_LICENSE`.

Suggested figure caption: **Figure 20: Security officer queue route for pending application review.**

File path: `artifacts/api-server/src/routes/admin.ts`

Function/component name: `securityApprove`

```ts
async function securityApprove(req: Request, res: Response) {
  const actor = (req as Request & { user: JwtPayload }).user;
  const [currentApp] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!currentApp) { res.status(404).json({ message: "Application not found" }); return; }
  if (currentApp.status !== "SECURITY_REVIEW") { res.status(409).json({ message: "Application is not in security review" }); return; }
  const [service] = currentApp.serviceId ? await db.select().from(servicesTable).where(eq(servicesTable.id, currentApp.serviceId)).limit(1) : [null];
  if (service?.code === "ISSUE_DRIVING_LICENSE") {
    const [trainingCertificate] = await db.select().from(documentsTable).where(and(
      eq(documentsTable.applicationId, currentApp.id),
      eq(documentsTable.documentType, TRAINING_CERTIFICATE_DOCUMENT_TYPE),
    )).limit(1);
    if (!trainingCertificate) {
      res.status(409).json({ message: "Training certificate image is required before approving this application" });
      return;
    }
  }
  const [app] = await db.update(applicationsTable).set({
    status: "SECURITY_APPROVED",
    currentStep: "MEDICAL_BOOKING",
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, routeParam(req, "id"))).returning();
```

This function approves an application only if it is still in security review and, for first-time license applications, confirms the training certificate exists.

Suggested figure caption: **Figure 20: Security approval route with certificate verification.**

File path: `artifacts/api-server/src/routes/admin.ts`

Function/component name: `securityReject`

```ts
async function securityReject(req: Request, res: Response) {
  const actor = (req as Request & { user: JwtPayload }).user;
  const { rejectionReason } = req.body;
  if (!rejectionReason) { res.status(400).json({ message: "rejectionReason is required" }); return; }
  const [currentApp] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, routeParam(req, "id"))).limit(1);
  if (!currentApp) { res.status(404).json({ message: "Application not found" }); return; }
  if (currentApp.status !== "SECURITY_REVIEW") { res.status(409).json({ message: "Application is not in security review" }); return; }
  const [app] = await db.update(applicationsTable).set({
    status: "SECURITY_REJECTED",
    currentStep: "SECURITY_REJECTED",
    rejectionReason,
    completedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(applicationsTable.id, routeParam(req, "id"))).returning();
  if (!app) { res.status(404).json({ message: "Application not found" }); return; }
  await db.update(applicationStepsTable).set({ status: "FAILED", notes: rejectionReason }).where(and(eq(applicationStepsTable.applicationId, app.id), eq(applicationStepsTable.stepKey, "SECURITY_REVIEW")));
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: "Security review rejected",
    message: `Your application was rejected. Reason: ${rejectionReason}`,
    type: "ERROR",
  });
```

This function rejects a security-review application, stores the rejection reason, marks the security step as failed, and sends the citizen a notification.

Suggested figure caption: **Figure 20: Security rejection route with status transition and notification.**

File path: `artifacts/api-server/src/routes/admin.ts`

Function/component name: security routes

```ts
router.post("/security/applications/:id/approve", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), securityApprove);
router.post("/security/applications/:id/reject", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), securityReject);
router.post("/security/applications/:id/request-more-info", requireAuth, requireRole("ADMIN", "SECURITY_OFFICER"), requestMoreInfo);
```

These routes expose the security-specific approval, rejection, and information request endpoints with explicit role guards.

Suggested figure caption: **Figure 20: Security officer protected API endpoints.**

### 9. Medical Officer Workflow

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `recordMedical`

```ts
async function recordMedical(req: Request, res: Response) {
  if (!assertRole(req, res, ["MEDICAL_OFFICER", "MEDICAL_CENTER_OFFICER", "ADMIN"])) return;
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId = routeParam(req, "applicationId"), centerId, result, leftEyeScore, rightEyeScore, requiresGlasses, isAllowedToDrive, notes } = req.body;
  const allowedResults = ["DOES_NOT_NEED_GLASSES", "NEEDS_GLASSES", "NOT_FIT_TO_DRIVE", "APPROVED_NO_GLASSES", "APPROVED_NEEDS_GLASSES", "NOT_APPROVED_NOT_FIT", "PASS_NO_GLASSES", "PASS_WITH_GLASSES"];
  if (!allowedResults.includes(result)) {
    res.status(400).json({ message: "A valid medical result is required" });
    return;
  }
```

This function allows only medical officers or admins to record vision/medical results and validates allowed result values.

Suggested figure caption: **Figure 20: Medical officer route guard and result validation.**

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `recordMedical`

```ts
  const [test] = await db.insert(medicalTestsTable).values({
    applicationId,
    centerId: centerId ?? appointment?.centerId ?? null,
    officerId,
    result: normalizedResult,
    leftEyeScore,
    rightEyeScore,
    requiresGlasses: requiresGlasses ?? normalizedResult === "NEEDS_GLASSES",
    isAllowedToDrive: isAllowedToDrive ?? normalizedResult !== "NOT_FIT_TO_DRIVE",
    notes,
  }).returning();
  const passed = ["DOES_NOT_NEED_GLASSES", "NEEDS_GLASSES"].includes(normalizedResult);

  if (isRenewal) {
    let updatedApp: typeof applicationsTable.$inferSelect | null = null;
    let renewedLicense: typeof drivingLicensesTable.$inferSelect | null = null;
    if (passed) {
      const [license] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.userId, app.userId)).orderBy(desc(drivingLicensesTable.createdAt)).limit(1);
      if (!license) {
        res.status(404).json({ message: "No current driving license found for renewal" });
        return;
      }
      const newExpiry = addYears(license.expiryDate, 10);
      [renewedLicense] = await db.update(drivingLicensesTable).set({ expiryDate: newExpiry, status: "ACTIVE" }).where(eq(drivingLicensesTable.id, license.id)).returning();
      [updatedApp] = await db.update(applicationsTable).set({ status: "LICENSE_RENEWED", currentStep: "LICENSE_RENEWED", completedAt: new Date(), updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId)).returning();
    } else {
      [updatedApp] = await db.update(applicationsTable).set({ status: "RENEWAL_MEDICAL_REJECTED", currentStep: "RENEWAL_MEDICAL_REJECTED", updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId)).returning();
    }
```

This code inserts the medical test result. In renewal cases, a passing result renews the current license, while a failing result marks the renewal medical stage as rejected.

Suggested figure caption: **Figure 20: Medical result persistence and renewal status transition.**

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `recordMedical`

```ts
  const newStatus = passed ? "MEDICAL_PASSED" : "MEDICAL_REJECTED";
  await db.update(applicationsTable).set({ status: newStatus, currentStep: passed ? "THEORY_BOOKING" : "MEDICAL_REJECTED", updatedAt: new Date() }).where(eq(applicationsTable.id, applicationId));
  if (appointment) await db.update(appointmentsTable).set({ status: "COMPLETED", updatedAt: new Date() }).where(eq(appointmentsTable.id, appointment.id));
  await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "MEDICAL_TEST")));
  if (passed) await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "THEORY_EXAM")));
```

This first-time license path moves the application to theory booking when the medical result passes, or to medical rejection when it fails.

Suggested figure caption: **Figure 20: Medical result status transition for first-time license applications.**

### 10. Theory and Practical Officer Workflow

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `recordExam`

```ts
async function recordExam(req: Request, res: Response) {
  const requestedType = req.body.examType;
  if (requestedType === "THEORY" && !assertRole(req, res, ["THEORY_EXAM_OFFICER", "THEORY_OFFICER", "ADMIN"])) return;
  if (requestedType === "PRACTICAL" && !assertRole(req, res, ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER", "ADMIN"])) return;
  const { userId: officerId } = (req as Request & { user: JwtPayload }).user;
  const { applicationId = routeParam(req, "applicationId"), centerId, examType, score, maxScore, notes, verification } = req.body;
  let { result } = req.body;
  if (!applicationId) { res.status(400).json({ message: "applicationId is required" }); return; }
  if (!["THEORY", "PRACTICAL"].includes(examType)) { res.status(400).json({ message: "A valid examType is required" }); return; }
```

This function enforces role-specific permissions for theory and practical officers before recording exam results.

Suggested figure caption: **Figure 20: Theory and practical exam role validation.**

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `recordExam`

```ts
  const prevExams = await db.select().from(examsTable).where(and(eq(examsTable.applicationId, applicationId), eq(examsTable.examType, examType)));
  const [exam] = await db.insert(examsTable).values({
    applicationId,
    centerId: centerId ?? appointment?.centerId ?? null,
    officerId,
    examType,
    score: score?.toString(),
    maxScore: (maxScore ?? 100)?.toString(),
    result,
    attemptNumber: prevExams.length + 1,
    notes,
  }).returning();
  const passed = result === "PASSED";
  let newStatus = app.status, newStep = app.currentStep;
  if (examType === "THEORY") {
    newStatus = passed ? "THEORY_PASSED" : "THEORY_FAILED";
    newStep = passed ? "PRACTICAL_BOOKING" : "THEORY_BOOKING";
    await db.update(applicationStepsTable).set({ status: passed ? "COMPLETED" : "FAILED", completedAt: passed ? new Date() : null }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "THEORY_EXAM")));
    if (passed) await db.update(applicationStepsTable).set({ status: "ACTIVE", startedAt: new Date() }).where(and(eq(applicationStepsTable.applicationId, applicationId), eq(applicationStepsTable.stepKey, "PRACTICAL_EXAM")));
  } else if (examType === "PRACTICAL") {
    newStatus = passed ? "LICENSE_ISSUED" : "PRACTICAL_FAILED";
    newStep = passed ? "LICENSE_ISSUANCE" : "PRACTICAL_BOOKING";
```

This code stores the exam attempt, calculates the next application status, and moves the workflow to practical booking or license issuance.

Suggested figure caption: **Figure 20: Exam result persistence and workflow transition.**

File path: `artifacts/api-server/src/routes/officer.ts`

Function/component name: `POST /officer/practical/record`

```ts
router.post("/officer/practical/record", requireAuth, requireAnyOfficerOrAdmin, async (req, res) => {
  if (!assertRole(req, res, ["PRACTICAL_EXAM_OFFICER", "PRACTICAL_OFFICER", "ADMIN"])) return;
  const checklist = Array.isArray(req.body.checklist) ? req.body.checklist : [];
  const computedScore = checklist.reduce((total: number, item: any) => {
    const key = String(item?.key ?? "");
    const weight = PRACTICAL_WEIGHTS[key];
    return total + (item?.checked && weight ? weight : 0);
  }, 0);
  const unknownItems = checklist.filter((item: any) => !Object.prototype.hasOwnProperty.call(PRACTICAL_WEIGHTS, String(item?.key ?? "")));
  if (unknownItems.length > 0 || checklist.length !== Object.keys(PRACTICAL_WEIGHTS).length) {
    res.status(400).json({ message: "Practical checklist must use the official weighted items" });
    return;
  }
  const submittedScore = Number(req.body.score ?? computedScore);
  if (!Number.isFinite(submittedScore) || submittedScore !== computedScore) {
    res.status(400).json({ message: "Practical score must match the checked checklist items" });
    return;
  }
  req.body.examType = "PRACTICAL";
  req.body.score = computedScore;
  req.body.maxScore = 100;
  req.body.result = req.body.score >= PASS_THRESHOLD ? "PASSED" : "FAILED";
  req.body.notes = JSON.stringify({ notes: req.body.notes ?? "", checklist, verification: req.body.verification ?? null });
  await recordExam(req, res);
});
```

This route calculates the practical driving score from the official checklist, validates the submitted score, and forwards the result to the shared exam recording function.

Suggested figure caption: **Figure 20: Practical exam weighted checklist scoring.**

### 11. Digital License Issuing

File path: `artifacts/api-server/src/services/license-issuance.ts`

Function/component name: `issueLicenseForApplication`

```ts
export async function issueLicenseForApplication(applicationId: string, _issuedBy?: string | null) {
  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
  if (!app) throw Object.assign(new Error("Application not found"), { statusCode: 404 });

  const isEligible = ELIGIBLE_STATUSES.includes(app.status) || ELIGIBLE_STEPS.includes(app.currentStep ?? "");
  if (!isEligible) throw Object.assign(new Error("Application is not eligible for license issuance"), { statusCode: 409 });

  const [existingByApplication] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.applicationId, applicationId)).limit(1);
  if (existingByApplication) {
    await completeIssuedApplication(app.id);
    return existingByApplication;
  }
```

This service checks whether an application can receive a license and prevents duplicate license creation for the same application.

Suggested figure caption: **Figure 21: License issuance eligibility and duplicate prevention.**

File path: `artifacts/api-server/src/services/license-issuance.ts`

Function/component name: `issueLicenseForApplication`

```ts
  const [license] = await db.insert(drivingLicensesTable).values({
    userId: app.userId,
    applicationId: app.id,
    licenseNumber,
    nationalId: profile?.nationalId ?? "UNKNOWN",
    fullNameAr: profileFullName(profile ?? null),
    fullNameEn: profileFullName(profile ?? null),
    licenseCategoryId: app.licenseCategoryId,
    issueDate: toIsoDate(issueDate),
    expiryDate: toIsoDate(expiryDate),
    status: "ACTIVE",
    photoUrl: profile?.personalPhotoUrl,
    qrCodeUrl: qrPayload,
  }).returning();

  await completeIssuedApplication(app.id);
  await db.insert(notificationsTable).values({
    userId: app.userId,
    title: "License issued",
    message: "Congratulations! You passed the practical exam and received your driving license. مبروك! لقد اجتزت الامتحان العملي وحصلت على الرخصة.",
    type: "SUCCESS",
  });
  return license;
}
```

This code creates the driving license record, stores the QR payload, completes the application, and notifies the citizen.

Suggested figure caption: **Figure 21: Digital driving license creation and citizen notification.**

File path: `artifacts/rukhsty/src/pages/citizen/digital-license-card.tsx`

Function/component name: `DigitalLicenseCard`

```tsx
export function DigitalLicenseCard({ license, className = "" }: { license: any; className?: string }) {
  const [flipped, setFlipped] = useState(false);
  const serial = fieldValue(license?.licenseSerial ?? license?.licenseNumber ?? license?.id);
  const verify = useMemo(() => verificationUrl(serial), [serial]);

  return (
    <div className={`rukhsty-license-print mx-auto w-full max-w-[620px] ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600;700&family=Tinos:wght@400;700&display=swap');
        .rukhsty-license-card-face { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rukhsty-license-ar { font-family: "Noto Naskh Arabic", "Amiri", serif; }
        .rukhsty-license-en { font-family: "Tinos", Georgia, "Times New Roman", serif; }
        .rukhsty-license-value { font-family: "Tinos", "Noto Naskh Arabic", serif; letter-spacing: 0; }
        @media print {
          body * { visibility: hidden !important; }
          .rukhsty-license-print, .rukhsty-license-print * { visibility: visible !important; }
          .rukhsty-license-print { position: absolute !important; inset: 10mm auto auto 10mm !important; width: 92mm !important; max-width: 92mm !important; }
          .rukhsty-license-interactive { display: none !important; }
          .rukhsty-license-print-stack { display: grid !important; gap: 8mm !important; }
          .rukhsty-license-card-face { box-shadow: none !important; }
        }
      `}</style>
```

This component renders the citizen’s digital license card and computes a verification URL from the license serial or license number.

Suggested figure caption: **Figure 23: Digital driving license card frontend component.**

File path: `artifacts/rukhsty/src/pages/citizen/digital-license-card.tsx`

Function/component name: `QrVerification`

```tsx
function QrVerification({ verify }: { verify: string }) {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[220px] flex-col items-center rounded-xl bg-white p-3 shadow-sm print:shadow-none">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(verify)}`}
        alt="Rukhsty license verification QR code"
        className="h-40 w-40"
      />
      <p className="rukhsty-license-ar mt-2 text-center text-xs font-bold text-[#0e5c3a]" dir="rtl">تحقق عبر منصة رخصتي / Verify via RukhsTy</p>
    </div>
  );
}
```

The QR image is generated by embedding the verification URL into an external QR image API. A backend QR verification route was not found in the current codebase.

Suggested figure caption: **Figure 21: Frontend QR code rendering for digital license verification.**

### 12. Mock eFAWATEERcom Payment

File path: `artifacts/api-server/src/routes/licenses.ts`

Function/component name: `generateEfawateercomReference`

```ts
export async function generateEfawateercomReference() {
  for (let i = 0; i < 8; i += 1) {
    const reference = `RKH-${todayCompact()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [existingLicense] = await db.select().from(drivingLicensesTable).where(eq(drivingLicensesTable.paymentReference, reference)).limit(1);
    const [existingApplication] = await db.select().from(applicationsTable).where(eq(applicationsTable.paymentReference, reference)).limit(1);
    if (!existingLicense && !existingApplication) return reference;
  }
  return `RKH-${todayCompact()}-${String(Date.now()).slice(-6)}`;
}
```

This helper generates a mock eFAWATEERcom-style payment reference and checks both licenses and applications to avoid collisions.

Suggested figure caption: **Figure 21: Mock eFAWATEERcom payment reference generation.**

File path: `artifacts/api-server/src/routes/licenses.ts`

Function/component name: `PATCH /licenses/:id/mock-pay`

```ts
router.patch("/licenses/:id/mock-pay", requireAuth, async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const found = await findApplicationOrLicense(routeParam(req, "id"), user);
  if (!found) { res.status(404).json({ success: false, message: "License or application not found." }); return; }
  if ("forbidden" in found) { res.status(403).json({ success: false, message: "Forbidden" }); return; }

  const application = found.application;
  const existingLicense = found.license;
  const status = application?.status ?? (existingLicense ? "LICENSE_ISSUED" : null);
  if (!paymentAllowed(status)) {
    res.status(409).json({ success: false, message: "Application must be approved before payment." });
    return;
  }
```

This route finds either a license or application by ID, checks ownership, and ensures the application is eligible before allowing mock payment.

Suggested figure caption: **Figure 21: Mock payment endpoint with ownership and eligibility checks.**

File path: `artifacts/api-server/src/routes/licenses.ts`

Function/component name: `PATCH /licenses/:id/mock-pay`

```ts
  if (application) {
    [updatedApplication] = await db.update(applicationsTable).set({
      paymentMethod: "efawateercom",
      paymentStatus: "paid",
      paymentAmount: LICENSE_PAYMENT_AMOUNT,
      paymentReference,
      paymentPaidAt: paidAt,
      status: "LICENSE_ISSUED",
      currentStep: "LICENSE_ISSUANCE",
      completedAt: new Date(),
      updatedAt: new Date(),
      deliveryStatus: shouldConfirmDelivery ? "payment_confirmed" : application.deliveryStatus,
      aramexTrackingNumber,
    }).where(eq(applicationsTable.id, application.id)).returning();
  }

  // TODO: Replace mock-pay endpoint with real eFAWATEERcom callback/API integration in production.
  // TODO: Replace mock Aramex tracking number with real Aramex shipment API integration in production.
  const license = existingLicense ?? (application ? await issueLicenseForApplication(application.id, null) : null);
  if (!license) { res.status(404).json({ success: false, message: "License not found." }); return; }

  const [updatedLicense] = await db.update(drivingLicensesTable).set({
    paymentMethod: "efawateercom",
    paymentStatus: "paid",
    paymentAmount: LICENSE_PAYMENT_AMOUNT,
    paymentReference,
    paymentPaidAt: paidAt,
```

This code marks the application and license as paid, stores the payment reference and date, and issues the license if it does not already exist.

Suggested figure caption: **Figure 21: Mock payment status update and license issuance.**

### 13. Mock Aramex Delivery

File path: `artifacts/api-server/src/routes/licenses.ts`

Function/component name: `POST /licenses/:id/delivery/aramex`

```ts
router.post("/licenses/:id/delivery/aramex", requireAuth, async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const found = await findApplicationOrLicense(routeParam(req, "id"), user);
  if (!found) { res.status(404).json({ message: "License or application not found." }); return; }
  if ("forbidden" in found) { res.status(403).json({ message: "Forbidden" }); return; }

  const deliveryAddress = String(req.body?.deliveryAddress ?? "").trim();
  const deliveryCity = String(req.body?.deliveryCity ?? "").trim();
  const deliveryPhone = String(req.body?.deliveryPhone ?? "").trim();
  const deliveryLocationLink = String(req.body?.deliveryLocationLink ?? "").trim();
  const deliveryDate = String(req.body?.deliveryDate ?? "").trim();
  const deliveryTimeSlot = String(req.body?.deliveryTimeSlot ?? "").trim();
  if (deliveryAddress.length < 10) { res.status(400).json({ message: "Delivery address must be at least 10 characters." }); return; }
  if (!deliveryCity) { res.status(400).json({ message: "Delivery city is required." }); return; }
  if (!JORDAN_PHONE_REGEX.test(deliveryPhone)) { res.status(400).json({ message: "Enter a valid Jordanian phone number." }); return; }
  if (!deliveryLocationLink || !/^https?:\/\/.+/i.test(deliveryLocationLink)) { res.status(400).json({ message: "A valid location link is required." }); return; }
  if (!deliveryDate) { res.status(400).json({ message: "Delivery date is required." }); return; }
  if (!deliveryTimeSlot) { res.status(400).json({ message: "Delivery time slot is required." }); return; }
```

This endpoint validates delivery details including address, city, Jordanian phone number, location link, date, and time slot.

Suggested figure caption: **Figure 22: Aramex delivery request validation route.**

File path: `artifacts/api-server/src/routes/licenses.ts`

Function/component name: `POST /licenses/:id/delivery/aramex`

```ts
  const isPaid = (license?.paymentStatus ?? application?.paymentStatus) === "paid";
  const aramexTrackingNumber = isPaid ? license?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? generateAramexTrackingNumber() : license?.aramexTrackingNumber ?? application?.aramexTrackingNumber ?? null;
  const deliveryStatus = isPaid ? "payment_confirmed" : "pending_payment";

  let updatedApplication = application;
  if (application) {
    [updatedApplication] = await db.update(applicationsTable).set({
      deliveryMethod: "aramex",
      deliveryAddress,
      deliveryCity,
      deliveryPhone,
      deliveryLocationLink,
      deliveryDate,
      deliveryTimeSlot,
      deliveryStatus,
      aramexTrackingNumber,
      updatedAt: new Date(),
    }).where(eq(applicationsTable.id, application.id)).returning();
  }
```

This code saves the Aramex delivery request and generates a mock tracking number when the license/application is already paid.

Suggested figure caption: **Figure 22: Saving Aramex delivery details and tracking number.**

File path: `artifacts/rukhsty/src/pages/citizen/aramex-delivery.tsx`

Function/component name: `AramexDelivery.submit`

```tsx
const submit = async () => {
  setError("");
  if (deliveryAddress.trim().length < 10) { setError(language === "ar" ? "أدخل عنواناً واضحاً من 10 أحرف على الأقل." : "Enter a clear address with at least 10 characters."); return; }
  if (!deliveryCity.trim()) { setError(language === "ar" ? "المدينة مطلوبة." : "City is required."); return; }
  if (!validPhone(deliveryPhone)) { setError(language === "ar" ? "أدخل رقم هاتف أردني صحيح." : "Enter a valid Jordanian phone number."); return; }
  if (!/^https?:\/\/.+/i.test(deliveryLocationLink.trim())) { setError(language === "ar" ? "أدخل رابط موقع صحيح يبدأ بـ http أو https." : "Enter a valid location link starting with http or https."); return; }
  if (!deliveryDate) { setError(language === "ar" ? "اختر تاريخ التوصيل." : "Select a delivery date."); return; }
  if (!deliveryTimeSlot) { setError(language === "ar" ? "اختر وقت التوصيل." : "Select a delivery time slot."); return; }

  setIsSaving(true);
  try {
    const response = await fetch(`/api/licenses/${licenseId}/delivery/aramex`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${localStorage.getItem("rukhsty_token") ?? ""}`,
      },
      body: JSON.stringify({ deliveryAddress, deliveryCity, deliveryPhone, deliveryLocationLink, deliveryDate, deliveryTimeSlot }),
    });
```

This frontend function validates the Aramex form and sends the delivery request to the backend API with the citizen’s bearer token.

Suggested figure caption: **Figure 23: Frontend Aramex delivery form submission.**

### 14. Frontend Route Protection and Component Structure

File path: `artifacts/rukhsty/src/Router.tsx`

Function/component name: `PublicRoute`, `ProtectedRoute`

```tsx
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (isAuthenticated && user) {
    if ((user as any).role === "SECURITY_OFFICER") return <Redirect to="/security/review" />;
    if ((user as any).role === "ADMIN") return <Redirect to="/admin/dashboard" />;
    if ((user as any).role?.includes("OFFICER")) return <Redirect to="/officer/dashboard" />;
    return <Redirect to="/dashboard" />;
  }
  return <Component />;
}

function ProtectedRoute({ component: Component, allowedRoles = [], params }: { component: React.ComponentType<any>; allowedRoles?: string[]; params?: Record<string, string | undefined> }) {
  return (
    <AppShell requireAuth allowedRoles={allowedRoles}>
      <Component params={params} />
    </AppShell>
  );
}
```

These frontend wrappers redirect already-authenticated users and protect private pages through `AppShell` and role lists.

Suggested figure caption: **Figure 23: Frontend protected route structure and role-aware navigation.**

File path: `artifacts/rukhsty/src/Router.tsx`

Function/component name: `AppRouter`

```tsx
        <Route path="/services/issue-driving-license" component={() => <ProtectedRoute component={ServiceIssueLicense} allowedRoles={["USER"]} />} />
        <Route path="/applications" component={() => <ProtectedRoute component={Applications} allowedRoles={["USER"]} />} />
        <Route path="/applications/:id">
          {(params) => <ProtectedRoute component={ApplicationDetail} allowedRoles={["USER"]} params={params} />}
        </Route>
        <Route path="/my-license" component={() => <ProtectedRoute component={LicenseCard} allowedRoles={["USER"]} />} />
        <Route path="/delivery/aramex/:id">
          {(params) => <ProtectedRoute component={AramexDelivery} allowedRoles={["USER"]} params={params} />}
        </Route>

        <Route path="/officer/dashboard" component={() => <ProtectedRoute component={OfficerDashboard} allowedRoles={["TRAINING_CENTER_OFFICER","MEDICAL_CENTER_OFFICER","MEDICAL_OFFICER","THEORY_OFFICER","THEORY_EXAM_OFFICER","PRACTICAL_OFFICER","PRACTICAL_EXAM_OFFICER","DVLD_OFFICER","ADMIN"]} />} />
        <Route path="/officer/results" component={() => <ProtectedRoute component={OfficerResults} allowedRoles={["MEDICAL_CENTER_OFFICER","MEDICAL_OFFICER","THEORY_OFFICER","THEORY_EXAM_OFFICER","PRACTICAL_OFFICER","PRACTICAL_EXAM_OFFICER","ADMIN"]} />} />
        <Route path="/security/review" component={() => <ProtectedRoute component={SecurityReview} allowedRoles={["SECURITY_OFFICER","ADMIN"]} />} />
```

This routing fragment shows the main citizen, officer, and security pages used in the RukhsTy workflow.

Suggested figure caption: **Figure 23: Frontend route map for citizen, officer, and security workflows.**

### 15. API Routes Summary

| Feature | HTTP Method | Endpoint | File path | Function name | Purpose |
| --- | --- | --- | --- | --- | --- |
| Register citizen | POST | `/api/auth/register` | `artifacts/api-server/src/routes/auth.ts` | anonymous route handler | Creates user and profile after validation and password hashing. |
| Login | POST | `/api/auth/login` | `artifacts/api-server/src/routes/auth.ts` | anonymous route handler | Authenticates by email or national ID and returns JWT. |
| Logout | POST | `/api/auth/logout` | `artifacts/api-server/src/routes/auth.ts` | anonymous route handler | Returns logout message; frontend clears local token. |
| Current user | GET | `/api/auth/me` | `artifacts/api-server/src/routes/auth.ts` | anonymous route handler | Returns authenticated user and profile. |
| List applications | GET | `/api/applications` | `artifacts/api-server/src/routes/applications.ts` | anonymous route handler | Lists citizen applications. |
| Submit application | POST | `/api/applications` | `artifacts/api-server/src/routes/applications.ts` | anonymous route handler | Creates first-time license application and certificate document. |
| Application detail | GET | `/api/applications/:id` | `artifacts/api-server/src/routes/applications.ts` | anonymous route handler | Returns application details, steps, documents, appointments, exams, and license. |
| Admin/security application list | GET | `/api/admin/applications` | `artifacts/api-server/src/routes/admin.ts` | anonymous route handler | Lists applications, including security-review queue. |
| Security approve | POST | `/api/security/applications/:id/approve` | `artifacts/api-server/src/routes/admin.ts` | `securityApprove` | Approves security review and moves application to medical booking. |
| Security reject | POST | `/api/security/applications/:id/reject` | `artifacts/api-server/src/routes/admin.ts` | `securityReject` | Rejects application and stores rejection reason. |
| Request more info | POST | `/api/security/applications/:id/request-more-info` | `artifacts/api-server/src/routes/admin.ts` | `requestMoreInfo` | Sends additional information request. |
| Officer dashboard | GET | `/api/officer/dashboard` | `artifacts/api-server/src/routes/officer.ts` | anonymous route handler | Returns center appointments and officer summary. |
| Officer application search | GET | `/api/officer/applications/search` | `artifacts/api-server/src/routes/officer.ts` | anonymous route handler | Searches applications by national ID for officer stages. |
| Record medical result | POST | `/api/officer/medical/record` | `artifacts/api-server/src/routes/officer.ts` | `recordMedical` | Records medical/vision test result and updates status. |
| Record exam result | POST | `/api/officer/exams/record` | `artifacts/api-server/src/routes/officer.ts` | `recordExam` | Records theory or practical result and updates status. |
| Record practical checklist | POST | `/api/officer/practical/record` | `artifacts/api-server/src/routes/officer.ts` | anonymous route handler | Calculates practical score from checklist and calls `recordExam`. |
| My license | GET | `/api/licenses/my` | `artifacts/api-server/src/routes/licenses.ts` | anonymous route handler | Returns authenticated citizen’s active license. |
| Application license | GET | `/api/applications/:id/license` | `artifacts/api-server/src/routes/licenses.ts` | anonymous route handler | Returns or auto-issues a license for an eligible application. |
| Mock payment | PATCH | `/api/licenses/:id/mock-pay` | `artifacts/api-server/src/routes/licenses.ts` | anonymous route handler | Marks payment paid and issues license when needed. |
| Aramex delivery | POST | `/api/licenses/:id/delivery/aramex` | `artifacts/api-server/src/routes/licenses.ts` | anonymous route handler | Saves delivery data and mock Aramex tracking number. |

### 16. Suggested Screenshots for Documentation

Figure 16: Database Schema / Model Layer Code Structure

- `lib/db/src/schema/users.ts`: `userRoleEnum`, `usersTable`
- `lib/db/src/schema/user_profiles.ts`: `userProfilesTable`
- `lib/db/src/schema/applications.ts`: `applicationsTable`
- `lib/db/src/schema/driving_licenses.ts`: `drivingLicensesTable`

Figure 17: Backend Routes / Controller Layer Code Structure

- `artifacts/api-server/src/routes/index.ts`: router mounting if you want the full route registration structure
- `artifacts/api-server/src/routes/applications.ts`: `router.post("/applications", ...)`
- `artifacts/api-server/src/routes/admin.ts`: `router.get("/admin/applications", ...)`
- `artifacts/api-server/src/routes/officer.ts`: officer route handlers

Figure 18: Authentication and Security Code

- `artifacts/api-server/src/routes/auth.ts`: `POST /auth/register`, `POST /auth/login`
- `artifacts/api-server/src/middlewares/auth.ts`: `generateToken`, `requireAuth`, `requireRole`
- `artifacts/rukhsty/src/pages/public/login.tsx`: `onSubmit`
- `artifacts/rukhsty/src/Router.tsx`: `PublicRoute`, `ProtectedRoute`

Figure 19: Application Submission Code

- `artifacts/api-server/src/routes/applications.ts`: `POST /applications`
- `artifacts/rukhsty/src/pages/citizen/service-issue-license.tsx`: `submit`
- `lib/db/src/schema/documents.ts`: `documentsTable`

Figure 20: Officer Approval Workflow Code

- `artifacts/api-server/src/routes/admin.ts`: `securityApprove`, `securityReject`
- `artifacts/api-server/src/routes/officer.ts`: `recordMedical`, `recordExam`, practical checklist route
- `artifacts/rukhsty/src/pages/security/security-review.tsx`: `submitAction`
- `artifacts/rukhsty/src/pages/officer/officer-results.tsx`: `submitMedical`, `submitTheory`, `submitPractical`

Figure 21: Payment and License Issuing Code

- `artifacts/api-server/src/services/license-issuance.ts`: `issueLicenseForApplication`
- `artifacts/api-server/src/routes/licenses.ts`: `PATCH /licenses/:id/mock-pay`
- `artifacts/rukhsty/src/pages/citizen/digital-license-card.tsx`: `DigitalLicenseCard`, `QrVerification`

Figure 22: Aramex Delivery Code

- `artifacts/api-server/src/routes/licenses.ts`: `POST /licenses/:id/delivery/aramex`
- `artifacts/rukhsty/src/pages/citizen/aramex-delivery.tsx`: `AramexDelivery.submit`
- `lib/db/src/schema/applications.ts`: delivery fields
- `lib/db/src/schema/driving_licenses.ts`: delivery fields

Figure 23: Frontend Components Code Structure

- `artifacts/rukhsty/src/Router.tsx`: route map
- `artifacts/rukhsty/src/pages/public/login.tsx`: `Login`
- `artifacts/rukhsty/src/pages/public/register.tsx`: `Register`
- `artifacts/rukhsty/src/pages/citizen/service-issue-license.tsx`: `ServiceIssueLicense`
- `artifacts/rukhsty/src/pages/citizen/application-detail.tsx`: `ApplicationDetail`
- `artifacts/rukhsty/src/pages/security/security-review.tsx`: `SecurityReview`
- `artifacts/rukhsty/src/pages/officer/officer-results.tsx`: `OfficerResults`
- `artifacts/rukhsty/src/pages/citizen/digital-license-card.tsx`: `DigitalLicenseCard`
- `artifacts/rukhsty/src/pages/citizen/aramex-delivery.tsx`: `AramexDelivery`

### 17. Missing or Closest Related Features

| Requested feature | Status in current codebase | Closest related file/function |
| --- | --- | --- |
| Backend QR verification route | Not found in current codebase | Frontend QR image generation in `artifacts/rukhsty/src/pages/citizen/digital-license-card.tsx`, function `QrVerification` |
| Real eFAWATEERcom integration | Not found in current codebase | Mock endpoint `PATCH /api/licenses/:id/mock-pay` in `artifacts/api-server/src/routes/licenses.ts` |
| Real Aramex API integration | Not found in current codebase | Mock endpoint `POST /api/licenses/:id/delivery/aramex` in `artifacts/api-server/src/routes/licenses.ts` |
| Server-side session destroy | Not found in current codebase | Frontend token removal in `artifacts/rukhsty/src/lib/auth.tsx`, function `handleLogout`; backend `/auth/logout` returns a message |
