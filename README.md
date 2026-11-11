# Sweety – Blood Glucose Tracker (PERN / MERN + PostgreSQL)

Sweety is a clinical blood glucose management web application tailored for diabetic patients. Patients can log up to 4 readings per day across designated time slots (fasting morning, post-breakfast, post-lunch, post-dinner), track health targets, and analyze statistical daily and monthly reports.

Built with a **Node.js + Express** REST API, **PostgreSQL 17** database, and **React (Vite)** frontend.

---

## 🚀 Key Features

### 1. Authentication & Tenant Isolation
- User registration and login with secure **bcrypt** password hashing (10 salt rounds).
- Stateless **JWT (JSON Web Token)** authentication with bearer tokens.
- **Strict multi-tenant data isolation**: logged-in patients only ever view, mutate, or report on their own readings.
- Pre-configured Demo Patient account for instant evaluation.

### 2. Blood Glucose Logging & CRUD
- Supported 4 time slots:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Rigorous Business Validations** (enforced on both client and server):
  | Rule | Enforced Error Message |
  |---|---|
  | Value is required | `"Please enter a glucose value."` |
  | Whole number between 40 and 600 | `"Value must be between 40 and 600 mg/dl."` |
  | Only one reading per slot per day | `"You already have an [Slot Name] reading for this date."` |
  | Maximum 4 readings per day | `"You can add only 4 readings per day."` |
  | Date cannot be in the future | `"Date cannot be in the future."` |
- Edit and delete readings with confirmation.
- Clinical status badges: **In Target**, **Elevated (Pre-diabetic)**, **High**, and **Low (Hypoglycemic)**.

### 3. Clinical Reports
Comprehensive statistical analytics for any selected anchor date (e.g., `15 Oct 2026`):
- **Daily Report**: For the selected date. Displays highest, lowest, average reading (rounded to 1 decimal place), count of readings, and an itemized breakdown of each reading with its slot.
- **Month-to-Date Report**: From the 1st of the month to the selected anchor date (e.g., `1 Oct – 15 Oct 2026`). Calculates highest, lowest, average, and reading count.
- **Monthly Report**: The whole previous month (e.g., `1 Sep – 30 Sep 2026`). Calculates highest, lowest, average, and count. Handles year transitions seamlessly (e.g., January anchor date queries December of previous year).
- **Friendly Empty State**: Informative, clean visual fallback if no readings are recorded in a range.

### 4. Bonus Features Implemented
- 🎯 **Pagination & Filtering**: `GET /api/readings?page=1&limit=20` with page navigation, slot filter, and date filters.
- 📈 **Interactive Trend Chart**: Recharts line visualization illustrating chronological glucose values with clinical reference threshold lines (fasting 100 mg/dl and post-meal 140 mg/dl).
- 🐳 **Docker & Docker Compose**: Full multi-container setup with PostgreSQL 17, Express backend, and React production build.
- 🧪 **Comprehensive Automated Testing**:
  - **Backend**: 21 Jest + Supertest integration tests testing authentication, reading validations, CRUD, reports, and tenant isolation.
  - **Frontend**: 5 React Testing Library + Vitest tests asserting all reading form validation rules.
- 🌱 **Database Seeding**: Creates a realistic demo user with 160+ readings spanning the previous and current month.
- ⚡ **Zero-Dependency In-Memory PostgreSQL Fallback**: Uses `pg-mem` to allow running the full application and tests out of the box even when a local PostgreSQL server is not installed or running.

---

## 🛠️ Project Structure

```
sweety/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # PostgreSQL connection pool with pg-mem fallback
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── readingController.js
│   │   │   └── reportController.js
│   │   ├── db/
│   │   │   ├── schema.sql       # PostgreSQL DDL tables and constraints
│   │   │   ├── migrate.js       # Migration runner
│   │   │   └── seed.js          # Demo patient seeder (160+ readings)
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── readingRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── utils/
│   │   │   └── validation.js    # Shared validation rules and messages
│   │   ├── app.js               # Express application config
│   │   └── server.js            # Server entrypoint
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── readings.test.js
│   │   └── reports.test.js
│   ├── Dockerfile
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/                 # API client services
│   │   ├── components/          # Reusable UI components (Modal, Cards, Chart, Navbar)
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # DashboardPage, ReportsPage, LoginPage, RegisterPage
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tests/
│   │   └── ReadingFormModal.test.jsx
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended; v20/v24 tested)
- **npm** (v9+ or higher)
- *(Optional)* **PostgreSQL** or **Docker**

### Step 1: Clone and Install Dependencies
From the root repository directory:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

Or install all at once using root convenience script:
```bash
npm run install:all
```

---

### Step 2: Environment Configuration

Copy the example environment files:
```bash
# In server/
cp server/.env.example server/.env
```

The default `server/.env` includes:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=sweety_jwt_dev_secret_key_2026
JWT_EXPIRES_IN=7d

# PostgreSQL connection string
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sweety_db

# Set to true to run with zero-setup in-memory database (no local PostgreSQL required)
USE_PG_MEM=true
```

> **Note on Database Connection**: If you have a local PostgreSQL instance running, create a database named `sweety_db` and set `USE_PG_MEM=false`. If you do not have PostgreSQL running locally, keep `USE_PG_MEM=true`; Sweety will run completely in-memory using its embedded PostgreSQL engine!

