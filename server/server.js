const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from the server folder
dotenv.config({
    path: path.join(__dirname, ".env")
});

const db = require("./db");

const app = express();
// Protect login against repeated password attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,                // Maximum 10 attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

const PORT = process.env.PORT || 5000;
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid token payload"
            });
        }

        // Get the latest user information from the database

        const [users] = await db.query(
            `SELECT
        u.id,
        u.email,
        u.role,
        u.employee_id,
        e.status AS employee_status
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.id = ?`,
            [userId]
        );

        if (!users.length) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        const currentUser = users[0];

        if (
            currentUser.role === "Employee" &&
            currentUser.employee_status !== "Active"
        ) {
            return res.status(403).json({
                message: "Your employee account is inactive. Please contact the administrator."
            });
        }

        req.user = users[0];
        next();

    } catch (error) {
        console.error("Authentication error:", error);

        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({
            message: "Access denied. Administrator privileges required."
        });
    }
    next();
};

// IST Date helper to ensure business date follows Indian Standard Time (UTC+05:30)
const getISTDate = () => {
    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + istOffset);
    return istDate.toISOString().slice(0, 10);
};

const getISTTimeString = () => {
    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + istOffset);
    return istDate.toTimeString().slice(0, 8);
};


// Middleware
app.use(cors());
app.use(express.json());

// Health check used to verify that the correct backend is running.
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ ok: true, message: "EMPLOX API is healthy", database: "connected" });
    } catch (error) {
        console.error("Health check database error:", error);
        res.status(500).json({ ok: false, message: "EMPLOX API is running but database is not connected" });
    }
});

// Create the HR module tables automatically if they do not exist.
async function initializeTables() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            leave_type VARCHAR(50) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days INT NOT NULL,
            reason VARCHAR(500),
            status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
            applied_on DATE NOT NULL,
            reviewed_on DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS payroll (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            payroll_month CHAR(7) NOT NULL,
            basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
            allowances DECIMAL(12,2) NOT NULL DEFAULT 0,
            deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
            net_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
            status ENUM('Pending','Paid') NOT NULL DEFAULT 'Pending',
            paid_on DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_employee_month (employee_id, payroll_month),
            CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            applicant_name VARCHAR(120) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(30),
            position VARCHAR(100) NOT NULL,
            applied_date DATE NOT NULL,
            status ENUM('Pending','Shortlisted','Rejected','Hired') NOT NULL DEFAULT 'Pending',
            notes VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    // Departments table
    await db.query(`
        CREATE TABLE IF NOT EXISTS departments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description VARCHAR(255),
            status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    // Roles table
    await db.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description VARCHAR(255),
            status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);

    await db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Employee') NOT NULL,
        employee_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_employee
            FOREIGN KEY (employee_id)
            REFERENCES employees(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB;
`);

    // Ensure overtime_minutes exists on attendance table
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM attendance LIKE 'overtime_minutes'");
        if (!cols.length) {
            await db.query("ALTER TABLE attendance ADD COLUMN overtime_minutes INT DEFAULT 0");
            console.log("Added missing column overtime_minutes to attendance table");
        }
    } catch (err) {
        console.error("Migration check for overtime_minutes:", err.message);
    }

    // Create default admin account if it does not exist.
    const [adminUsers] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        ["admin@emplox.com"]
    );

    if (!adminUsers.length) {
        const passwordHash = await bcrypt.hash("admin123", 10);

        await db.query(
            `INSERT INTO users (email, password_hash, role, employee_id)
             VALUES (?, ?, 'Admin', NULL)`,
            ["admin@emplox.com", passwordHash]
        );

        console.log("Default admin account created: admin@emplox.com");
    }

    // Ensure default employee accounts exist for sample employees
    const defaultEmployees = [
        { email: "shiv@emplox.com", employeeCode: "EMP001" },
    ];

    for (const emp of defaultEmployees) {
        const [existing] = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", [emp.email]);
        if (!existing.length) {
            // Find corresponding employee_id from employees table
            const [matchedEmp] = await db.query(
                "SELECT id FROM employees WHERE LOWER(email) = LOWER(?) OR employee_code = ? LIMIT 1",
                [emp.email, emp.employeeCode]
            );

            if (matchedEmp.length) {
                const empPasswordHash = await bcrypt.hash("employee123", 10);
                await db.query(
                    `INSERT INTO users (email, password_hash, role, employee_id)
                     VALUES (?, ?, 'Employee', ?)`,
                    [emp.email, empPasswordHash, matchedEmp[0].id]
                );
                console.log(`Default employee account created: ${emp.email} (employee_id: ${matchedEmp[0].id})`);
            }
        }
    }
}

