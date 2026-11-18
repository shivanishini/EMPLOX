import React, { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getDashboardStats, getEmployees, getDepartments } from "../services/api";

export default function Dashboard({ onAddEmployee, onViewEmployees }) {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        lateToday: 0,
        onLeave: 0,
        absentToday: 0,
        pendingLeaves: 0,
        totalOvertimeMinutes: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    useEffect(() => {
        getEmployees()
            .then(data => setEmployees(Array.isArray(data) ? data : []))
            .catch(() => setEmployees([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        getDepartments()
            .then(data => setDepartments(Array.isArray(data) ? data : []))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => {
        getDashboardStats()
            .then(data => {
                setStats({
                    totalEmployees: Number(data.totalEmployees || 0),
                    presentToday: Number(data.presentToday || 0),
                    lateToday: Number(data.lateToday || 0),
                    onLeave: Number(data.onLeave || 0),
                    absentToday: Number(data.absentToday || 0),
                    pendingLeaves: Number(data.pendingLeaves || 0),
                    totalOvertimeMinutes: Number(data.totalOvertimeMinutes || 0)
                });
            })
            .catch(err => console.error("Failed to load dashboard statistics:", err))
            .finally(() => setStatsLoading(false));
    }, []);

    const attendanceTotal = stats.presentToday + stats.lateToday + stats.onLeave + stats.absentToday;
    const presentPct = attendanceTotal > 0 ? Math.round(((stats.presentToday + stats.lateToday) / stats.totalEmployees) * 100) : 0;

    const fmtOT = mins => {
        if (!mins) return "0 min";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    return (
        <>
            <div className="welcome-row">
                <div>
                    <h2>{greeting}, Admin 👋</h2>
                    <p>Here's what's happening with your organization today.</p>
                </div>
                <button className="primary-btn" onClick={onAddEmployee}>
                    + Add Employee
                </button>
            </div>

            {/* STATS GRID — 4 across */}
            <div className="stats-grid">
                <StatCard
                    icon="♙"
                    title="Total Employees"
                    value={statsLoading ? "..." : stats.totalEmployees}
                    change="Active"
                    detail="From employee database"
                    up
                />
                <StatCard
                    icon="✓"
                    title="Present Today"
                    value={statsLoading ? "..." : stats.presentToday + stats.lateToday}
                    change={stats.totalEmployees > 0 ? `${presentPct}%` : "0%"}
                    detail={`${stats.presentToday} on time · ${stats.lateToday} late`}
                    up
                />
                <StatCard
                    icon="▱"
                    title="On Leave"
                    value={statsLoading ? "..." : stats.onLeave}
                    change={stats.totalEmployees > 0 ? `${Math.round((stats.onLeave / stats.totalEmployees) * 100)}%` : "0%"}
                    detail="Approved leave today"
                />
                <StatCard
                    icon="⏱"
                    title="Overtime Today"
                    value={statsLoading ? "..." : fmtOT(stats.totalOvertimeMinutes)}
                    change={`${stats.totalOvertimeMinutes} min`}
                    detail="Total across all employees"
                />
            </div>

            {/* SECOND ROW — 3 across */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: "20px" }}>
                <StatCard
                    icon="✗"
                    title="Absent Today"
                    value={statsLoading ? "..." : stats.absentToday}
                    change={stats.totalEmployees > 0 ? `${Math.round((stats.absentToday / stats.totalEmployees) * 100)}%` : "0%"}
                    detail="Not marked / absent"
                />
                <StatCard
                    icon="◉"
                    title="Late Arrivals"
                    value={statsLoading ? "..." : stats.lateToday}
                    change="After 9:10 AM"
                    detail="Late arrivals today"
                />
                <StatCard
                    icon="📋"
                    title="Pending Leaves"
                    value={statsLoading ? "..." : stats.pendingLeaves}
                    change="Awaiting review"
                    detail="Leave requests pending"
                />
            </div>

            {/* ATTENDANCE OVERVIEW + DEPARTMENTS */}
            <div className="content-grid">

                <section className="panel attendance-panel">
                    <div className="panel-head">
                        <div>
                            <h3>Attendance Overview</h3>
                            <p>Today's breakdown</p>
                        </div>
                    </div>

                    <div className="attendance-body">
                        <div className="donut-wrap">
                            <div className="donut">
                                <div>
                                    <strong>{presentPct}%</strong>
                                    <small>Present</small>
                                </div>
                            </div>
                        </div>

                        <div className="attendance-legend">
                            <div>
                                <span className="legend-dot present"></span>
                                <div>
                                    <strong>{stats.presentToday}</strong>
                                    <small>On Time</small>
                                </div>
                            </div>
                            <div>
                                <span className="legend-dot late"></span>
                                <div>
                                    <strong>{stats.lateToday}</strong>
                                    <small>Late</small>
                                </div>
                            </div>
                            <div>
                                <span className="legend-dot leave"></span>
                                <div>
                                    <strong>{stats.onLeave}</strong>
                                    <small>On Leave</small>
                                </div>
                            </div>
                            <div>
                                <span className="legend-dot absent"></span>
                                <div>
                                    <strong>{stats.absentToday}</strong>
                                    <small>Absent</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="panel department-panel">
                    <div className="panel-head">
                        <div>
                            <h3>Departments</h3>
                            <p>Employee distribution</p>
                        </div>
                    </div>

                    {departments.map(department => {
                        const count = employees.filter(e => e.department === department.name).length;
                        const percentage = stats.totalEmployees > 0
                            ? Math.round((count / stats.totalEmployees) * 100)
                            : 0;
                        return (
                            <div className="dept-row" key={department.id}>
                                <div>
                                    <strong>{department.name}</strong>
                                    <span>{count} employee{count !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="bar">
                                    <i style={{ width: `${percentage}%` }}></i>
                                </div>
                                <b>{percentage}%</b>
                            </div>
                        );
                    })}

                    {departments.length === 0 && (
                        <p style={{ color: "#9aa1ac", fontSize: "12px", paddingTop: "10px" }}>
                            No departments found.
                        </p>
                    )}
                </section>
            </div>

            {/* RECENT EMPLOYEES */}
            <section className="panel table-panel">
                <div className="panel-head">
                    <div>
                        <h3>Recent Employees</h3>
                        <p>Latest employee activity</p>
                    </div>
                    <button className="text-btn" onClick={onViewEmployees}>
                        View all employees →
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>POSITION</th>
                            <th>DEPARTMENT</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                                    Loading employees...
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                                    No employees found
                                </td>
                            </tr>
                        ) : (
                            employees.slice(0, 8).map(employee => {
                                const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
                                return (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="employee-cell">
                                                <div className="small-avatar">
                                                    {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                                                </div>
                                                <div>
                                                    <strong>{fullName || "Unknown Employee"}</strong>
                                                    <small>{employee.email || ""}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{employee.role || "Not assigned"}</td>
                                        <td>{employee.department || "Not assigned"}</td>
                                        <td>
                                            <span className={`status ${(employee.status || "Active").toLowerCase().replace(" ", "-")}`}>
                                                {employee.status || "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </section>
        </>
    );
}