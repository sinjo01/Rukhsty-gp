# RukhsTy Interaction Audit

Status key: `verified`, `wired`, `blocked`, `missing`.

## Public

| Page | Element | Expected action | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Home | Start Your Application | Navigate to registration | n/a | wired |
| Home | Track Existing Application | Navigate to login | n/a | wired |
| Login | Demo account buttons | Fill credentials | n/a | wired |
| Login | Sign in | Authenticate and redirect by role | `POST /api/auth/login`, `GET /api/auth/me` | wired; real verification blocked until Postgres is configured |
| Register | Multi-step form | Create citizen account and redirect | `POST /api/auth/register` | wired; real verification blocked until Postgres is configured |

## Citizen

| Page | Element | Expected action | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Dashboard | Summary cards | Load user summary | `GET /api/dashboard/summary` | wired |
| Dashboard | Unread notification link | Navigate to notifications | `GET /api/notifications` | wired |
| Dashboard | Active application view | Open application detail | `GET /api/applications/{id}` | wired |
| Dashboard | Available services | Navigate to service flows | varies | wired |
| Appointments | Cancel appointment | Cancel owned appointment | `POST /api/appointments/{id}/cancel` | wired; server route fixed |
| License Card | Load current license | Show issued license | `GET /api/licenses/my` | wired; lifecycle issuance still missing |

## Officer

| Page | Element | Expected action | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Dashboard | Center stats | Load officer center queue | `GET /api/officer/dashboard` | wired |
| Appointments | Update status | Update appointment status | `PUT /api/officer/appointments/{id}/update` | wired; server route fixed |
| Results | Record training | Update training result | `PUT /api/officer/training/{applicationId}/update` | wired; server route fixed |
| Results | Record medical | Save medical result | `POST /api/officer/medical/record` | wired; server route fixed |
| Results | Record exam | Save theory/practical exam result | `POST /api/officer/exams/record` | wired; server route fixed |

## Admin

| Page | Element | Expected action | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Dashboard | Stats | Load aggregate platform stats | `GET /api/admin/stats` | wired; two metrics still hardcoded in backend |
| Dashboard | Recent activity | Load recent activity | `GET /api/admin/recent-activity` | wired; server route fixed |
| Applications | Review approve/reject | Update application review | `PUT /api/admin/applications/{id}/review` | wired |
| Centers | Create center | Persist new center | `POST /api/admin/centers` | wired |
| Users | User list | Browse users | `GET /api/admin/users` | wired |

## Open Items From Mission Brief

- Real Postgres is not available in this Windows environment yet, so API + seed + browser verification against persistence is blocked.
- License issuance endpoint and UI are still missing.
- Payment routes and UI are still missing.
- Real multipart document upload is still missing.
- Email verification and password reset are still missing.
- Admin officer creation and center assignment UI/API are still missing.
- Ownership/role audit and audit log writes are incomplete.