// =========================
// AUTHENTICATION
// =========================

app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {

        const { email, password } = req.body || {};

        // Validate email and password
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                message: "Password is too long"
            });
        }


        const [users] = await db.query(
            `
            SELECT
                u.id,
                u.email,
                u.password_hash,
                u.role,
                u.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.department,
                e.role AS employee_role, e.status AS employee_status
            FROM users u
            LEFT JOIN employees e
                ON e.id = u.employee_id
            WHERE LOWER(u.email) = LOWER(?)
            LIMIT 1
            `,
            [cleanEmail]
        );

        if (!users.length) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];
        // Block inactive employee accounts
        if (
            user.role === "Employee" &&
            user.employee_status !== "Active"
        ) {
            return res.status(403).json({
                message: "Your employee account is inactive. Please contact the administrator."
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                userId: user.id,
                role: user.role,
                employee_id: user.employee_id,
                employeeId: user.employee_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id,
                employee_code: user.employee_code || null,
                first_name: user.first_name || null,
                last_name: user.last_name || null,
                department: user.department || null,
                employee_role: user.employee_role || null
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});


// Test server + database
app.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            message: "Employee Management System API is running",
            database: rows[0].connected === 1
                ? "connected"
                : "not connected"
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Server is running but database connection failed"
        });
    }
});


// Get all employees
app.get("/api/employees", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT
                id,
                employee_code,
                first_name,
                last_name,
                email,
                phone,
                gender,
                date_of_birth,
                joining_date,
                department,
                role,
                employment_type,
                salary,
                status,
                created_at
            FROM employees
            ORDER BY id ASC
        `);

        res.json(employees);

    } catch (error) {
        console.error("Error fetching employees:", error);

        res.status(500).json({
            message: "Failed to fetch employees"
        });
    }
});


// Get one employee by ID (Admin only)
app.get("/api/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        const [employees] = await db.query(
            `SELECT
                id,
                employee_code,
                first_name,
                last_name,
                email,
                phone,
                gender,
                date_of_birth,
                joining_date,
                department,
                role,
                employment_type,
                salary,
                status,
                created_at,
                updated_at
             FROM employees
             WHERE id = ?`,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        res.json(employees[0]);

    } catch (error) {
        console.error("Error fetching employee:", error);

        res.status(500).json({
            message: "Failed to fetch employee details"
        });
    }
});

// Add employee
app.post("/api/employees", authenticateToken, requireAdmin, async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            gender,
            date_of_birth,
            joining_date,
            department,
            role,
            employment_type,
            salary,
            status
        } = req.body;

        if (!employee_code || !first_name || !last_name || !email || !joining_date) {
            return res.status(400).json({
                message: "Employee Code, First Name, Last Name, Email and Joining Date are required"
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO employees
            (employee_code, first_name, last_name, email, phone, gender, date_of_birth,
             joining_date, department, role, employment_type, salary, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_code.trim(),
                first_name.trim(),
                last_name.trim(),
                email.trim().toLowerCase(),
                phone || null,
                gender || null,
                date_of_birth || null,
                joining_date,
                department || null,
                role || null,
                employment_type || "Full-Time",
                salary === "" || salary == null ? null : Number(salary),
                status || "Active"
            ]
        );

        const today = getISTDate();

        await connection.query(
            `INSERT INTO attendance (employee_id, date, status)
             VALUES (?, ?, 'Absent')`,
            [result.insertId, today]
        );

        await connection.commit();

        const [rows] = await db.query(
            `SELECT id, employee_code, first_name, last_name, email, phone, gender,
                    date_of_birth, joining_date, department, role, employment_type,
                    salary, status, created_at
             FROM employees WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: "Employee added successfully",
            employee: rows[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding employee:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Employee code or email already exists"
            });
        }

        res.status(500).json({
            message: "Failed to add employee: " + error.message
        });
    } finally {
        connection.release();
    }
});

