# Trackr — Your next chapter

A MERN job application tracker with a responsive glassmorphism dashboard, application management and status timelines.

**Implemented and verified:** responsive React frontend, Express backend, real MongoDB Atlas persistence, clean installation and production build. The committed environment uses a dedicated disposable exam account, with evaluator network access explicitly approved.

## Run

Requires Node.js 22.12 or later and npm. A dedicated exam-only Atlas connection is included in `backend/.env` as required by the assessment. Run from the project root:

```sh
npm install
npm run dev
```

The root install also installs frontend and backend dependencies using their lockfiles.

- App: http://127.0.0.1:5178
- API: http://127.0.0.1:5010/api
- Database readiness: http://127.0.0.1:5010/health

## Local QA preview without Atlas

```sh
npm run dev:qa
```

This optional command starts a **real temporary MongoDB process**, inserts QA fixtures through the API and starts the frontend. Changes save to that temporary database. It is not Atlas; data is discarded on exit. Normal `dev` and `start` never insert sample records. Stop QA with Ctrl+C before starting `dev`; both use port 5010. The first QA/test run may download a MongoDB binary.

## Structure

```text
frontend/
  .env                  # API URL and development proxy
  src/App.jsx           # Dashboard, forms, details and follow-ups
  src/api.js            # Shared HTTP client and field definitions
  src/styles.css        # Responsive glassmorphism design
backend/
  .env                  # Dedicated exam-only test connection
  src/app.js            # REST routes and error responses
  src/models.js         # Mongoose schemas and indexes
  src/rules.js          # Workflow and input/date validation
  src/server.js         # Atlas connection and startup
  test/api.test.js       # Real MongoDB integration tests
  scripts/local-qa.mjs  # Explicit temporary local QA environment
docs/
  ATLAS_SETUP.md
  screenshots/
```

## Features

- Company, role, job type, applied date, optional salary and notes.
- Frontend/backend future-date validation and immutable application IDs/applied dates.
- Server-generated per-company sequences such as `JA-INF-001`.
- Backend-enforced status workflow and valid-next-status dropdowns.
- Persistent status history displayed as a date/time timeline.
- Follow-up dates seven calendar days after applying and backend-calculated overdue badges.
- Database-enforced case-insensitive active duplicate protection, including concurrent submissions and edits.
- Backend company search and status filtering through URL query parameters.
- Counts for six statuses, card/list layouts and sorting.
- Pre-filled editing, delete confirmation and disabled deletion during Interview/Offer.
- Loading, empty, success, validation and API failure states.
- Desktop/mobile layouts, keyboard focus indicators and reduced-motion support.

## REST APIs

Responses follow `{ success, message, data }`. Field validation errors also include `errors` keyed by field name. Routes use MongoDB `_id`.

| Method | Route                          | Input                                                    | Success                               |
| ------ | ------------------------------ | -------------------------------------------------------- | ------------------------------------- |
| GET    | `/health`                      | None                                                     | 200 connected; otherwise 503          |
| GET    | `/api/applications`            | Optional `company`, `status` query parameters            | 200; array                            |
| GET    | `/api/applications/stats`      | None                                                     | 200; counts keyed by six status names |
| GET    | `/api/applications/:id`        | None                                                     | 200; application                      |
| POST   | `/api/applications`            | Company, role, type, applied date; optional salary/notes | 201; application                      |
| PUT    | `/api/applications/:id`        | Editable fields and/or `status`                          | 200; updated application              |
| PATCH  | `/api/applications/:id/status` | `{ "status": "Interview" }`                              | 200; application/history              |
| DELETE | `/api/applications/:id`        | None                                                     | 200; `data: null`                     |

The `/applications` prefix is also supported for the original Lovable contract. Invalid input, transitions and blocked deletion return **400**; missing records **404**; active duplicates and concurrent editing conflicts **409**. Unexpected errors return **500** without exposing credentials.

Create example:

```json
{
  "companyName": "Infosys",
  "jobRole": "Frontend Developer",
  "jobType": "Full-time",
  "appliedDate": "2026-10-28",
  "expectedSalary": 600000,
  "notes": "Prepare a walkthrough of my React project."
}
```

Job types are exactly **Full-time, Internship, Contract**. Applied dates use `YYYY-MM-DD`; response dates use ISO strings. Salary is a non-negative number or null; no currency or salary period is assumed. History entries use `{ status, changedAt }`. Responses include `allowedNextStatuses`, `canDelete` and `isOverdue`.

