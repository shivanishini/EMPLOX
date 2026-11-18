# EMPLOX – Employee Management System

A full-stack Employee Management and Attendance System built with **React (Vite)** on the frontend, **Node.js (Express)** on the backend, and **MySQL** as the relational database. EMPLOX features dedicated, role-protected portals for **Administrators** and **Employees**, offering real-time attendance management, Indian Standard Time (IST) time-tracking, automated overtime calculation, multi-day leave workflows, monthly payroll generation, candidate job applications tracking, and department/role administration.

---

## 1. Project Overview

EMPLOX simplifies workplace operations by segregating administrative control from employee self-service:

*   **Admin Portal**:
    *   **Dashboard**: Real-time KPI summary cards showing Total Employees, Present Today, Late Today, On Leave, Total Departments, Pending Leaves, and Total Overtime.
    *   **Employee Management**: Add, view, search, edit, and activate/deactivate employee records with dynamic role and department assignments.
    *   **Attendance Management**: Monitor attendance records with multi-criteria filtering (by employee, date range, and status), manual attendance entry/update modal, and overtime tracking.
    *   **Leave Requests**: Review employee leave applications, view day calculations, and Approve or Reject requests (Approved leaves automatically synchronize into attendance as "On Leave").
    *   **Payroll**: Run monthly payroll across all active employees, adjust allowances and deductions, calculate net salary, and mark payments as "Paid".
    *   **Job Applications**: Track recruitment candidates through the hiring pipeline (Pending, Shortlisted, Rejected, Hired).
    *   **Departments & Roles**: Manage organizational hierarchy with dedicated CRUD interfaces.
*   **Employee Portal**:
    *   **Live IST Clock**: Displays current time synced to Indian Standard Time (UTC+05:30).
    *   **One-Click Check-In ("Mark Present")**: Records daily check-in time with automatic arrival validation (cutoff at 09:10 AM IST).
    *   **Check-Out & Overtime**: Records departure time and automatically computes overtime minutes for work completed past 07:10 PM IST.
    *   **Monthly Summary Stats**: Quick view of monthly Present days, Late days, On-Leave days, and cumulative Overtime hours.
    *   **Leave Application & History**: Apply for leave (Casual, Sick, Earned, Unpaid) with date range selection and track real-time approval status.

---

## 2. Tech Stack

