import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const navItems = [
    { key: "dashboard", icon: "▦", label: "Dashboard" },
    { key: "employees", icon: "♙", label: "Employees" },
    { key: "attendance", icon: "◷", label: "Attendance" },
    { key: "departments", icon: "▥", label: "Departments" },
    { key: "roles", icon: "◈", label: "Roles" },
    { key: "payroll", icon: "₹", label: "Payroll" },
    { key: "leave", icon: "▱", label: "On Leave" },
    { key: "applications", icon: "✉", label: "Pending Applications", badge: 8 }
];

function Login({ onLogin }) {
    const [show, setShow] = useState(false);

    return (
        <div className="login-page">
            <div className="login-art">
                <div className="brand large">
                    <span className="brand-mark">E</span>
                    <span>EMPLOX</span>
                </div>
                <div className="art-copy">
                    <p className="eyebrow">EMPLOYEE MANAGEMENT SYSTEM</p>
                    <h1>Manage your people.<br /><span>Grow your business.</span></h1>
                    <p>One simple workspace for employees, attendance, departments, payroll and leave management.</p>
                </div>
                <div className="art-card">
                    <div className="mini-avatar">AS</div>
                    <div>
                        <strong>Welcome back, Admin</strong>
                        <small>Everything is under control.</small>
                    </div>
                    <span className="green-dot"></span>
                </div>
            </div>

            <div className="login-panel">
                <div className="mobile-brand brand">
                    <span className="brand-mark">E</span><span>EMPLOX</span>
                </div>
                <div className="login-box">
                    <p className="eyebrow">ADMIN PORTAL</p>
                    <h2>Welcome back</h2>
                    <p className="muted">Sign in to access your employee dashboard.</p>

                    <label>Email address</label>
                    <div className="input-wrap">
                        <span>✉</span>
                        <input defaultValue="admin@emplox.com" type="email" />
                    </div>

                    <label>Password</label>
                    <div className="input-wrap">
                        <span>⌑</span>
                        <input defaultValue="admin123" type={show ? "text" : "password"} />
                        <button className="eye" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
                    </div>

                    <div className="login-options">
                        <label className="remember"><input type="checkbox" defaultChecked /> Remember me</label>
                        <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                    </div>

                    <button className="primary-btn full" onClick={onLogin}>Sign in to dashboard <span>→</span></button>
                    <p className="demo-note">Demo UI • Backend/API will be connected later with Node.js & Express</p>
                </div>
                <footer>© 2026 EMPLOX · Employee Management System</footer>
            </div>
        </div>
    );
}

function Sidebar({ active, setActive }) {
    return (
        <aside className="sidebar">
            <div className="brand">
                <span className="brand-mark">E</span><span>EMPLOX</span>
            </div>

            <div className="nav-section">
                <span className="nav-title">MAIN MENU</span>
                {navItems.map(item => (
                    <button
                        key={item.key}
                        className={`nav-item ${active === item.key ? "active" : ""}`}
                        onClick={() => setActive(item.key)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge && <b>{item.badge}</b>}
                    </button>
                ))}
            </div>

            <div className="sidebar-bottom">
                <div className="help-card">
                    <div className="help-icon">?</div>
                    <strong>Need help?</strong>
                    <small>Contact the system administrator.</small>
                    <button>Get support →</button>
                </div>
                <button className="logout" onClick={() => window.location.reload()}>↪ <span>Log out</span></button>
            </div>
        </aside>
    );
}

function Topbar({ active }) {
    const current = navItems.find(n => n.key === active)?.label || "Dashboard";
    return (
        <header className="topbar">
            <div>
                <div className="breadcrumb">EMPLOX <span>/</span> {current.toUpperCase()}</div>
                <h1>{current}</h1>
            </div>
            <div className="top-actions">
                <button className="icon-btn">⌕</button>
                <button className="icon-btn notification">♧<i></i></button>
                <div className="profile">
                    <div className="avatar">AS</div>
                    <div><strong>Admin Sharma</strong><small>Administrator</small></div>
                    <span>⌄</span>
                </div>
            </div>
        </header>
    );
}

function StatCard({ icon, title, value, change, detail, up }) {
    return (
        <div className="stat-card">
            <div className="stat-top">
                <div className="stat-icon">{icon}</div>
                <span className={up ? "positive" : "neutral"}>{change}</span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-title">{title}</div>
            <div className="stat-detail">{detail}</div>
        </div>
    );
}