## Business rules

```text
Applied   → Interview or Rejected
Interview → Offer or Rejected
Offer     → Accepted or Declined
Rejected, Accepted, Declined → final
```

- Atomic company counters never reuse deleted numbers; failed concurrent submissions can leave gaps.
- IDs use the company at creation and stay unchanged after edits. Different companies sharing their first three letters can share a display ID because counters are per company; MongoDB `_id` uniquely identifies records. Sequences are padded to at least three digits and continue past 999.
- A partial unique index protects active normalized company/role pairs. Matching ignores case and extra whitespace.
- Status/history save in one database operation. Version checks prevent silently overwriting concurrent edits.
- `APP_TIMEZONE=Asia/Kolkata` defines the calendar day. An Applied record becomes overdue on the day **after** its follow-up date.
- Applied and final records can be deleted; Interview and Offer cannot.
- This is a single-user assessment application without authentication or per-user data isolation.

## Environment variables

`backend/.env` contains a working connection for the dedicated disposable exam database, committed with explicit approval for evaluator access. It contains no personal or production credentials. To use your own test database, override it in ignored `backend/.env.local`:

```env
MONGODB_URI=mongodb+srv://EXAM_USER:EXAM_PASSWORD@YOUR_CLUSTER.mongodb.net/job_application_tracker?retryWrites=true&w=majority
```

Backend defaults: `PORT=5010`, `APP_TIMEZONE=Asia/Kolkata`, `CLIENT_ORIGIN=http://localhost:5178,http://127.0.0.1:5178`.

Frontend: `VITE_API_BASE_URL=/api`, `BACKEND_PROXY_TARGET=http://127.0.0.1:5010`. Vite proxies `/api` to Express. For a separately hosted frontend, use the reachable backend URL ending in `/api` and allow the frontend's exact origin in `CLIENT_ORIGIN`. Rebuild when Vite environment variables change.

System variables take priority over `.env.local`, then `.env`. The backend loads files relative to its source directory.

You may keep the URI without its password and set `MONGODB_PASSWORD` separately in `.env.local`. The backend URL-encodes that raw password automatically. The local setup file is excluded from Git.

The assessment requires a runnable committed `.env`. This repository uses **only a disposable exam-specific Atlas user/database**. Its account can read/write only `job_application_tracker`. Network access from any IP was explicitly approved for this test cluster so evaluators can connect. Never put personal or production credentials in this repository.

## Verification and scripts

```sh
npm test             # 14 API/database integration tests
npm run build        # Frontend bundle in frontend/dist
npm run dev          # Frontend and Atlas-backed API
npm run dev:qa       # Frontend and temporary MongoDB with QA fixtures
npm start            # Atlas-backed API only
```

Tests exercise validation, all 36 status pairs, histories, concurrent sequences/duplicates, immutable fields, editing, deletion, literal search, counts, CORS, error envelopes and overdue boundaries. They never write to Atlas.

Browser checks verified creation, editing, immutable dates, workflow updates, deletion protection/confirmation, duplicate errors, future dates, backend filtering and responsive layouts against the temporary QA database. The normal app was then connected to a dedicated Atlas Free cluster: frontend creation, persisted status histories, allowed-next-status options, deletion restrictions, counts and overdue badges were verified against Atlas. Four clearly marked demo applications were saved through the frontend.

The project also passed `npm ci` and a production build from a clean source copy without existing dependencies or local credentials.

## Working application screenshots

Captured from the running application connected to MongoDB Atlas, showing demo records saved through the frontend:

![Dashboard with counts, applications and follow-ups](docs/screenshots/dashboard.png)

![Application details and persisted status timeline](docs/screenshots/application-details.png)

Additional [mobile screenshot](docs/screenshots/mobile.png).

## Submission checklist

- [x] Frontend and backend folders
- [x] Dependencies, lockfiles and dummy environment files
- [x] API documentation and two working application screenshots
- [x] Local integration tests and browser verification
- [x] Real MongoDB Atlas connection verified
- [x] Committed exam-only `.env` configured for evaluators
- [x] Five meaningful implementation commits
- [ ] Commit timing reviewed against the assessment's exam-duration rule
- [x] Project code pushed to the public GitHub repository
- [ ] Submission portal link entered before the assessment deadline