// Update employee
app.put("/api/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            email,
            phone,
            gender,
            date_of_birth,
            joining_date,
            department,
            role,
            employment_type,
            salary,
            status
        } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                message: "First Name, Last Name and Email are required"
            });
        }

        const [result] = await db.query(
            `UPDATE employees SET
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                gender = ?,
                date_of_birth = ?,
                joining_date = ?,
                department = ?,
                role = ?,
                employment_type = ?,
                salary = ?,
                status = ?
             WHERE id = ?`,
            [
                first_name.trim(),
                last_name.trim(),
                email.trim().toLowerCase(),
                phone || null,
                gender || null,
                date_of_birth || null,
                joining_date || null,
                department || null,
                role || null,
                employment_type || "Full-Time",
                salary === "" || salary == null ? null : Number(salary),
                status || "Active",
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [id]);
        res.json({ message: "Employee updated successfully", employee: rows[0] });

    } catch (error) {
        console.error("Error updating employee:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Failed to update employee: " + error.message });
    }
});

// Deactivate employee (safe soft delete to preserve historical records)
app.delete("/api/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            "UPDATE employees SET status = 'Inactive' WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deactivated successfully" });
    } catch (error) {
        console.error("Error deactivating employee:", error);
        res.status(500).json({ message: "Failed to deactivate employee" });
    }
});

// Activate or deactivate an employee (Admin only)
app.patch("/api/employees/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const { status } = req.body;

        // Validate employee ID
        if (!Number.isInteger(employeeId) || employeeId <= 0) {
            return res.status(400).json({
                message: "Invalid employee ID"
            });
        }

        // Only allow these two statuses
        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Active or Inactive"
            });
        }

        // Check whether employee exists
        const [employees] = await db.query(
            "SELECT id FROM employees WHERE id = ?",
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        // Update employee status
        await db.query(
            "UPDATE employees SET status = ? WHERE id = ?",
            [status, employeeId]
        );

        res.json({
            message: `Employee ${status === "Active" ? "activated" : "deactivated"} successfully`,
            employeeId,
            status
        });

    } catch (error) {
        console.error("Error updating employee status:", error);

        res.status(500).json({
            message: "Failed to update employee status"
        });
    }
});

// Get dashboard statistics
app.get("/api/dashboard-stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const today = getISTDate();

        const [employeeResult] = await db.query(`
            SELECT COUNT(*) AS totalEmployees
            FROM employees
            WHERE status = 'Active'
        `);

        const [attendanceResult] = await db.query(`
            SELECT
                COALESCE(SUM(a.status = 'Present'), 0) AS presentToday,
                COALESCE(SUM(a.status = 'On Leave'), 0) AS onLeave,
                COALESCE(SUM(a.status = 'Late'), 0) AS lateToday,
                COALESCE(SUM(a.status = 'Absent'), 0) AS absentToday,
                COALESCE(SUM(a.overtime_minutes), 0) AS totalOvertimeMinutes
            FROM attendance a
            INNER JOIN employees e ON e.id = a.employee_id
            WHERE a.date = ? AND e.status = 'Active'
        `, [today]);


        const [pendingLeavesResult] = await db.query(`
            SELECT COUNT(*) AS pendingLeaves
            FROM leave_requests
            WHERE status = 'Pending'
        `);

        const stats = attendanceResult[0] || {};

        res.json({
            totalEmployees: Number(employeeResult[0].totalEmployees),
            presentToday: Number(stats.presentToday || 0),
            onLeave: Number(stats.onLeave || 0),
            lateToday: Number(stats.lateToday || 0),
            absentToday: Number(stats.absentToday || 0),
            totalOvertimeMinutes: Number(stats.totalOvertimeMinutes || 0),
            pendingLeaves: Number(pendingLeavesResult[0].pendingLeaves || 0)
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
});

// Get attendance records
app.get("/api/attendance", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { employee_id, date, date_from, date_to, status } = req.query;

        const conditions = [];
        const params = [];

        if (employee_id) { conditions.push("a.employee_id = ?"); params.push(employee_id); }
        if (date) { conditions.push("a.date = ?"); params.push(date); }
        if (date_from) { conditions.push("a.date >= ?"); params.push(date_from); }
        if (date_to) { conditions.push("a.date <= ?"); params.push(date_to); }
        if (status) { conditions.push("a.status = ?"); params.push(status); }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [attendance] = await db.query(`
            SELECT
                a.id,
                a.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.department,
                e.role,
                a.date,
                a.status,
                a.check_in,
                a.check_out,
                a.overtime_minutes
            FROM attendance a
            INNER JOIN employees e ON a.employee_id = e.id
            ${whereClause}
            ORDER BY a.date DESC, a.id ASC
        `, params);

        res.json(attendance);

    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Failed to fetch attendance records" });
    }
});

