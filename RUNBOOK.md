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

- Admin: `admin@rukhsty.jo` / `password123`
- Citizen: `user@rukhsty.jo` / `password123`
- Test citizen: `5555555555` or `test.user@rukhsty.jo` / `password123`
- Training officer: `training.officer@rukhsty.jo` / `password123`
- Medical officer: `medical.officer@rukhsty.jo` / `password123`
- Theory officer: `theory.officer@rukhsty.jo` / `password123`
- Practical officer: `practical.officer@rukhsty.jo` / `password123`

If demo logins drift after database changes, repair them with:

```bash
pnpm --filter @workspace/scripts run repair-demo-logins
```

This restores the demo emails, national IDs, roles, active flags, profiles, and `password123` password without deleting applications or licenses.
