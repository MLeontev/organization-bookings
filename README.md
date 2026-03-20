# organization-bookings frontend

Frontend for `OrgMembershipService` with Keycloak auth.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- react-router-dom
- keycloak-js

## Features

- Login/logout via Keycloak
- Dashboard: current user + organizations list
- Organization page:
  - read current access (roles + permissions)
  - list/create/delete custom roles
  - list/update/deactivate/activate/remove members
  - assign/revoke member roles
  - list/create/revoke invitations
- Invitation page by token (`/invite/:token`) + accept flow

## Environment

Copy `.env.example` to `.env` and adjust values:

- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`
- `VITE_API_BASE_URL` (default `/api`)

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

## Docker

```bash
docker compose up --build
```
