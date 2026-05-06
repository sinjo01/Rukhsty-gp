# Rukhsty | رخصتي — System Requirements
**Digital Driving License Management Platform — Jordan**

---

## Functional Requirements (FR)

| ID | Requirement | Description | Actor | Priority |
|----|-------------|-------------|-------|----------|
| FR-01 | User Registration | Citizens register a new account with email and password. The system verifies the email is unique before creating the account. | Citizen | High |
| FR-02 | User Login / Logout | All users log in with email and password. The system issues a JWT token valid for 7 days. Users can log out at any time, clearing the session. | All Roles | High |
| FR-03 | Role-Based Access Control | The system enforces role separation: USER, TRAINING_CENTER_OFFICER, MEDICAL_CENTER_OFFICER, THEORY_EXAM_OFFICER, PRACTICAL_EXAM_OFFICER, ADMIN. Each role can only access its designated pages and API endpoints. | All Roles | High |
| FR-04 | Complete Citizen Profile | Citizens must fill personal details (full name, national ID, phone, address, governorate) and upload a personal photo and ID images before submitting an application. | Citizen | High |
| FR-05 | View Profile Summary | Citizens can view their stored profile information and profile completion percentage from their dashboard. | Citizen | Medium |
| FR-06 | Apply for Driving License | Citizens initiate a new license application by selecting a service. The application moves through a defined pipeline: DRAFT → PROFILE_SUBMITTED → TRAINING_CENTER_SELECTED → TRAINING_COMPLETED → LICENSE_ISSUED / REJECTED. | Citizen | High |
| FR-07 | Select Training Center | Citizens browse available training centers and select one for their application. The system records the selection and transitions the application status. | Citizen | High |
| FR-08 | Upload Documents | Citizens upload required documents (personal photo, national ID front and back) during profile completion. The system validates that all required fields are present. | Citizen | High |
| FR-09 | Track Application Status | Citizens view all their applications, current status, and step-by-step pipeline progress. Each application detail page shows full history and associated appointments. | Citizen | High |
| FR-10 | Book Appointment | Citizens book appointments for each licensing stage (training, medical, theory exam, practical exam). The system records date, center, and appointment type. | Citizen | High |
| FR-11 | View Upcoming Appointments | Citizens view a list of all upcoming booked appointments with date, time, center name, and appointment type from their appointments page and dashboard summary. | Citizen | Medium |
| FR-12 | Receive Notifications | The system automatically creates in-app notifications for key events: application status changes, appointment confirmations, and exam results. | Citizen | Medium |
| FR-13 | Mark Notifications as Read | Citizens can mark individual or all notifications as read. The dashboard shows unread notification count as a badge. | Citizen | Low |
| FR-14 | View Digital License Card | Once a license is issued, citizens view a digital license card showing license number, category, issue date, expiry date, and personal details. | Citizen | High |
| FR-15 | Officer Dashboard | Officers see a dashboard summarising their assigned appointments count, today's schedule, and recent activity relevant to their role. | Officer | Medium |
| FR-16 | View Assigned Appointments | Officers view all appointments assigned to their center, filtered by status (BOOKED, COMPLETED, CANCELLED), with citizen name, appointment type, and date/time. | Officer | High |
| FR-17 | Record Training Completion | Training center officers mark training appointments as completed, triggering an application status update and a citizen notification. | Officer | High |
| FR-18 | Record Exam / Medical Results | Medical, theory exam, and practical exam officers record pass/fail results for each stage. A pass progresses the application; a fail can trigger rejection or re-scheduling. | Officer | High |
| FR-19 | Admin Dashboard & Statistics | Admins see a statistics page: total applications, pending reviews, issued licenses, active users, and recent system activity. | Admin | Medium |
| FR-20 | Manage All Applications | Admins view all citizen applications across the system, filter by status, and drill into individual application details. | Admin | High |
| FR-21 | Approve / Reject Applications | Admins approve (advancing toward license issuance) or reject applications with a written reason. The citizen receives a notification for either outcome. | Admin | High |
| FR-22 | Issue Driving License | Admins issue a digital driving license for an approved application. The system creates a license record with a unique number, category, issue date, and 5-year expiry. | Admin | High |
| FR-23 | Manage Users | Admins view all registered users, their roles, registration date, and account status (active/inactive). | Admin | Medium |
| FR-24 | Manage Training Centers | Admins view all registered training and examination centers including location, capacity, type, and assigned officers. | Admin | Medium |
| FR-25 | Bilingual Interface (AR / EN) | The platform displays UI text in both Arabic and English. Arabic content is RTL-aware. | All Roles | Medium |