// Add attendance record
app.post("/api/attendance", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            employee_id,
            date,
            status,
            check_in,
            check_out
        } = req.body;

        if (!employee_id || !date || !status) {
            return res.status(400).json({
                message: "Employee, date and status are required"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO attendance
            (
                employee_id,
                date,
                status,
                check_in,
                check_out
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                employee_id,
                date,
                status,
                check_in || null,
                check_out || null
            ]
        );

        res.status(201).json({
            message: "Attendance added successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Error adding attendance:", error);

        res.status(500).json({
            message: "Failed to add attendance"
        });
    }
});

// Update attendance record
app.put("/api/attendance/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const {
            status,
            check_in,
            check_out
        } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        const [result] = await db.query(
            `
            UPDATE attendance
            SET
                status = ?,
                check_in = ?,
                check_out = ?
            WHERE id = ?
            `,
            [
                status,
                check_in || null,
                check_out || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Attendance record not found"
            });
        }

        res.json({
            message: "Attendance updated successfully"
        });

    } catch (error) {
        console.error("Error updating attendance:", error);

        res.status(500).json({
            message: "Failed to update attendance"
        });
    }
});

// ==================== EMPLOYEE ATTENDANCE ====================

// Employee: Mark Present
app.post("/api/employee/attendance/present", authenticateToken, async (req, res) => {
    try {
        // Only employees can use this route
        if (req.user.role !== "Employee") {
            return res.status(403).json({
                message: "Only employees can mark their attendance"
            });
        }

        const employeeId = req.user.employee_id;

        if (!employeeId) {
            return res.status(400).json({
                message: "No employee is linked to this user"
            });
        }

        // Get today's date and current time in IST
        const date = getISTDate();
        const currentTime = getISTTimeString();

        // 9:10 AM cutoff
        const cutoffTime = "09:10:00";
        const status = currentTime <= cutoffTime ? "Present" : "Late";

        // Check whether attendance already exists
        const [existing] = await db.query(
            "SELECT * FROM attendance WHERE employee_id = ? AND date = ?",
            [employeeId, date]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Attendance has already been marked for today",
                attendance: existing[0]
            });
        }

        // Create attendance record
        const [result] = await db.query(
            `INSERT INTO attendance
            (employee_id, date, status, check_in, overtime_minutes)
            VALUES (?, ?, ?, ?, 0)`,
            [employeeId, date, status, currentTime]
        );

        const [rows] = await db.query(
            "SELECT * FROM attendance WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            message: status === "Present"
                ? "Attendance marked successfully"
                : "Attendance marked as Late",
            attendance: rows[0]
        });

    } catch (error) {
        console.error("Employee mark present error:", error);

        res.status(500).json({
            message: "Failed to mark attendance",
            error: error.message
        });
    }
});