### Frontend
*   **Framework**: [React 18.3.1](https://react.dev/)
*   **Build Tool**: [Vite 5.4.10](https://vitejs.dev/)
*   **Routing**: [React Router DOM 7.18.2](https://reactrouter.com/)
*   **HTTP Client**: [Axios 1.19.0](https://axios-http.com/)
*   **Styling**: Custom Vanilla CSS Design System with responsive grid layouts, glassmorphic UI elements, and modern typography.

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/) (ES Modules & CommonJS compatibility)
*   **Web Framework**: [Express 5.2.1](https://expressjs.com/)
*   **Database Client**: [mysql2 3.23.3](https://github.com/sidorares/node-mysql2) (Promise-based connection pool)
*   **Authentication**: [JSON Web Tokens (jsonwebtoken 9.0.3)](https://github.com/auth0/node-jsonwebtoken) with Bearer token authentication (8-hour expiration)
*   **Security & Encryption**: [bcryptjs 3.0.3](https://github.com/dcodeIO/bcrypt.js) for salted password hashing
*   **CORS**: [cors 2.8.6](https://github.com/expressjs/cors)
*   **Environment Management**: [dotenv 17.4.2](https://github.com/motdotla/dotenv)

### Database
*   **Engine**: MySQL 8.0+
*   **Default Database Name**: `employee_management`
*   **Charset**: `utf8mb4`

---

## 3. Prerequisites

Before setting up EMPLOX, ensure your machine has the following installed:

1.  **Node.js**: Version **v18.x**, **v20.x**, or **v22.x** (v22.20.0 verified).  
    Check with:
    ```powershell
    node -v
    npm -v
    ```
2.  **MySQL Server**: Version **8.0+** running locally on port `3306`.  
    Verify the MySQL service is running:
    ```powershell
    Get-Service -Name MySQL*
    ```
3.  **Operating System**: Windows 10 or 11 with PowerShell or Command Prompt.

---

## 4. Project Structure

```text
EMPLOX/
│
├── database/
│   ├── employee_management.sql   # Primary schema + seed data (employees, attendance)
│   └── hr_modules.sql            # Schema definitions for leave_requests, payroll, applications
│
├── server/
│   ├── .env                      # Local server configuration (created during setup)
│   ├── .env.example              # Template environment file
│   ├── db.js                     # MySQL connection pool configuration (mysql2/promise)
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express application, API routes, auto-table migrations, seed admin
│
├── src/
│   ├── assets/                   # Static icons and assets
│   ├── components/
│   │   ├── Login.jsx             # Role-aware login component with animated toggle
│   │   ├── Sidebar.jsx           # Admin navigation sidebar with active indicator
│   │   ├── StatCard.jsx          # Metric cards with percentage indicator and icons
│   │   └── Topbar.jsx            # Header with search, user identity, and profile dropdown
│   ├── data/
│   │   └── navigation.jsx        # Navigation configuration items
│   ├── pages/
│   │   ├── Applications.jsx      # Job candidate applications pipeline
│   │   ├── Attendance.jsx        # Admin attendance dashboard, filter bar & manual entry
│   │   ├── Dashboard.jsx         # Admin executive dashboard with live metrics
│   │   ├── Departments.jsx       # Department CRUD administration
│   │   ├── EmployeeDashboard.jsx # Dedicated Employee portal (Attendance clock & Leave tabs)
│   │   ├── Employees.jsx         # Employee directory with CRUD and status toggle
│   │   ├── GenericPage.jsx       # Fallback page container
│   │   ├── Leave.jsx             # Admin leave management & approval flow
│   │   ├── Payroll.jsx           # Monthly payroll generator and status updater
│   │   └── Roles.jsx             # Role CRUD administration
│   ├── services/
│   │   └── api.js                # Axios instance with request/response interceptors
│   ├── App.jsx                   # Main application router and auth gatekeeper
│   ├── index.css                 # Base resets
│   ├── main.jsx                  # React application entrypoint
│   └── styles.css                # Global design system, glassmorphism, and responsive tables
│
├── index.html                    # HTML document template
├── package.json                  # Frontend dependencies and Vite configuration
├── README_FIRST.txt              # Initial developer notes and quick instructions
├── SETUP_EMPLOX.bat              # Batch utility to generate server/.env
├── START_EMPLOX.bat              # Batch runner to auto-install dependencies & launch both servers
└── vite.config.js                # Vite build and dev server config
```

---

## 5. Database Setup

Follow these exact steps in Windows to configure the MySQL database.

### Step 1: Open MySQL Command Line Client
Open **PowerShell** or Command Prompt and connect to MySQL:
```powershell
mysql -u root -p
```
*(Enter your MySQL root password when prompted)*

### Step 2: Create the Database
In the MySQL prompt (`mysql>`), run:
```sql
CREATE DATABASE IF NOT EXISTS employee_management;
USE employee_management;
```

### Step 3: Import the Base Schema & Seed Data
You can import the database script directly from MySQL prompt using `source`:
```sql
SOURCE C:/Users/saniy/OneDrive/Desktop/EMPLOX/database/employee_management.sql;
```
*(Use forward slashes `/` in MySQL file paths)*

*Alternative from Windows PowerShell (outside MySQL):*
```powershell
Get-Content database\employee_management.sql | mysql -u root -p employee_management
```

### Step 4: Verify Existing Tables
Run the following in the MySQL client:
```sql
USE employee_management;
SHOW TABLES;
```
You should see:
*   `attendance`
*   `employees`

> **Note on HR Module Tables**:  
> When the backend server starts, `server.js` automatically executes `CREATE TABLE IF NOT EXISTS` queries for:
> *   `leave_requests`
> *   `payroll`
> *   `applications`
> *   `departments`
> *   `roles`
> *   `users`  
> It also verifies that `attendance` includes the `overtime_minutes` column and automatically seeds the default `admin@emplox.com` user if not present.

---

## 6. Environment Configuration

The backend reads configuration settings from `server/.env`.

### Automated Configuration
Run the setup batch script from the project root:
```powershell
.\SETUP_EMPLOX.bat
```
This prompts for your MySQL root password and automatically generates `server\.env`.

### Manual Configuration
Alternatively, copy `server/.env.example` to `server/.env`:
```powershell
Copy-Item server\.env.example server\.env
```

Open `server/.env` in a text editor and ensure the values match your local MySQL configuration:

```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_MYSQL_PASSWORD
DB_NAME=employee_management
DB_PORT=3306
JWT_SECRET=emplox_super_secret_key_2026
```

> **Security Alert**: Never commit `server/.env` to source control. Ensure `.env` is listed in your `.gitignore`.

---

## 7. Install Dependencies

You must install dependencies for both the frontend (project root) and the backend (`server/`).

### Terminal 1 – Frontend Dependencies (Project Root):
```powershell
cd C:\Users\Asus\Downloads\EMPLOX> 
npm install
```

### Terminal 2 – Backend Dependencies:
```powershell
cd C:\Users\Asus\Downloads\EMPLOX\server>
npm install
```

---

## 8. Start the Project

### Option A: One-Click Startup (Recommended on Windows)
From the project root, run:
```powershell
.\START_EMPLOX.bat
```
This utility:
1. Checks if `node_modules` exists for both frontend and backend; installs them automatically if missing.
2. Spawns a dedicated console window for the **Backend** running on port `5000`.
3. Spawns a dedicated console window for the **Frontend** running on port `5173`.

### Option B: Manual Startup

#### Step 1: Start the Backend (Terminal 1)
```powershell
cd C:\Users\Asus\Downloads\EMPLOX\server>
npm start
```
*Expected console output:*
```text
Connected to MySQL database: employee_management
EMPLOX Server is running on port 5000
Default admin account created: admin@emplox.com (if fresh setup)
```

#### Step 2: Start the Frontend (Terminal 2)
```powershell
cd C:\Users\Asus\Downloads\EMPLOX>
npm run dev
```
*Expected console output:*
```text
  VITE v5.4.10  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Step 3: Access the Application
Open your web browser and navigate to:
**`http://localhost:5173`**

---

## 9. Login / Demo Accounts

The following demo accounts exist in the system:

| Role | Email | Password | Linked Employee | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@emplox.com` | `admin123` | *None* | Full access to all administrative modules, approvals, payroll, and settings. |

| **Employee** | `shiv@emplox.com` | `employee123` | `EMP001` (Shivani S) | Access to Employee Portal: Mark Present, Check Out, view attendance & submit leaves. |
| **Employee** | `ship@emplox.com` | `employee123` | `EMP002` (Shipra Sahoo) | Access to Employee Portal: Mark Present, Check Out, view attendance & submit leaves. |
| **Employee** | `saz@emplox.com` | `employee123` | `EMP003` (Sazia Begum) | Access to Employee Portal: Mark Present, Check Out, view attendance & submit leaves. |
| **Employee** | `sani@emplox.com` | `employee123` | `EMP004` (Saniya Sahoo) | Access to Employee Portal: Mark Present, Check Out, view attendance & submit leaves. |

> All 4 default employee portal accounts are automatically seeded on server startup if not present.

---

## 10. Admin Portal – Step-by-Step Usage

1.  **Login**:
    *   Navigate to `http://localhost:5173`.
    *   Select the **Administrator** role tab or enter credentials directly.
    *   Enter `admin@emplox.com` and `admin123`.
2.  **Dashboard**:
    *   Review live real-time statistics cards: Present Today, Late Today, On Leave, Total Departments, Pending Leaves, Total Overtime.
    *   Click "Add Employee" or "View Employees" for quick navigation.
3.  **Employee Management** (`Employees` page):
    *   Filter employees by searching names or employee codes.
    *   Click **+ Add Employee** to register a new hire with name, email, department, role, salary, and employment type.
    *   Click **Edit** to modify details or **Deactivate** to toggle status between `Active` and `Inactive` (with confirmation modal).
4.  **Attendance Tracking** (`Attendance` page):
    *   Review monthly attendance summaries (Present, Late, On Leave, Absent, Overtime).
    *   Filter records by selecting an individual employee, date range (`From Date` - `To Date`), or attendance status.
    *   Click **+ Mark Attendance** to manually log or adjust attendance for any date.
5.  **Leave Management** (`Leave` page):
    *   View status cards: Total Requests, Pending, Approved, and Rejected.
    *   Filter requests by employee, status (`Pending`, `Approved`, `Rejected`), or leave type.
    *   Click **Approve** to authorize a request: this automatically creates/updates the employee's attendance records to `On Leave` across the entire requested date range.
    *   Click **Reject** (with mandatory confirmation) to decline a request.
6.  **Payroll** (`Payroll` page):
    *   Select the target payroll month (e.g., `2026-09`).
    *   Click **Run Payroll for All Active Employees** to populate basic salaries from employee records.
    *   Edit allowances and deductions inline; net salary recalculates automatically (`net_salary = basic_salary + allowances - deductions`).
    *   Click **Mark as Paid** to record payment completion.
7.  **Job Applications** (`Applications` page):
    *   Track recruitment applicants by name, position, and application date.
    *   Update applicant status through the workflow: `Pending` → `Shortlisted` → `Hired` or `Rejected`.
8.  **Departments & Roles**:
    *   Maintain active departments and job titles.
    *   Changes reflect immediately in the employee creation and editing forms.
9.  **Logout**:
    *   Click your user profile in the top-right corner and select **Sign Out**, or click **Logout** in the bottom sidebar.

---

## 11. Employee Portal – Step-by-Step Usage

1.  **Login**:
    *   Navigate to `http://localhost:5173`.
    *   Select the **Employee** role tab.
    *   Enter `shiv@emplox.com` and `employee123`.
2.  **Dashboard Header**:
    *   View your employee name, ID (`EMP001`), department, designation, and a live Indian Standard Time (IST) clock.
3.  **Mark Present (Check-In)**:
    *   On the **Attendance** tab, click **Mark Present**.
    *   If checked in at or before `09:10:00 AM IST`, attendance status is recorded as **`Present`**.
    *   If checked in after `09:10:00 AM IST`, attendance status is recorded as **`Late`**.
    *   Once marked, the check-in time and status badge are prominently displayed. Duplicate mark attempts on the same day are prevented.
4.  **Check Out**:
    *   Click **Check Out** at the end of your workday.
    *   Your departure time is saved.
    *   If you check out after `07:10:00 PM IST`, overtime minutes are automatically calculated and logged.
    *   You cannot check out more than once per day.
5.  **View Attendance History**:
    *   Review past attendance records in the data table showing Date, Day, Status badge (`Present`, `Late`, `On Leave`, `Absent`), Check-In time, Check-Out time, and Overtime earned.
6.  **Apply for Leave** (`Leave Requests` tab):
    *   Switch to the **Leave Requests** tab.
    *   Select **Leave Type** (`Casual Leave`, `Sick Leave`, `Earned Leave`, `Unpaid Leave`).
    *   Choose **Start Date** and **End Date** (days count calculates automatically).
    *   Provide an optional reason and click **Submit Leave Request**.
7.  **Track Leave History**:
    *   View real-time status badges for all past requests:
        *   <span style="color:#d97706; font-weight:bold;">Pending</span>: Awaiting Admin review.
        *   <span style="color:#16a34a; font-weight:bold;">Approved</span>: Authorized by Admin (reflected in attendance as "On Leave").
        *   <span style="color:#dc2626; font-weight:bold;">Rejected</span>: Declined by Admin.
8.  **Logout**:
    *   Click the **Sign Out** button in the top navigation bar.

---

## 12. Attendance Rules & Business Logic

All attendance timestamps and calculations adhere strictly to **Indian Standard Time (IST, UTC+05:30)**:

| Business Rule | Implementation Logic | System Action |
| :--- | :--- | :--- |
| **Arrival Cutoff** | Current time $\le$ `09:10:00 AM IST` | Status set to **`Present`** |
| **Late Arrival** | Current time $>$ `09:10:00 AM IST` | Status set to **`Late`** |
| **Duplicate Check-In** | Record exists for `(employee_id, today)` | Request rejected with `400 Bad Request` |
| **Pre-Check-In Checkout** | Check-out called without prior check-in | Request rejected with `400 Bad Request` |
| **Duplicate Checkout** | `check_out` timestamp already exists | Request rejected with `400 Bad Request` |
| **Standard Departure** | Checkout $\le$ `07:10:00 PM IST` | `overtime_minutes` = `0` *(Buffer between 18:10 and 19:10 is uncredited)* |
| **Overtime Departure** | Checkout $>$ `07:10:00 PM IST` (`19:10:00`) | `overtime_minutes = Math.floor((checkoutTime - 19:10:00) / 60000)` |
| **Approved Leave Conflict** | Leave is approved for `[start_date, end_date]` | Attendance updated to **`On Leave`**; `check_in` & `check_out` cleared |

---

## 13. Leave Workflow

```text
[ Employee Portal ]
       │
       ▼
 1. Submit Leave Request ──► status: 'Pending', applied_on: Today (IST)
                                     │
                                     ▼
                          [ Database: leave_requests ]
                                     │
                                     ▼
                            [ Admin Portal ]
                         Reviews request details
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
              [ Approve ]                        [ Reject ]
                    │                                 │
                    ▼                                 ▼
   status: 'Approved'                status: 'Rejected'
   reviewed_on: Today (IST)          reviewed_on: Today (IST)
   Synchronizes Attendance:                           │
   For each day in range:                             │
     attendance.status = 'On Leave'                   │
     check_in = NULL, check_out = NULL                │
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                         [ Employee Portal ]
                     Employee sees updated status
```

---

## 14. Complete Test Flow (End-to-End Walkthrough)

To verify the complete system functionality from a fresh start:

1.  **Start MySQL**: Ensure MySQL is running on port 3306.
2.  **Start Backend**: In Terminal 1, run `cd server && npm start`.
3.  **Start Frontend**: In Terminal 2, run `npm run dev`.
4.  **Login as Employee**:
    *   Open `http://localhost:5173`.
    *   Login with `sani@emplox.com` / `employee123`.
5.  **Mark Attendance**:
    *   Click **Mark Present**. Verify your status updates to `Present` (or `Late` if past 9:10 AM IST).
6.  **Apply for Leave**:
    *   Switch to the **Leave Requests** tab.
    *   Apply for tomorrow's date with reason "Personal errands".
    *   Verify the request appears in Leave History with status `Pending`.
7.  **Sign Out**: Click **Sign Out** in the top navigation.
8.  **Login as Admin**:
    *   Login with `admin@emplox.com` / `admin123`.
9.  **Inspect Dashboard**:
    *   Verify the employee's attendance is reflected under `Present Today` (or `Late Today`) and `Pending Leaves` has incremented.
10. **Approve Leave**:
    *   Navigate to **Leave** from the sidebar.
    *   Locate Saniya Sahoo's pending request. Click **Approve**.
    *   Verify the status turns green to `Approved`.
11. **Check Attendance Synchronization**:
    *   Navigate to **Attendance**. Change the date filter to tomorrow.
    *   Verify Saniya Sahoo has an automatic entry marked as **`On Leave`**.
12. **Verify as Employee**:
    *   Log out and log back in as `sani@emplox.com`.
    *   Switch to the Leave tab and confirm your request status displays as **`Approved`**.

---

## 15. Troubleshooting

### 1. `mysql` is not recognized as an internal or external command
*   **Cause**: MySQL binary path is not in Windows system `PATH`.
*   **Fix**: Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your environment PATH variable, or open the **MySQL 8.0 Command Line Client** from the Windows Start menu.

### 2. `ER_ACCESS_DENIED_ERROR` (Access denied for user 'root'@'localhost')
*   **Cause**: Incorrect password in `server/.env`.
*   **Fix**: Run `.\SETUP_EMPLOX.bat` and enter your valid MySQL root password, or manually edit `DB_PASSWORD` in `server\.env`.

### 3. `ECONNREFUSED 127.0.0.1:3306`
*   **Cause**: MySQL Server service is stopped.
*   **Fix**: Open PowerShell as Administrator and run:
    ```powershell
    Start-Service -Name MySQL80
    ```
    *(Replace `MySQL80` with your installed MySQL service name)*

### 4. Port 5000 is already in use
*   **Cause**: Another process or background instance of `server.js` is holding port 5000.
*   **Fix**: Find and kill the process using port 5000:
    ```powershell
    netstat -ano | findstr :5000
    Stop-Process -Id <PID_FROM_OUTPUT> -Force
    ```

### 5. "No employee is linked to this user"
*   **Cause**: The user logged in with role `Employee`, but `employee_id` in the `users` table is `NULL`.
*   **Fix**: Link the user to an existing employee ID in MySQL:
    ```sql
    UPDATE users SET employee_id = 4 WHERE email = 'sani@emplox.com';
    ```

### 6. 401 Unauthorized / Token Expired
*   **Cause**: The 8-hour JWT token has expired or `JWT_SECRET` in `server/.env` was modified.
*   **Fix**: Log out and log back in to generate a fresh JWT token.

### 7. CORS Error / API Connection Refused
*   **Cause**: Frontend is running, but the backend is stopped or running on a non-default port.
*   **Fix**: Ensure `node server.js` is running on `http://localhost:5000`. Test via browser: `http://localhost:5000/api/health`. It must return `{"ok": true, "database": "connected"}`.

---

## 16. Useful Database Verification Commands

Safe MySQL queries to check system status:

```sql
USE employee_management;

-- 1. Check all registered database tables
SHOW TABLES;

-- 2. Inspect users and roles
SELECT id, email, role, employee_id FROM users;

-- 3. Inspect employees
SELECT id, employee_code, first_name, last_name, email, department, role, status FROM employees;

-- 4. Check today's attendance records
SELECT a.id, e.employee_code, CONCAT(e.first_name, ' ', e.last_name) AS name, 
       a.date, a.status, a.check_in, a.check_out, a.overtime_minutes
FROM attendance a
JOIN employees e ON e.id = a.employee_id
WHERE a.date = CURDATE();

-- 5. Inspect leave requests
SELECT l.id, e.employee_code, l.leave_type, l.start_date, l.end_date, l.days, l.status, l.applied_on, l.reviewed_on
FROM leave_requests l
JOIN employees e ON e.id = l.employee_id
ORDER BY l.id DESC;

-- 6. Check current month's payroll
SELECT p.id, e.employee_code, p.payroll_month, p.basic_salary, p.allowances, p.deductions, p.net_salary, p.status
FROM payroll p
JOIN employees e ON e.id = p.employee_id;
```

---

## 17. Development Commands

### Frontend (`package.json` at project root)
*   **`npm run dev`**: Launches the Vite development server at `http://localhost:5173` with Hot Module Replacement (HMR).
*   **`npm run build`**: Compiles production assets into the `dist/` directory.
*   **`npm run preview`**: Serves the production build locally for verification.

### Backend (`server/package.json`)
*   **`npm start`**: Runs the backend server via `node server.js`.
*   **`npm run dev`**: Runs the backend server with `nodemon` for auto-restarting on file modifications.

---

## 18. Security Notes

*   **Environment Secrets**: Never commit `server/.env` to Git repositories. Keep your database passwords and `JWT_SECRET` confidential.
*   **Password Hashing**: User passwords are encrypted using `bcryptjs` with salt round 10 before storage. Raw passwords are never stored in the database.
*   **Role-Based Authorization**: Every protected endpoint enforces token authentication (`authenticateToken`). Administrative operations (modifying employees, reviewing leaves, updating payroll, configuring roles/departments) strictly enforce `requireAdmin`.
*   **Production Deployment**: Before publishing to a production server:
    *   Change the default admin password (`admin123`).
    *   Generate a long, random cryptographic string for `JWT_SECRET`.
    *   Restrict CORS origin in `server.js` from `app.use(cors())` to your specific production frontend domain.

---

## 19. Quick Start Checklist

1. [ ] **MySQL**: Confirm MySQL Server is running on port `3306`.
2. [ ] **Database**: Create database `employee_management` and import `database/employee_management.sql`.
3. [ ] **Environment**: Run `.\SETUP_EMPLOX.bat` to set up `server/.env` with your MySQL password.
4. [ ] **Dependencies**: Run `npm install` in both the root folder and `server/` folder.
5. [ ] **Launch**: Run `.\START_EMPLOX.bat` (or start backend with `npm start` and frontend with `npm run dev`).
6. [ ] **Test Admin**: Login at `http://localhost:5173` with `admin@emplox.com` / `admin123`.
7. [ ] **Test Employee**: Login at `http://localhost:5173` with `shiv@emplox.com` / `employee123`.
