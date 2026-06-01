# NexusTrade — Premium Trade Watchlist & Notes Dashboard

NexusTrade is a premium, secure, and fully responsive **Trade Watchlist & Notes** application tailored for crypto analysts. Rebranded and styled to a state-of-the-art Web3-inspired dark cyber aesthetic, it allows analysts to manage signals, notes, and targets securely.

---

## 🎨 Premium UI & Design Aesthetics

NexusTrade features a high-fidelity visual experience built on the following modern design principles:
* **Unified Cyber Theme**: Deep obsidian backdrop (`#030712`) enriched with glowing neon-indigo and cyber-cyan ambient blur rings.
* **Glassmorphic Cards**: Glassmorphic panels with backdrop blurs (`blur(16px)`) and thin translucent borders (`border-white/6`) for containers, tables, and dialog overlays.
* **Futuristic Typography**: Google Fonts **Sora** (used for geometric headings, brand typography, and ticker badges) paired with **Plus Jakarta Sans** (used for dense data layout, inputs, and readability).
* **Interactive Glow States**: Customized hover glows for signal metrics (emerald green for BUY, rose red for SELL, gold amber for HOLD, and cool cyan for WATCH).
* **100% Vector Iconography**: Complete replacement of emojis with crisp vectors from the **Lucide React** icon library.
* **Device Responsiveness**:
  * **Desktop Layout**: Unified data table layout with rounded borders and hover highlight animations.
  * **Mobile Layout**: Hides the table on viewports below `768px` (`md` breakpoint), automatically rendering note entries as gorgeous glassmorphic cards optimized for mobile screens.
  * **Fluid Metrics**: Metrics wrap fluidly from 1 card per row (mobile) up to 5 cards (desktop).
  * **Scroll-Safe Modals**: Restrained overlay modal heights (`max-h-[90vh] overflow-y-auto`) to guarantee complete usability on compact viewports or landscape phone displays.

---

## ⚡ Tech Stack

* **Backend**: Django, Django REST Framework (DRF), SimpleJWT, dj-database-url (dynamic SQLite/Postgres swap).
* **Frontend**: React.js (Vite), Tailwind CSS v4, Lucide React (icons), React Router.
* **API Spec & Docs**: OpenAPI 3.0 via `drf-spectacular` and Swagger UI.
* **Orchestration**: Docker, Docker Compose.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed (or Docker for compose deployment).

### 2. Local Setup (Without Docker)

#### Backend Setup:
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

#### Frontend Setup:
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

### 3. Docker Compose Setup (One-Step Launch)
To launch the entire fullstack portal in containers:
1. Run the compose script in the root directory:
   ```bash
   docker compose up --build
   ```
2. The frontend is accessible at: `http://localhost:5173`
3. The backend API server is active at: `http://localhost:8000`

---

## 🔑 Evaluator Credentials

The frontend login screen features **Quick Evaluation Access buttons** to log in automatically. You can click them directly, or type:

| Role | Username | Password | Permission Scoping (RBAC) |
| :--- | :--- | :--- | :--- |
| **Standard Analyst** | `analyst1` | `analystpassword` | Scoped read/write. Can only see, edit, or delete notes they created. |
| **Standard Analyst 2** | `analyst2` | `analystpassword` | Scoped read/write. Can only see, edit, or delete notes they created. |
| **Principal / Admin** | `admin` | `adminpassword` | Global read audit. Can view all notes in the database. Can edit/delete only notes they created. |

---

## 🛡️ Security & Architecture Implementations

### 1. Safe Token Storage (Hybrid Model)
* **Access Tokens** are stored strictly **in-memory** (in the React state of the `AuthProvider`) and are never written to `localStorage` or `cookies` to protect against XSS token harvesting.
* **Refresh Tokens** are kept in `localStorage`. On page refresh, the React app reads the refresh token, calls the `/api/v1/auth/refresh/` route to get a new access token, and loads it back into state.
* **Token Blacklisting**: Refreshed tokens are immediately blacklisted on rotation, and logging out triggers a backend POST request to `/api/v1/auth/logout/` which immediately blacklists the active refresh token on the database.

### 2. Privilege Escalation Prevention
* The public `/register/` endpoint completely ignores any `role` fields in the payload and defaults role creation strictly to `'user'`. Admin accounts must be created directly on the backend database or via seeding scripts.

### 3. BOLA (Broken Object Level Authorization) Protection
* Scoped querysets filter objects based on the requester. Even if an analyst guesses another analyst's note ID (e.g. sequence guessing), the API throws a `404 Not Found` response.

### 4. Rate Throttling
* Authentication endpoints (`/login/` and `/register/`) are throttled at **10 attempts per minute** for anonymous IPs to block brute-force dictionary attacks.

---

## 📈 Scalability & Production Readiness

### 1. Database Flexibility (PostgreSQL Support)
* The application runs on local **SQLite** by default.
* To connect a production database (like a free PostgreSQL database on **Aiven**), simply add `DATABASE_URL` to your env variables:
  ```env
  DATABASE_URL=postgres://user:password@host:port/dbname?sslmode=require
  ```
  If no variables are present, it falls back to SQLite automatically without crashing.

### 2. Indexed DB Search
* The `asset_symbol` field is indexed (`db_index=True`). Finding, filtering, or sorting watchlists by ticker symbols scales efficiently even with large datasets.

### 3. Database Aggregation Endpoint
* Summary statistics on the dashboard are fetched from `/api/v1/notes/stats/`, which performs high-speed aggregation queries directly on the database (via Django's `Count` and `Q` filters). This avoids the overhead of pulling full lists to count stats client-side, making dashboard states pagination-resilient.