function Dashboard() {
    const employees = [
        ["AS", "Ananya Sharma", "Product Designer", "Design", "Present"],
        ["RK", "Rohan Kumar", "Software Engineer", "Engineering", "Present"],
        ["PM", "Priya Mishra", "HR Executive", "Human Resources", "On Leave"],
        ["AD", "Arjun Das", "Accountant", "Finance", "Present"],
        ["SN", "Sneha Nair", "Marketing Executive", "Marketing", "Late"]
    ];

    return (
        <>
            <div className="welcome-row">
                <div>
                    <h2>Good morning, Admin 👋</h2>
                    <p>Here’s what’s happening with your organization today.</p>
                </div>
                <button className="primary-btn">+ Add Employee</button>
            </div>

            <div className="stats-grid">
                <StatCard icon="♙" title="Total Employees" value="248" change="+12.5%" detail="vs. last month" up />
                <StatCard icon="◷" title="Present Today" value="218" change="+4.8%" detail="87.9% attendance" up />
                <StatCard icon="▱" title="On Leave" value="14" change="5.6%" detail="of total employees" />
                <StatCard icon="✉" title="Pending Applications" value="08" change="Action needed" detail="Awaiting review" />
            </div>

            <div className="content-grid">
                <section className="panel attendance-panel">
                    <div className="panel-head">
                        <div><h3>Attendance Overview</h3><p>Today, 02 August 2026</p></div>
                        <button className="select-btn">This week ⌄</button>
                    </div>
                    <div className="attendance-body">
                        <div className="donut-wrap">
                            <div className="donut"><div><strong>87.9%</strong><small>Attendance</small></div></div>
                        </div>
                        <div className="attendance-legend">
                            <div><span className="legend-dot present"></span><div><strong>218</strong><small>Present</small></div></div>
                            <div><span className="legend-dot leave"></span><div><strong>14</strong><small>On Leave</small></div></div>
                            <div><span className="legend-dot absent"></span><div><strong>16</strong><small>Absent</small></div></div>
                        </div>
                    </div>
                </section>

                <section className="panel department-panel">
                    <div className="panel-head">
                        <div><h3>Departments</h3><p>Employee distribution</p></div>
                        <button className="more-btn">•••</button>
                    </div>
                    {[
                        ["Engineering", 86, "35%"],
                        ["Design", 42, "17%"],
                        ["Marketing", 38, "15%"],
                        ["Human Resources", 28, "11%"],
                        ["Finance", 24, "10%"]
                    ].map(([name, count, pct]) => (
                        <div className="dept-row" key={name}>
                            <div><strong>{name}</strong><span>{count} employees</span></div>
                            <div className="bar"><i style={{ width: pct }}></i></div>
                            <b>{pct}</b>
                        </div>
                    ))}
                </section>
            </div>

            <section className="panel table-panel">
                <div className="panel-head">
                    <div><h3>Recent Employees</h3><p>Latest employee activity</p></div>
                    <button className="text-btn">View all employees →</button>
                </div>
                <table>
                    <thead><tr><th>EMPLOYEE</th><th>POSITION</th><th>DEPARTMENT</th><th>STATUS</th></tr></thead>
                    <tbody>
                        {employees.map(e => (
                            <tr key={e[1]}>
                                <td><div className="employee-cell"><div className="small-avatar">{e[0]}</div><strong>{e[1]}</strong></div></td>
                                <td>{e[2]}</td><td>{e[3]}</td>
                                <td><span className={`status ${e[4].toLowerCase().replace(" ", "-")}`}>{e[4]}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    );
}

function GenericPage({ type }) {
    const data = {
        employees: ["Employees", "Manage employee profiles, contact details and employment information.", "248", "Add Employee"],
        attendance: ["Attendance", "Track daily attendance, late arrivals and absences.", "87.9%", "Mark Attendance"],
        departments: ["Departments", "Organize employees into departments and teams.", "8", "Add Department"],
        roles: ["Roles", "Manage system roles and employee permissions.", "12", "Add Role"],
        payroll: ["Payroll", "Manage salary records, payslips and payroll status.", "₹18.4L", "Run Payroll"],
        leave: ["On Leave", "View employees who are currently away from work.", "14", "Review Leave"],
        applications: ["Pending Applications", "Review leave requests and other employee applications.", "08", "Review Applications"]
    };
    const [title, desc, value, action] = data[type] || data.employees;
    return (
        <div className="placeholder-page">
            <div className="placeholder-hero">
                <div><span className="eyebrow">EMPLOX MODULE</span><h2>{title}</h2><p>{desc}</p></div>
                <button className="primary-btn">+ {action}</button>
            </div>
            <div className="module-card">
                <div className="module-icon">◈</div>
                <div><strong>{value}</strong><span>{title === "Payroll" ? "Current payroll" : "Total records"}</span></div>
            </div>
            <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>{title} module ready</h3>
                <p>This is the UI layer. Connect this screen to your Express REST APIs and MySQL database next.</p>
            </div>
        </div>
    );
}

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [active, setActive] = useState("dashboard");

    if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

    return (
        <div className="app">
            <Sidebar active={active} setActive={setActive} />
            <main className="main">
                <Topbar active={active} />
                <div className="page">
                    {active === "dashboard" ? <Dashboard /> : <GenericPage type={active} />}
                </div>
            </main>
        </div>
    );
}

createRoot(document.getElementById("root")).render(<App />);