// Employee: Check Out
app.post("/api/employee/attendance/checkout", authenticateToken, async (req, res) => {
    try {
        // Only employees can check out
        if (req.user.role !== "Employee") {
            return res.status(403).json({
                message: "Only employees can check out"
            });
        }

        const employeeId = req.user.employee_id;

        if (!employeeId) {
            return res.status(400).json({
                message: "No employee is linked to this user"
            });
        }

        const date = getISTDate();
        const currentTime = getISTTimeString();

        // Find today's attendance
        const [rows] = await db.query(
            "SELECT * FROM attendance WHERE employee_id = ? AND date = ?",
            [employeeId, date]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                message: "Please mark your attendance first"
            });
        }

        const attendance = rows[0];

        if (!attendance.check_in) {
            return res.status(400).json({
                message: "Please mark your attendance first"
            });
        }

        if (attendance.check_out) {
            return res.status(400).json({
                message: "You have already checked out today"
            });
        }

        /*
         * Official overtime starts after 7:10 PM.
         * Time between 6:10 PM and 7:10 PM
         * is NOT counted as overtime.
         */
        const overtimeStart = new Date(`${date}T19:10:00+05:30`);
        const checkoutTime = new Date(`${date}T${currentTime}+05:30`);

        let overtimeMinutes = 0;

        if (checkoutTime > overtimeStart) {
            overtimeMinutes = Math.floor(
                (checkoutTime - overtimeStart) / (1000 * 60)
            );
        }

        // Save checkout + overtime
        await db.query(
            `UPDATE attendance
             SET check_out = ?, overtime_minutes = ?
             WHERE id = ?`,
            [currentTime, overtimeMinutes, attendance.id]
        );

        const [updated] = await db.query(
            "SELECT * FROM attendance WHERE id = ?",
            [attendance.id]
        );

        res.json({
            message: "Checked out successfully",
            attendance: updated[0]
        });

    } catch (error) {
        console.error("Employee checkout error:", error);

        res.status(500).json({
            message: "Failed to check out",
            error: error.message
        });
    }
});


// Employee: View Own Attendance
app.get("/api/employee/attendance", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "Employee") {
            return res.status(403).json({
                message: "Only employees can access this"
            });
        }

        const employeeId = req.user.employee_id;

        const [rows] = await db.query(
            `SELECT *
             FROM attendance
             WHERE employee_id = ?
             ORDER BY date DESC`,
            [employeeId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Employee attendance fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch attendance",
            error: error.message
        });
    }
});

