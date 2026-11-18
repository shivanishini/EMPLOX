import React from "react";
export default function GenericPage({ type }) {
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