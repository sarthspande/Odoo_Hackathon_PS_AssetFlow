
**Quick Link**: For set up instructions click [here](#-setup--installation)
# FlowCore Asset Management System

FlowCore is a modern, full-stack Asset Management System built using Python (Flask), SQLAlchemy, TailwindCSS, Alpine.js, and Socket.IO. It provides organization-wide visibility into assets, real-time resource booking with overlap checks, analytics, and role-based permissions tailored for employees, department heads, asset managers, and administrators.

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Tailored interfaces and endpoint security for 4 roles: `Admin`, `Asset Manager`, `Department Head`, and `Employee`.
* **Asset Lifecycle Management:** Comprehensive tools to register, update, categorize, track condition/location, and decommission organizational assets.
* **Real-time Resource Booking Calendar:** Interactive timeline to schedule and reserve shared bookable assets featuring automated real-time overlap/conflict prevention.
* **Live Notifications & Reminders:** Utilizes browser `Notification` APIs and client-side background polling to notify employees of upcoming bookings 15 minutes before they start.
* **Hybrid Dual-Channel Auth Protocol:** Supports both lightweight asynchronous WebSocket (`Socket.IO`) logins/registrations and classic HTTP standard form fallbacks for robust connectivity.
* **Issue Reporting & Maintenance Tracking:** Self-service reporting module allowing workers to log asset breakdowns by category and severity.
* **Dynamic Analytics Dashboards:** Complete canvas charts processing live telemetry data on asset categories, status distribution, and maintenance backlog vectors.

---
## 🗄️ Database Schema & Data Model
FlowCore uses SQLAlchemy ORM to enforce structure and relationships over an SQLite storage engine. The application separates operational data into clear domains: organizational hierarchies, asset tracking lifecycle vectors, scheduling blocks, maintenance requests, and internal compliance audits.

                               ┌─────────────────┐
                               │   Department    │◄────────┐
                               └────────┬────────┘         │
                                        │ 1                │
                                        │                  │
                                        │ N                │ N
 ┌─────────────────┐ 1          ┌───────▼────────┐         │
 │   ActivityLog   ├───────────►│    Employee    ├─────────┘
 └─────────────────┘            └───┬───┬────┬───┘
                                    │   │    │
                     ┌──────────────┘   │    └──────────────┐
                   1 │                  │ 1               1 │
                     │                  │                   │
                   N ▼                  ▼ N                 ▼ N
 ┌─────────────────┐            ┌───────┴────────┐   ┌──────┴──────────┐
 │   AuditDetail   │            │    Booking     │   │  MaintRequest   │
 └────────┬────────┘            └───────┬────────┘   └──────┬──────────┘
          │ N                           │ N                 │ N
          │                             │                   │
          │                             │                   │
          └─────────────────────────────┼───────────────────┘
                                      1 │
                                        ▼
                               ┌─────────────────┐ 1       ┌─────────────────┐
                               │      Asset      ├────────►│  AssetCategory  │
                               └────────┬────────┘         └─────────────────┘
                                        │ 1
                                        │
                                        │ N
                               ┌────────▼────────┐
                               │   Allocation    │
                               └─────────────────┘


## 🛠️ Technology Stack

* **Backend:** Python 3, Flask, Flask-SocketIO (WebSockets), Werkzeug (Password Hashing)
* **Database ORM:** SQLAlchemy (interacting with an absolute SQLite database `assetflow.db`)
* **Frontend UI:** Alpine.js (reactive state management), TailwindCSS v3 (responsive styling), Chart.js (analytics graphing), HTML5 Paged Media / Jinja2 Templates.

---

## 📂 Architecture & File Breakdown

```bash
📁 FlowCore/
│
├── 📁 DBinitialisation/
│   ├── 📄 __init__.py          # Initializes the database engine and maps the SQLAlchemy instance to the Flask context.
│   └── 📄 DataBases.py         # Defines core database schemas (Models) including Employee, Asset, Booking, and Allocation.
│
├── 📁 templates/
│   ├── 📁 src/
│   │   ├── 📄 asset_allocation.jsx   # UI component handling hardware provisioning, checking out devices, and return tracking logic.
│   │   ├── 📄 Asset_Audit_Screen.HTML # Native structural view facilitating internal equipment spot-checks and status validation logs.
│   │   ├── 📄 asset.jsx              # Main React bridge mounting stateful components to interactive DOM target elements.
│   │   ├── 📄 AssetDirectory.jsx     # Complex filter component to browse corporate hardware profiles using dynamic search.
│   │   ├── 📄 maintenance.jsx        # Self-service component to request hardware repair tickets, log breakdowns, and track statuses.
│   │   └── 📄 Org_Setup_Screen.HTML  # View panel for initializing company settings, defining structural defaults, and system metadata.
│   │
│   ├── 📄 admin.html           # Superuser management control center for full CRUD operations over users and departments.
│   ├── 📄 all_assets.html      # General search directory enabling live textual and classification sorting for all equipment.
│   ├── 📄 analytics.html       # Charting hub that mounts live data canvases processing key organizational usage statistics.
│   ├── 📄 asset.html           # Dynamic single-page view wrapper that houses client-side interactive equipment scripts.
│   ├── 📄 base.html            # Core base template featuring responsive navigation sidebars and notifications.
│   ├── 📄 booking.html         # Interactive timeline interface for checking slot conflicts and booking shared resources.
│   ├── 📄 dashboard.html       # Main landing panel displaying active metrics, upcoming returns, and pending maintenance orders.
│   ├── 📄 login.html           # Dual-channel validation panel supporting standard HTTP postbacks and real-time WebSockets.
│   ├── 📄 register.html        # Account initialization template mapping new employee records directly into the system.
│   └── 📄 reports.html         # User view for generating exportable inventory lists and tracking maintenance logs.
│
└── 📄 app.py                   # Central Flask engine orchestrating backend routing, APIs, and WebSockets connections.

```

---

## 👥 Roles and Workflow Specifications

| Role | Navigation Sidebar Permissions | Operational Scope |
| --- | --- | --- |
| **Admin** | Dashboard, Admin Console, Analytics, All Assets, Book Resource, Report Issue | Complete structural access. Can execute CRUD operations on Users, Departments, Assets, and System metrics. |
| **Asset Manager** | Dashboard, All Assets, Book Resource, Register/Allocate, Approvals, Analytics, Support | Handles day-to-day asset lifecycles, distribution, assignments, and scheduling configurations. |
| **Department Head** | Dashboard, Dept Assets, Dept Approvals, All Assets, Book Resource, Analytics, Support | Monitors inventories and requests specific to their respective department bounds. |
| **Employee** | Dashboard, My Assets, Book Resource, All Assets, Analytics, Report Issue | Requests and books bookable resources, reviews assigned equipment, and reports breakdowns. |

---

## 🔌 API Documentation

### 🏦 Department Management

* `GET /api/departments` — List all active organizational units.
* `POST /api/departments` — Create a new department *(Admin only)*.
* `PUT /api/departments/<id>` — Modify structural info or status values *(Admin only)*.
* `DELETE /api/departments/<id>` — Safely delete a department and unlink employees *(Admin only)*.

### 👤 User Administration

* `GET /api/users` — Fetch complete system user registry directory *(Admin only)*.
* `POST /api/users` — Onboard new staff manually with custom encryption hashes *(Admin only)*.
* `PUT /api/users/<id>` — Update profile parameters, departments, or access tier permissions *(Admin only)*.
* `DELETE /api/users/<id>` — Revoke credentials and scrub operational records *(Admin only)*.

### 💻 Asset Registry

* `GET /api/assets` — Fetch a complete list of inventory entries.
* `POST /api/assets` — Register a brand new hardware or asset profile *(Admin only)*.
* `PUT /api/assets/<id>` — Update condition, location, or change rental availability rules *(Admin only)*.
* `DELETE /api/assets/<id>` — Wipe hardware entries completely from standard registers *(Admin only)*.

### 📅 Booking Engine

* `GET /api/bookings?asset_id=&date=&mine=` — Highly flexible queries for timeline populating. Returns scoped records depending on query string parameter combination.
* `POST /api/bookings` — Request a time slot reservation. Automatically rejects overlapping entries with a `409 Conflict`.
* `PUT /api/bookings/<id>` — Cancel reservation records entirely or perform runtime rescheduling parameters adjustment.

### 📈 Core Telemetry

* `GET /api/dashboard` — Live compilation of asset availability counts, pending maintenance issues, and due/overdue allocation dates.
* `GET /api/analytics` — Generates categorized counts for statuses, department populations, and maintenance priority weight distributions.

---

## ⚡ Setup & Installation

### 1. Clone the Project & Setup Environment

Ensure Python 3.x is installed locally on your development system environment.

```bash
# Create and activate a clean virtual isolation environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required framework dependencies
pip install flask flask-socketio flask-sqlalchemy werkzeug python-dotenv

```

### 2. Configure Environment Variables

Create a file named `.env` in the root directory:

```env
API_KEY=your_super_secure_flask_secret_key_string
DATABASE_URL=sqlite:///assetflow.db

```

### 3. Initialize and Run the Application

```bash
# Start the asynchronous Eventlet/Werkzeug developer socket listener
python app.py

```

Open [http://127.0.0.1:5000](https://www.google.com/search?q=http://127.0.0.1:5000) inside your modern web browser of choice.

---

## 🔒 Security Measures Included

1. **Context Hashing Security:** Employs industry-standard cryptographic `generate_password_hash` implementation protocols during system registration workflows.
2. **Explicit Routing Wrappers:** Implements a rigorous `@login_required` middleware check that verifies local sessions before allowing any operational data to load.
3. **Cross-Origin Policy Filters:** The `SocketIO` interface enforces explicit, production-ready `cors_allowed_origins` filters to minimize data exposure vulnerabilities.