// Employee: Apply for Leave
app.post("/api/employee/leave", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "Employee") {
            return res.status(403).json({ message: "Only employees can apply for leave" });
        }

        const employeeId = req.user.employee_id;
        if (!employeeId) {
            return res.status(400).json({ message: "No employee is linked to this account" });
        }

        const { leave_type, start_date, end_date, reason } = req.body;
        if (!leave_type || !start_date || !end_date) {
            return res.status(400).json({ message: "Leave type, start date and end date are required" });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid dates provided" });
        }

        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (days < 1) {
            return res.status(400).json({ message: "End date must be on or after start date" });
        }

        const todayIST = getISTDate();
        const [result] = await db.query(
            `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason, status, applied_on)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
            [employeeId, leave_type, start_date, end_date, days, reason || null, todayIST]
        );

        const [created] = await db.query(
            "SELECT * FROM leave_requests WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({
            message: "Leave request submitted successfully",
            leave: created[0]
        });

    } catch (error) {
        console.error("Employee submit leave error:", error);
        res.status(500).json({ message: "Failed to submit leave request", error: error.message });
    }
});

// Employee: View Own Leave History
app.get("/api/employee/leave", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "Employee") {
            return res.status(403).json({ message: "Only employees can access this route" });
        }

        const employeeId = req.user.employee_id;
        if (!employeeId) {
            return res.status(400).json({ message: "No employee is linked to this account" });
        }

        const [rows] = await db.query(
            `SELECT id, employee_id, leave_type, start_date, end_date, days, reason, status, applied_on, reviewed_on, created_at
             FROM leave_requests
             WHERE employee_id = ?
             ORDER BY created_at DESC, id DESC`,
            [employeeId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Employee leave fetch error:", error);
        res.status(500).json({ message: "Failed to fetch leave history", error: error.message });
    }
});

// =========================
// LEAVE REQUESTS (ADMIN)
// =========================
app.get("/api/leave", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.*, e.employee_code,
                   CONCAT(e.first_name, ' ', e.last_name) AS employee_name
            FROM leave_requests l
            INNER JOIN employees e ON e.id = l.employee_id
            ORDER BY l.start_date DESC, l.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching leave requests:", error);
        res.status(500).json({ message: "Failed to fetch leave requests" });
    }
});

app.post("/api/leave", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, days, reason } = req.body;
        if (!employee_id || !leave_type || !start_date || !end_date) {
            return res.status(400).json({ message: "Employee, leave type, start date and end date are required" });
        }
        const calculatedDays = Number(days) || Math.floor((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
        if (calculatedDays < 1) return res.status(400).json({ message: "End date must be on or after start date" });

        const todayIST = getISTDate();
        const [result] = await db.query(`
            INSERT INTO leave_requests
            (employee_id, leave_type, start_date, end_date, days, reason, status, applied_on)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
        `, [employee_id, leave_type, start_date, end_date, calculatedDays, reason || null, todayIST]);

        res.status(201).json({ message: "Leave request submitted", id: result.insertId });
    } catch (error) {
        console.error("Error creating leave request:", error);
        res.status(500).json({ message: "Failed to create leave request" });
    }
});

app.put("/api/leave/:id", authenticateToken, requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["Approved", "Rejected", "Pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid leave status" });
        }

        await connection.beginTransaction();
        const [rows] = await connection.query("SELECT * FROM leave_requests WHERE id = ?", [id]);
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Leave request not found" });
        }
        const leave = rows[0];

        const todayIST = getISTDate();
        await connection.query(
            "UPDATE leave_requests SET status = ?, reviewed_on = CASE WHEN ? = 'Pending' THEN NULL ELSE ? END WHERE id = ?",
            [status, status, todayIST, id]
        );

        if (status === "Approved") {
            const startD = new Date(leave.start_date);
            const endD = new Date(leave.end_date);
            const cur = new Date(startD);
            while (cur <= endD) {
                const dateStr = cur.toISOString().slice(0, 10);
                await connection.query(`
                    INSERT INTO attendance (employee_id, date, status)
                    VALUES (?, ?, 'On Leave')
                    ON DUPLICATE KEY UPDATE status = 'On Leave', check_in = NULL, check_out = NULL
                `, [leave.employee_id, dateStr]);
                cur.setDate(cur.getDate() + 1);
            }
        }

        await connection.commit();
        res.json({ message: `Leave request ${status.toLowerCase()}` });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating leave request:", error);
        res.status(500).json({ message: "Failed to update leave request" });
    } finally {
        connection.release();
    }
});

// =========================
// PAYROLL
// =========================
app.get("/api/payroll", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const month = req.query.month || getISTDate().slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ message: "Month must be YYYY-MM" });
        const [rows] = await db.query(`
            SELECT p.*, e.employee_code,
                   CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                   e.department, e.role
            FROM payroll p
            INNER JOIN employees e ON e.id = p.employee_id
            WHERE p.payroll_month = ?
            ORDER BY e.id ASC
        `, [month]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching payroll:", error);
        res.status(500).json({ message: "Failed to fetch payroll" });
    }
});


app.post("/api/payroll/run", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const month = req.body.month;

        // Validate the payroll month
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
            return res.status(400).json({
                message: "Invalid month. Please use YYYY-MM format."
            });
        }

        // Get all active employees
        const [employees] = await db.query(
            "SELECT id, salary FROM employees WHERE status = 'Active'"
        );

        let generatedCount = 0;
        let skippedCount = 0;

        for (const employee of employees) {
            const basic = Number(employee.salary || 0);

            // Insert new payroll records only.
            // Existing records are preserved without changing their values.
            const [result] = await db.query(
                `INSERT INTO payroll
                    (employee_id, payroll_month, basic_salary,
                     allowances, deductions, net_salary, status)
                 VALUES (?, ?, ?, 0, 0, ?, 'Pending')
                 ON DUPLICATE KEY UPDATE id = id`,
                [employee.id, month, basic, basic]
            );

            if (result.affectedRows === 1) {
                generatedCount++;
            } else {
                skippedCount++;
            }
        }

        res.json({
            message: `Payroll processing completed for ${month}`,
            totalEmployees: employees.length,
            generated: generatedCount,
            skipped: skippedCount
        });

    } catch (error) {
        console.error("Error running payroll:", error);

        res.status(500).json({
            message: "Failed to run payroll"
        });
    }
});

app.put("/api/payroll/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { allowances = 0, deductions = 0, status } = req.body;
        const [rows] = await db.query("SELECT basic_salary FROM payroll WHERE id = ?", [id]);
        if (!rows.length) return res.status(404).json({ message: "Payroll record not found" });
        const basic = Number(rows[0].basic_salary || 0);
        const allowanceValue = Number(allowances) || 0;
        const deductionValue = Number(deductions) || 0;
        const newStatus = status || "Pending";
        if (!["Pending", "Paid"].includes(newStatus)) return res.status(400).json({ message: "Invalid payroll status" });
        await db.query(`
            UPDATE payroll
            SET allowances = ?, deductions = ?, net_salary = ?, status = ?, paid_on = CASE WHEN ? = 'Paid' THEN CURDATE() ELSE NULL END
            WHERE id = ?
        `, [allowanceValue, deductionValue, basic + allowanceValue - deductionValue, newStatus, newStatus, id]);
        res.json({ message: "Payroll updated" });
    } catch (error) {
        console.error("Error updating payroll:", error);
        res.status(500).json({ message: "Failed to update payroll" });
    }
});

// =========================
// JOB APPLICATIONS
// =========================
app.get("/api/applications", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM applications ORDER BY applied_date DESC, id DESC");
        res.json(rows);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
    }
});

app.post("/api/applications", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { applicant_name, email, phone, position, applied_date, notes } = req.body;
        if (!applicant_name || !email || !position || !applied_date) {
            return res.status(400).json({ message: "Name, email, position and applied date are required" });
        }
        const [result] = await db.query(`
            INSERT INTO applications (applicant_name, email, phone, position, applied_date, status, notes)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?)
        `, [applicant_name.trim(), email.trim().toLowerCase(), phone || null, position.trim(), applied_date, notes || null]);
        res.status(201).json({ message: "Application added", id: result.insertId });
    } catch (error) {
        console.error("Error creating application:", error);
        res.status(500).json({ message: "Failed to add application" });
    }
});

app.put("/api/applications/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        if (!["Pending", "Shortlisted", "Rejected", "Hired"].includes(status)) {
            return res.status(400).json({ message: "Invalid application status" });
        }
        const [result] = await db.query("UPDATE applications SET status = ?, notes = COALESCE(?, notes) WHERE id = ?", [status, notes ?? null, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: "Application not found" });
        res.json({ message: "Application updated" });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Failed to update application" });
    }
});

// =========================
// DEPARTMENTS
// =========================

// Get all departments
app.get("/api/departments", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                d.id,
                d.name,
                d.description,
                d.status,
                d.created_at,
                COUNT(e.id) AS employee_count
            FROM departments d
            LEFT JOIN employees e
                ON e.department = d.name
                AND e.status = 'Active'
            GROUP BY d.id
            ORDER BY d.name ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error fetching departments:", error);

        res.status(500).json({
            message: "Failed to fetch departments"
        });
    }
});


// Add department
app.post("/api/departments", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Department name is required"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO departments
            (name, description, status)
            VALUES (?, ?, ?)
            `,
            [
                name.trim(),
                description?.trim() || null,
                status || "Active"
            ]
        );

        res.status(201).json({
            message: "Department added successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Error adding department:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        res.status(500).json({
            message: "Failed to add department"
        });
    }
});


