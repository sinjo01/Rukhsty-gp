# RukhsTy Runbook

## Prerequisites

- Node.js 24
- pnpm
- PostgreSQL 16 or compatible

## Environment

Copy `.env.example` to `.env` and set a real `DATABASE_URL` and `SESSION_SECRET`.

The frontend defaults to the real API. `VITE_USE_MOCK=true` is only for offline UI demos and should not be used for backend verification.

## Install

```powershell
pnpm install --ignore-scripts
```

The root `preinstall` hook uses `sh`, which is not available in plain Windows PowerShell. Use Git Bash/WSL, or the script-free install above on Windows.

## Database

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/rukhsty"
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

## Run API

```powershell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/rukhsty"
$env:SESSION_SECRET="replace-with-a-long-random-secret"
$env:PORT="8080"
pnpm --filter @workspace/api-server run dev
```

## Run Frontend

```powershell
$env:PORT="5173"
$env:BASE_PATH="/"
$env:API_PROXY_TARGET="http://localhost:8080"
$env:VITE_USE_MOCK="false"
pnpm --filter @workspace/rukhsty run dev
```

Open `http://localhost:5173/`.

## Offline UI Demo

```powershell
$env:PORT="5173"
$env:BASE_PATH="/"
$env:VITE_USE_MOCK="true"
pnpm --filter @workspace/rukhsty run dev
```

## Demo Credentials

- Admin: `admin@rukhsty.jo` / `Admin123!`
- Citizen: `user@rukhsty.jo` / `User123!`
- Training officer: `training.officer@rukhsty.jo` / `Officer123!`
- Medical officer: `medical.officer@rukhsty.jo` / `Officer123!`
- Theory officer: `theory.officer@rukhsty.jo` / `Officer123!`
- Practical officer: `practical.officer@rukhsty.jo` / `Officer123!`
*** Add File: c:\Users\USER\Documents\Rukhsty-gp\AUDIT.md
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
