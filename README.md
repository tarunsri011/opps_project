# Food Expiry & Surplus Redistribution System

A full-stack prototype that reduces food waste by tracking food inventory, flagging items
nearing expiry, and matching surplus food with recipients.

- **Frontend:** React 18 + Vite + TailwindCSS v3 (port 5173)
- **Backend:** Java 17 + Spring Boot 3.5 + Maven (port 8080)
- **Database:** MySQL 8 (`food_redistribution`)
- **Auth:** Spring Security + JWT (jjwt), roles `ADMIN` / `DONOR` / `RECIPIENT`

## Roles

| Role | Can do |
|---|---|
| ADMIN | Manage all food items, match surplus food to recipients, confirm matches, schedule/complete pickups, manage recipients, log waste, view statistics |
| DONOR | Add/manage their own food items, mark items as surplus, see where their food went |
| RECIPIENT | Browse available surplus, accept/decline matches assigned to them, schedule pickups, view their donation history |

Matching is **admin-only** (per the API contract): recipients browse and accept, the coordinator matches.

## Project structure

```
backend/    Spring Boot API (flat architecture: controllers -> repositories)
frontend/   React SPA
```

Key backend folders: `controller/` (REST), `model/` (entities), `repository/` (Spring Data JPA),
`dto/` (request/response records), `security/` (JWT filter, util, Spring Security config),
`config/SeedData.java` (demo data).

Key frontend folders: `pages/` (9 screens), `components/` (layout, guards, badges),
`services/api.js` (Axios with JWT injection).

## Prerequisites

- Java 17+ (tested on 26)
- Maven 3.9+ (or use your IDE's bundled Maven)
- Node.js 18+ and npm
- MySQL 8 running locally

## 1. Database

The app connects as `root` / `root` (see `backend/src/main/resources/application.properties`).
The database is created automatically on first start (`createDatabaseIfNotExist=true`), or create it manually:

```sql
CREATE DATABASE IF NOT EXISTS food_redistribution
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Demo data (users, food items, one confirmed match, a pickup and a waste log) is seeded on the
first run only, when the `users` table is empty.

## 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

Starts on <http://localhost:8080>. Schema is created/updated by Hibernate (`ddl-auto=update`).

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on <http://localhost:5173>. CORS on the backend allows this origin.
For a different API host, set `VITE_API_URL` (e.g. in `frontend/.env`).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@food.org` | `admin123` |
| DONOR | `donor@food.org` | `donor123` |
| RECIPIENT | `recipient@food.org` | `recip123` |
| RECIPIENT | `community@food.org` | `recip123` |

## API

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>` and return **403** without it.

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/api/auth/register` | public (DONOR / RECIPIENT only) |
| POST | `/api/auth/login` | public |
| GET | `/api/food-items` | all |
| POST | `/api/food-items` | DONOR, ADMIN |
| PUT | `/api/food-items/{id}` | DONOR (own), ADMIN |
| DELETE | `/api/food-items/{id}` | ADMIN |
| GET | `/api/food-items/expiring-soon` | ADMIN |
| GET | `/api/food-items/surplus` | all |
| GET, POST | `/api/recipients` | ADMIN |
| GET | `/api/donations` | all (filtered by role) |
| POST | `/api/donations/match` | ADMIN |
| PUT | `/api/donations/{id}/status` | ADMIN, RECIPIENT (own) |
| GET, POST | `/api/pickups` | RECIPIENT, ADMIN |
| PUT | `/api/pickups/{id}/complete` | ADMIN |
| GET | `/api/statistics` | ADMIN |
| POST | `/api/waste-log` | ADMIN |

Behaviour notes: confirming or completing a match marks the food item `DONATED`; cancelling it
restores `SURPLUS`; logging waste marks the item `EXPIRED`; completing a pickup completes its match.

## Verification

Automated tests (in-memory H2, MySQL not required):

```bash
cd backend && mvn test
```

Full API check against a running backend (43 assertions: auth, every endpoint, role and
ownership denials, CORS preflight):

```bash
cd backend && bash verify-api.sh
```

Frontend production build:

```bash
cd frontend && npm run build
```

## Manual demo flow

1. Register a **DONOR** → add a food item → mark it **surplus**.
2. Log in as **ADMIN** → Donations → match the surplus item to a recipient.
3. Log in as **RECIPIENT** → Donations → **Accept** the match → Pickups → schedule a pickup.
4. Back as **ADMIN** → Pickups → **Mark complete** → Statistics shows the completed donation.
