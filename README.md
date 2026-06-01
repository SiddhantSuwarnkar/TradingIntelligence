# PrimeTrade.ai — Trade Intelligence Dashboard

A secure, dark-themed **Trade Watchlist & Notes** application tailored for crypto analysts. Built to fulfill the backend/fullstack internship assignment requirements for **Primetrade.ai**.

## Tech Stack
* **Backend**: Django, Django REST Framework (DRF), SimpleJWT, dj-database-url (dynamic SQLite/Postgres swap).
* **Frontend**: React.js (Vite), Tailwind CSS v4, Lucide React (icons), React Router.
* **API Spec & Docs**: OpenAPI 3.0 via `drf-spectacular` and Swagger UI.

---

## Quick Start Guide

### 1. Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   # macOS/Linux
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations to initialize the database:
   ```bash
   python manage.py migrate
   ```
5. **Seed Test Credentials**: Populate default analyst accounts and trade notes:
   ```bash
   python manage.py seed_data
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```
   * Swagger Documentation is available at: `http://localhost:8000/api/v1/schema/swagger-ui/`

### 3. Frontend Setup
1. Navigate to the `frontend/` directory in a new terminal window:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
   * Open: `http://localhost:5173/` in your browser.

---

## Evaluator Credentials
The frontend login screen features **Quick Login buttons** for evaluation speed. You can click them directly, or type:

| Role | Username | Password | Permission Scoping (RBAC) |
| :--- | :--- | :--- | :--- |
| **Standard Analyst** | `analyst1` | `analystpassword` | Scoped read/write. Can only see and edit/delete their own notes. |
| **Standard Analyst 2** | `analyst2` | `analystpassword` | Scoped read/write. Can only see and edit/delete their own notes. |
| **Principal / Admin** | `admin` | `adminpassword` | Global read audit. Can view all notes in the database. Can edit/delete only notes they created. |

---

## Security & Architecture Implementations

### 1. Safe Token Storage (Hybrid Model)
* **Access Tokens** are stored strictly **in-memory** (in the React state of the `AuthProvider`) and are never written to `localStorage` or `cookies`. This limits the blast radius of XSS token leakage.
* **Refresh Tokens** are kept in `localStorage`. On browser reload, the React app reads the refresh token, calls the `/api/v1/auth/refresh/` route to get a new access token, and loads it back into state.
* **Token Blacklisting**: Old refresh tokens are blacklisted immediately upon rotation. If a refresh token is stolen, the attacker cannot reuse rotated tokens.

### 2. Privilege Escalation & Role Hardening
* Admin self-registration is blocked. The public `/register/` endpoint completely ignores any `role` fields in the payload and defaults role creation strictly to `'user'`. Admin accounts must be created directly on the backend via django admin or seeding utilities.

### 3. BOLA (Broken Object Level Authorization) Protection
* Scoped querysets filter objects based on the requester. Even if an analyst guesses another analyst's note ID (e.g. guessing sequence values in the URL), the API throws a `404 Not Found` response.

### 4. Rate Throttling
* Authentication endpoints (`/login/` and `/register/`) are throttled at **10 attempts per minute** for anonymous IPs to block brute-force dictionary attacks.

---

## Scalability & Production Readiness

### 1. Database Flexibility (Aiven PostgreSQL Support)
* The application runs on **SQLite** by default, requiring no environment variables to boot.
* To plug in a production database (like a free PostgreSQL database on **Aiven**), simply add `DATABASE_URL` to the `backend/.env` file:
  ```env
  DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require
  ```
  If `.env` is absent (like when cloned initially), it falls back to SQLite automatically.

### 2. Indexed DB Search
* The `asset_symbol` field is indexed (`db_index=True`). Finding, filtering, or sorting watchlists by ticker symbols scales efficiently even with large datasets.

### 3. Database Aggregation Endpoint
* Summary statistics on the dashboard are fetched from `/api/v1/notes/stats/`, which performs high-speed aggregation queries directly on the database (via Django's `Count` and `Q` filters). This avoids the overhead of pulling full lists to count stats client-side, making dashboard states pagination-resilient.