// Update department
app.put("/api/departments/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Department name is required"
            });
        }

        const [oldRows] = await db.query(
            "SELECT name FROM departments WHERE id = ?",
            [id]
        );

        if (!oldRows.length) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        const oldName = oldRows[0].name;
        const newName = name.trim();

        await db.query(
            `
            UPDATE departments
            SET name = ?, description = ?, status = ?
            WHERE id = ?
            `,
            [
                newName,
                description?.trim() || null,
                status || "Active",
                id
            ]
        );

        // Keep existing employees connected to the renamed department
        if (oldName !== newName) {
            await db.query(
                `
                UPDATE employees
                SET department = ?
                WHERE department = ?
                `,
                [newName, oldName]
            );
        }

        res.json({
            message: "Department updated successfully"
        });

    } catch (error) {
        console.error("Error updating department:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Department already exists"
            });
        }

        res.status(500).json({
            message: "Failed to update department"
        });
    }
});


// Delete department
app.delete("/api/departments/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT name FROM departments WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        const departmentName = rows[0].name;

        const [employees] = await db.query(
            `
            SELECT COUNT(*) AS count
            FROM employees
            WHERE department = ?
            `,
            [departmentName]
        );

        if (Number(employees[0].count) > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete this department because employees are assigned to it. Reassign them first."
            });
        }

        await db.query(
            "DELETE FROM departments WHERE id = ?",
            [id]
        );

        res.json({
            message: "Department deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting department:", error);

        res.status(500).json({
            message: "Failed to delete department"
        });
    }
});