---

## Non-Functional Requirements (NFR)

| ID | Category | Requirement | Description | Priority |
|----|----------|-------------|-------------|----------|
| NFR-01 | Performance | API Response Time | All API endpoints respond within 500 ms under normal load. Database queries use indexed columns to avoid full-table scans on frequently accessed tables. | High |
| NFR-02 | Performance | Page Load Time | The frontend SPA achieves an initial load time under 3 seconds on standard broadband. Code-splitting and lazy-loading are applied per route to minimise bundle size. | Medium |
| NFR-03 | Security | Authentication & JWT | All protected endpoints require a valid JWT Bearer token. Tokens expire after 7 days. Invalid or expired tokens return HTTP 401. Passwords are hashed with bcrypt (cost factor 10) and never stored in plain text. | High |
| NFR-04 | Security | Authorization & Role Guards | Every API route enforces role-based middleware. Accessing a route outside a user's role returns HTTP 403. The frontend additionally restricts navigation using per-route role checks. | High |
| NFR-05 | Security | Input Validation | All API request bodies are validated server-side using Zod schemas. Invalid payloads return HTTP 400. SQL injection is prevented by parameterised queries via Drizzle ORM. | High |
| NFR-06 | Security | HTTPS & Secure Transport | All client-server communication is encrypted over HTTPS/TLS in production. Sensitive credentials are stored as environment secrets, never hard-coded. | High |
| NFR-07 | Usability | Responsive Design | The platform is fully usable on desktop (1280 px+), tablet (768 px), and mobile (375 px) screen sizes using Tailwind CSS responsive utility classes. | High |
| NFR-08 | Usability | Dark / Light Mode | The interface supports both light and dark colour modes, toggled by the user and persisted via the ThemeProvider. | Medium |
| NFR-09 | Usability | Animated Transitions | Key page transitions and component state changes use Framer Motion animations (fade-in, slide-up) for smooth, professional UX without blocking user interaction. | Low |
| NFR-10 | Usability | Error Feedback | Clear, actionable error messages are displayed via toast notifications for every failed operation. Generic "something went wrong" messages are avoided. | Medium |
| NFR-11 | Availability | System Uptime | The deployed platform targets 99.5% monthly uptime. The API server restarts automatically on crash. PostgreSQL data is persisted on a reliable managed database service. | High |
| NFR-12 | Availability | Graceful Error Handling | Unhandled API errors return structured JSON responses. The frontend displays user-friendly fallback states (empty states, retry buttons) when data fails to load. | High |
| NFR-13 | Maintainability | Contract-First API | The API contract is defined in an OpenAPI 3.0 specification. Client hooks and Zod schemas are auto-generated via Orval. Any API change requires updating the spec first. | High |
| NFR-14 | Maintainability | TypeScript Strict Mode | The entire codebase is written in TypeScript with strict mode enabled. Zero TypeScript errors are permitted. This reduces runtime bugs and improves refactoring safety. | High |
| NFR-15 | Maintainability | Monorepo Structure | The project uses a pnpm workspace monorepo separating: api-server, web app, db schema lib, api-spec lib, and api-client-react lib. Shared code lives in libs to avoid duplication. | Medium |
| NFR-16 | Maintainability | Structured Logging | The API server uses Pino for structured JSON logging. All requests log method, URL, status code, and response time. console.log is prohibited in server code. | Medium |
| NFR-17 | Scalability | Stateless API Design | The API server is stateless — all session state is encoded in the JWT token. This allows horizontal scaling by running multiple instances behind a load balancer without sticky sessions. | Medium |
| NFR-18 | Scalability | Database Indexing | Foreign key columns and frequently queried fields (userId, applicationId, status, email) are indexed in PostgreSQL to maintain fast query times as data volume grows. | Medium |
| NFR-19 | Compliance | Data Privacy | Personal data (national ID, phone, photos) is accessible only to the authenticated citizen who owns it and authorised admin users. Officers only see citizen data for their assigned appointments. | High |
| NFR-20 | Compliance | Audit Trail | All significant state changes (application status updates, license issuance, admin decisions) are recorded in the audit_logs table with actor user ID, action type, affected entity, and timestamp. | Medium |
