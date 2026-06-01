# PrimeTrade.ai — Trade Intelligence Dashboard

A secure, high-performance, dark-themed **Trade Watchlist & Notes** application tailored for crypto analysts. Built to fulfill the backend/fullstack internship assignment requirements for **Primetrade.ai**.

## Tech Stack
* **Backend**: Django, Django REST Framework (DRF), Django SimpleJWT, SQLite (local development / database-agnostic).
* **Frontend**: React.js (bootstrapped with Vite), Tailwind CSS v4, Lucide React (icons), React Router.
* **API Spec & Docs**: OpenAPI 3.0 via `drf-spectacular` and Swagger UI.

---

## Quick Start Guide

### 1. Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   # On macOS/Linux
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
5. **Seed Test Credentials**: Populate standard analyst accounts, administrators, and notes:
   ```bash
   python manage.py seed_data
   ```
6. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   * The server runs at: `http://localhost:8000/`
   * Swagger Documentation is available at: `http://localhost:8000/api/v1/schema/swagger-ui/`

### 3. Frontend Setup
1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   * Open: `http://localhost:5173/` in your browser.

---

## Test Credentials (Recruiter Shortcuts)
The frontend login screen features **Quick Login buttons** for evaluation speed. You can click them directly, or type:

| Role | Username | Password | Permission Scoping (RBAC) |
| :--- | :--- | :--- | :--- |
| **Standard Analyst** | `analyst1` | `analystpassword` | Can create notes. Can only view and edit/delete their own notes. |
| **Standard Analyst 2** | `analyst2` | `analystpassword` | Can create notes. Can only view and edit/delete their own notes. |
| **Principal / Admin** | `admin` | `adminpassword` | Can view **all** notes in the system. Can edit/delete only notes they created. |

---

## Security Features Implemented

* 🛡️ **JWT Security**: Strict token boundaries. The frontend stores tokens in React context state (in-memory) and `localStorage` to retain sessions, appending the `Bearer <token>` prefix.
* 🛡️ **Auto Token Refresh**: Transparently intercepts HTTP `401 Unauthorized` responses. If the access token expires, it silently requests a new one from `/api/v1/auth/refresh/` and retries the original API call.
* 🛡️ **BOLA (Broken Object Level Authorization) Protection**: Scoped querysets enforce that Standard Users can never query, edit, or delete notes belonging to other analysts by guessing sequential IDs in the API URL.
* 🛡️ **Input Sanitization**: Django serializers strictly validate incoming payloads, stripping white space, validating numeric price bounds, and ensuring asset symbols are alphanumeric before saving.

---

## Scalability & Production Readiness Note

### 1. Database Indexing & Optimization
* **Index Strategy**: In `trading/models.py`, `asset_symbol` is marked `db_index=True`. As the database scales to millions of notes, filtering/searching by asset symbol remains $O(\log N)$ instead of sequential table scans $O(N)$.
* **Relationship Indexes**: Foreign keys linking trade notes to user tables are automatically indexed to make joins fast.

### 2. Microservices & Load Balancing
* **Stateless API Design**: The Django backend relies entirely on **JWT validation** and maintains no session state in memory. This allows the backend to scale horizontally across multiple instances behind a load balancer (e.g. AWS ALB or Nginx) without needing session stickiness.
* **Microservices Transition**: Authentication (`accounts`) and trading intelligence (`trading`) apps are designed modularly. If the load on trade notes queries scales drastically, the `trading` application can be extracted into its own service/database with minor routing configurations.

### 3. Caching & Performance
* **In-Memory Caching (Redis)**: For high-frequency query endpoints (such as retrieving the current list of notes), Redis can be integrated to cache serializations. The cache can be invalidated using Django signals when notes are created, modified, or deleted.

### 4. Pagination
* DRF pagination is active on the notes list API. If a user accumulates thousands of watchlist items, the payload returns in chunks of 10, preventing database/API bottlenecks.

---

## API Endpoints Summary

### Authentication (`/api/v1/auth/`)
* `POST /register/` — Create new analyst or administrator account.
* `POST /login/` — Submit credentials and retrieve JWT access/refresh tokens.
* `POST /refresh/` — Obtain a fresh access token using a refresh token.

### Watchlist & Notes (`/api/v1/`)
* `GET /notes/` — Fetch list of trade notes (paginated). Standard user sees own notes; Admin sees all.
* `POST /notes/` — Create a trade note.
* `GET /notes/{id}/` — Retrieve a specific trade note.
* `PUT /notes/{id}/` — Edit a trade note (owner only).
* `DELETE /notes/{id}/` — Delete a trade note (owner only).