---

### Step 3: Run Database Migrations & Seed Demo Data

Run the migration script to create tables:
```bash
npm run db:init
```

Seed the demo patient account with realistic historical readings across 40+ days:
```bash
npm run seed
```

**Demo Account Credentials:**
- **Email:** `demo@sweety.test`
- **Password:** `Password123!`

---

### Step 4: Run the Application

In terminal 1 (start the backend API on port 5000):
```bash
npm run dev:server
# Server will listen on http://localhost:5000
```

In terminal 2 (start the React frontend on port 3000):
```bash
npm run dev:client
# Vite will serve the client on http://localhost:3000
```

Open your browser at **`http://localhost:3000`**. You can click the **"Fill Demo Patient Account"** button on the sign-in page to log in immediately!

---

## 🧪 Running Automated Tests

Sweety includes unit and integration tests across both the backend and frontend:

```bash
# Run all tests (both server and client)
npm test

# Run backend tests only (21 Jest tests)
npm run test:server

# Run frontend tests only (5 Vitest / React Testing Library tests)
npm run test:client
```

### Test Coverage Highlights
- **Auth**: User registration, duplicate email rejection, weak password checks, login, JWT issuance, profile retrieval.
- **Readings CRUD**: Creating readings, updating readings, deleting readings, pagination queries.
- **Validation Rules**:
  - `Value is required` -> `"Please enter a glucose value."`
  - `Value range (40 - 600)` -> `"Value must be between 40 and 600 mg/dl."`
  - `Whole number only` -> rejects decimal inputs.
  - `Slot uniqueness` -> `"You already have an [Slot Name] reading for this date."`
  - `Day maximum` -> `"You can add only 4 readings per day."`
  - `Future date rejection` -> `"Date cannot be in the future."`
- **Multi-Tenant Isolation**: Patient B cannot view, modify, or delete Patient A's readings.
- **Clinical Reports**: Accurate highest, lowest, average (rounded to 1 decimal), and reading count calculations for Daily, Month-to-date, and Monthly ranges.
- **React Testing Library**: Form input rendering, instant feedback, error banner assertions, mock submission.

---

## 🐳 Running with Docker Compose

To start PostgreSQL, the Express API, and the React frontend with a single command:

```bash
docker-compose up --build
```

- PostgreSQL runs on port `5432` with volume persistence.
- Express API runs on port `5000`.
- React application is served via Nginx on **`http://localhost:3000`**.

To shut down:
```bash
docker-compose down -v
```

---

## 📡 REST API Reference

All `/api/readings` and `/api/reports` routes require the header `Authorization: Bearer <token>`.

### Authentication
- `POST /api/auth/register` — Body: `{ name, email, password }`
- `POST /api/auth/login` — Body: `{ email, password }`
- `GET /api/auth/me` — Returns current authenticated user profile

### Readings
- `GET /api/readings` — Query: `page=1`, `limit=20`, `date=YYYY-MM-DD`, `slot=...`
- `POST /api/readings` — Body: `{ reading_date, time_slot, glucose_value }`
- `GET /api/readings/:id` — Get single reading
- `PUT /api/readings/:id` — Update reading
- `DELETE /api/readings/:id` — Delete reading

### Reports
- `GET /api/reports?date=YYYY-MM-DD` — Generates Daily, Month-to-date, and Monthly report aggregates for the selected anchor date, plus daily slot itemization and monthly time-series chart data.

---

## 📝 Notes, Assumptions & Future Improvements

### Assumptions
1. **Timezone & Future Date Rule**: The date boundary for "Date cannot be in the future" compares the date string against the user's current local date in `YYYY-MM-DD`.
2. **Whole Previous Month Definition**: When viewing reports for anchor date `15 Oct 2026`, the previous month is calculated as `1 Sep 2026 – 30 Sep 2026`. If the anchor date is in January (e.g., `15 Jan 2026`), the monthly report evaluates December of the previous calendar year (`1 Dec 2025 – 31 Dec 2025`).
3. **Clinical Target Standards**:
   - Fasting: Normal is 70–99 mg/dl; Pre-diabetic / Elevated is 100–125 mg/dl; High is ≥126 mg/dl.
   - Postprandial (2 hours after meal): Normal is <140 mg/dl; Elevated is 140–199 mg/dl; High is ≥200 mg/dl.
   - Hypoglycemic: <70 mg/dl.

### What We'd Improve With More Time
1. **Continuous Glucose Monitor (CGM) Integration**: Add Webhook / Bluetooth sync with Dexcom / Abbott Freestyle Libre sensors.
2. **Doctor & Caregiver Role**: Role-based access control (RBAC) allowing physicians to view patient reports, leave clinical notes, and adjust glycemic targets.
3. **Automated Reminders (BullMQ + Redis)**: Background scheduled job that sends email or push reminders to patients if fewer than 4 readings are logged before 9:00 PM.
4. **PDF / CSV Export**: Generate clinical summary reports for patient endocrinology appointments.
5. **HbA1c Estimation**: Calculate estimated average glucose (eAG) and approximate HbA1c percentage from the 90-day moving average.