// =========================
// ROLES
// =========================

// Get all roles
app.get("/api/roles", authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                r.id,
                r.name,
                r.description,
                r.status,
                r.created_at,
                COUNT(e.id) AS employee_count
            FROM roles r
            LEFT JOIN employees e
                ON e.role = r.name
                AND e.status = 'Active'
            GROUP BY r.id
            ORDER BY r.name ASC
        `);

        res.json(rows);

    } catch (error) {
        console.error("Error fetching roles:", error);

        res.status(500).json({
            message: "Failed to fetch roles"
        });
    }
});


// Add role
app.post("/api/roles", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Role name is required"
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO roles
            (name, description, status)
            VALUES (?, ?, ?)
            `,
            [
                name.trim(),
                description?.trim() || null,
                status || "Active"
            ]
        );

        res.status(201).json({
            message: "Role added successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Error adding role:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Role already exists"
            });
        }

        res.status(500).json({
            message: "Failed to add role"
        });
    }
});


// Update role
app.put("/api/roles/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Role name is required"
            });
        }

        const [oldRows] = await db.query(
            "SELECT name FROM roles WHERE id = ?",
            [id]
        );

        if (!oldRows.length) {
            return res.status(404).json({
                message: "Role not found"
            });
        }

        const oldName = oldRows[0].name;
        const newName = name.trim();

        await db.query(
            `
            UPDATE roles
            SET name = ?, description = ?, status = ?
            WHERE id = ?
            `,
            [
                newName,
                description?.trim() || null,
                status || "Active",
                id
            ]
        );

        // Keep existing employees connected to the renamed role
        if (oldName !== newName) {
            await db.query(
                `
                UPDATE employees
                SET role = ?
                WHERE role = ?
                `,
                [newName, oldName]
            );
        }

        res.json({
            message: "Role updated successfully"
        });

    } catch (error) {
        console.error("Error updating role:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Role already exists"
            });
        }

        res.status(500).json({
            message: "Failed to update role"
        });
    }
});


// Delete role
app.delete("/api/roles/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT name FROM roles WHERE id = ?",
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Role not found"
            });
        }

        const roleName = rows[0].name;

        const [employees] = await db.query(
            `
            SELECT COUNT(*) AS count
            FROM employees
            WHERE role = ?
            `,
            [roleName]
        );

        if (Number(employees[0].count) > 0) {
            return res.status(409).json({
                message:
                    "Cannot delete this role because employees are assigned to it. Reassign them first."
            });
        }

        await db.query(
            "DELETE FROM roles WHERE id = ?",
            [id]
        );

        res.json({
            message: "Role deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting role:", error);

        res.status(500).json({
            message: "Failed to delete role"
        });
    }
});

// Start server after the required tables exist.
initializeTables()
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log("========================================");
            console.log(`EMPLOX backend running on http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
            console.log("HR tables: leave_requests, payroll, applications");
            console.log("========================================");
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use.`);
                console.error(`Stop the old Node/EMPLOX server and run this server again.`);
            } else {
                console.error("Server error:", error);
            }
            process.exit(1);
        });
    })
    .catch((error) => {
        console.error("Database table initialization failed:", error);
        console.error(
            "Check server/.env and make sure MySQL is running and the employee_management database exists."
        );
        process.exit(1);
    });

