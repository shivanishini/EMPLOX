import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function EmployeeDashboard({ user: propUser, onLogout }) {
    const [user, setUser] = useState(propUser || null);
    const [activeTab, setActiveTab] = useState("attendance");

    // Attendance state
    const [attendance, setAttendance] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Leave state
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState("");
    const [leaveMessage, setLeaveMessage] = useState("");
    const [leaveForm, setLeaveForm] = useState({
        leave_type: "Casual Leave",
        start_date: "",
        end_date: "",
        reason: ""
    });
    const [leaveSubmitting, setLeaveSubmitting] = useState(false);

    // Live clock ticker
    const [currentTime, setCurrentTime] = useState(new Date());

    // Resolve user from localStorage if not passed as prop
    useEffect(() => {
        if (!user) {
            const savedUser = localStorage.getItem("emplox_user");
            if (savedUser) {
                try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
            }
        }
    }, []);

    // Live clock ticker (1 second interval)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load attendance when user is authenticated
    useEffect(() => {
        if (user?.role === "Employee") {
            fetchAttendance();
        }
    }, [user]);

    // Load leave history when tab switches to leave
    useEffect(() => {
        if (activeTab === "leave" && user?.role === "Employee") {
            fetchLeaveHistory();
        }
    }, [activeTab, user]);

    const getToken = () => localStorage.getItem("emplox_token");
    const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

    // ─── Attendance API Actions ──────────────────────────────────────────────

    const fetchAttendance = async () => {
        try {
            setAttendanceLoading(true);
            setError("");
            const response = await axios.get(`${API}/employee/attendance`, { headers: authHeaders() });
            setAttendance(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load attendance.");
        } finally {
            setAttendanceLoading(false);
        }
    };

    const markPresent = async () => {
        try {
            setActionLoading(true);
            setMessage("");
            setError("");
            const response = await axios.post(`${API}/employee/attendance/present`, {}, { headers: authHeaders() });
            setMessage(response.data.message);
            await fetchAttendance();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to mark attendance.");
        } finally {
            setActionLoading(false);
        }
    };

    const checkOut = async () => {
        try {
            setActionLoading(true);
            setMessage("");
            setError("");
            const response = await axios.post(`${API}/employee/attendance/checkout`, {}, { headers: authHeaders() });
            setMessage(response.data.message);
            await fetchAttendance();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to check out.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Leave API Actions ───────────────────────────────────────────────────

    const fetchLeaveHistory = async () => {
        try {
            setLeaveLoading(true);
            setLeaveError("");
            const response = await axios.get(`${API}/employee/leave`, { headers: authHeaders() });
            setLeaveHistory(response.data);
        } catch (err) {
            setLeaveError(err.response?.data?.message || "Unable to load leave history.");
        } finally {
            setLeaveLoading(false);
        }
    };

    const submitLeave = async (e) => {
        e.preventDefault();
        setLeaveError("");
        setLeaveMessage("");

        if (!leaveForm.start_date || !leaveForm.end_date) {
            setLeaveError("Please select both start and end dates.");
            return;
        }

        const days = Math.floor((new Date(leaveForm.end_date) - new Date(leaveForm.start_date)) / 86400000) + 1;
        if (days < 1) {
            setLeaveError("End date must be on or after start date.");
            return;
        }

        try {
            setLeaveSubmitting(true);
            const response = await axios.post(
                `${API}/employee/leave`,
                { ...leaveForm },
                { headers: authHeaders() }
            );
            setLeaveMessage(response.data.message || "Leave request submitted successfully.");
            setLeaveForm({ leave_type: "Casual Leave", start_date: "", end_date: "", reason: "" });
            await fetchLeaveHistory();
        } catch (err) {
            setLeaveError(err.response?.data?.message || "Failed to submit leave request.");
        } finally {
            setLeaveSubmitting(false);
        }
    };

    // ─── Date & Time Helpers ─────────────────────────────────────────────────

    // Local/IST calendar date string: YYYY-MM-DD
    const getTodayDateString = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    // Normalize date string from backend (handles 'YYYY-MM-DD' or ISO format)
    const normalizeDate = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val.slice(0, 10);
        const d = new Date(val);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const todayStr = getTodayDateString();
    const todayAttendance = attendance.find(item => normalizeDate(item.date) === todayStr);

    // Monthly summary (current month)
    const thisMonth = todayStr.slice(0, 7);
    const monthRecs = attendance.filter(r => normalizeDate(r.date).slice(0, 7) === thisMonth);
    const monthlySummary = {
        present:  monthRecs.filter(r => r.status === "Present").length,
        late:     monthRecs.filter(r => r.status === "Late").length,
        onLeave:  monthRecs.filter(r => r.status === "On Leave").length,
        overtime: monthRecs.reduce((s, r) => s + Number(r.overtime_minutes || 0), 0)
    };

    const fmtOT = (mins) => {
        const n = Number(mins) || 0;
        if (n <= 0) return "0 min";
        const h = Math.floor(n / 60);
        const m = n % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    // Leave summary
    const leaveSummary = {
        pending:  leaveHistory.filter(r => r.status === "Pending").length,
        approved: leaveHistory.filter(r => r.status === "Approved").length,
        total:    leaveHistory.length
    };

    const formatTime = (time) => {
        if (!time) return "—";
        const parts = time.split(":");
        if (parts.length < 2) return time;
        const d = new Date();
        d.setHours(Number(parts[0]), Number(parts[1]), Number(parts[2] || 0));
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDateFull = (date) =>
        date.toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

    const formatDateShort = (dateStr) => {
        if (!dateStr) return "—";
        const clean = normalizeDate(dateStr);
        const [y, m, d] = clean.split("-");
        if (!y || !m || !d) return dateStr;
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const getDayName = (dateStr) => {
        if (!dateStr) return "";
        const clean = normalizeDate(dateStr);
        const [y, m, d] = clean.split("-");
        if (!y || !m || !d) return "";
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        return dt.toLocaleDateString("en-IN", { weekday: "short" });
    };

    const getLeaveStatusClass = (status) => {
        if (status === "Approved") return "approved";
        if (status === "Rejected") return "rejected";
        if (status === "Pending") return "pending";
        return "";
    };

    const displayName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "Employee";

    const handleLogout = () => {
        localStorage.removeItem("emplox_token");
        localStorage.removeItem("emplox_user");
        if (onLogout) onLogout();
        else window.location.reload();
    };

    // Greeting based on hour
    const hour = currentTime.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    // Determine today's overall status state
    const isCompleted = Boolean(todayAttendance?.check_out);
    const isCheckedIn = Boolean(todayAttendance && !todayAttendance.check_out && todayAttendance.status !== "On Leave");
    const isOnLeave = Boolean(todayAttendance?.status === "On Leave");
    const isNotMarked = !todayAttendance;

    return (
        <div className="module-page">

            {/* ── Header ── */}
            <div className="welcome-row" style={{ alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <p className="eyebrow">EMPLOYEE PORTAL</p>
                    <h2 style={{ margin: "2px 0 6px" }}>{greeting}, {displayName || "Employee"} 👋</h2>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
                        {user?.employee_code && <strong>{user.employee_code} · </strong>}
                        {user?.department && <span>{user.department} · </span>}
                        {user?.employee_role || user?.role || "Employee"}
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div className="module-stat" style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: "11px" }}>Current Time (IST)</span>
                        <strong style={{ fontSize: "20px", marginTop: "2px" }}>
                            {currentTime.toLocaleTimeString([], {
                                hour: "2-digit", minute: "2-digit", second: "2-digit"
                            })}
                        </strong>
                        <small style={{ color: "#9aa1ac", fontSize: "11px", display: "block" }}>
                            {formatDateFull(currentTime)}
                        </small>
                    </div>

                    <button
                        className="small-btn reject"
                        onClick={handleLogout}
                        style={{ whiteSpace: "nowrap", padding: "10px 14px", fontWeight: "600" }}
                        title="Sign Out"
                    >
                        ⎋ Sign Out
                    </button>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "22px",
                borderBottom: "2px solid var(--line)",
                paddingBottom: "0"
            }}>
                {[
                    { key: "attendance", label: "📋 Attendance & Check-In" },
                    { key: "leave", label: "🏖 Leave Requests" }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setMessage("");
                            setError("");
                            setLeaveMessage("");
                            setLeaveError("");
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "10px 22px",
                            cursor: "pointer",
                            fontWeight: activeTab === tab.key ? "700" : "500",
                            color: activeTab === tab.key ? "var(--primary)" : "var(--muted)",
                            borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                            marginBottom: "-2px",
                            fontSize: "14px",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════ ATTENDANCE TAB ══════════════════ */}
            {activeTab === "attendance" && (
                <>
                    {/* Feedback Messages */}
                    {message && <div className="success-message" style={{ marginBottom: "16px" }}>{message}</div>}
                    {error && <div className="error-message" style={{ marginBottom: "16px" }}>{error}</div>}

                    {/* 1. Monthly Summary Cards */}
                    <div className="summary-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "22px" }}>
                        <div>
                            <span>Present (This Month)</span>
                            <strong style={{ color: "#29966a" }}>{monthlySummary.present}</strong>
                        </div>
                        <div>
                            <span>Late (This Month)</span>
                            <strong style={{ color: "#ce6262" }}>{monthlySummary.late}</strong>
                        </div>
                        <div>
                            <span>On Leave (This Month)</span>
                            <strong style={{ color: "#c1832e" }}>{monthlySummary.onLeave}</strong>
                        </div>
                        <div>
                            <span>Total Overtime (This Month)</span>
                            <strong style={{ color: "var(--primary)" }}>{fmtOT(monthlySummary.overtime)}</strong>
                        </div>
                    </div>

                    {/* 2. Today's Attendance & Rules Content Grid */}
                    <div className="content-grid" style={{ marginBottom: "22px" }}>

                        {/* Today's Attendance Card */}
                        <div className="panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <div className="panel-head" style={{ marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "16px" }}>Today's Attendance</h3>
                                        <p>{formatDateFull(currentTime)}</p>
                                    </div>
                                    <div>
                                        {isNotMarked && (
                                            <span className="status-pill not-marked">Not Marked</span>
                                        )}
                                        {isOnLeave && (
                                            <span className="status-pill" style={{ background: "#fff5e6", color: "#c1832e" }}>On Leave</span>
                                        )}
                                        {isCheckedIn && (
                                            <span className={`status-pill ${todayAttendance.status === "Late" ? "rejected" : "approved"}`}>
                                                {todayAttendance.status} (Checked In)
                                            </span>
                                        )}
                                        {isCompleted && (
                                            <span className="status-pill completed">Completed</span>
                                        )}
                                    </div>
                                </div>

                                {/* Today's Metrics Grid */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: "12px",
                                    background: "#fafbfc",
                                    border: "1px solid var(--line)",
                                    borderRadius: "10px",
                                    padding: "14px 16px",
                                    marginBottom: "18px"
                                }}>
                                    <div>
                                        <small style={{ color: "#8a92a0", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Status</small>
                                        <strong style={{ display: "block", marginTop: "4px", fontSize: "14px", color: isCompleted ? "#0284c7" : todayAttendance?.status === "Late" ? "#dc2626" : todayAttendance?.status === "Present" ? "#16a34a" : "#64748b" }}>
                                            {isCompleted ? "Completed" : todayAttendance?.status || "Not Marked"}
                                        </strong>
                                    </div>
                                    <div>
                                        <small style={{ color: "#8a92a0", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Arrival</small>
                                        <strong style={{ display: "block", marginTop: "4px", fontSize: "14px" }}>
                                            {formatTime(todayAttendance?.check_in)}
                                        </strong>
                                    </div>
                                    <div>
                                        <small style={{ color: "#8a92a0", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Departure</small>
                                        <strong style={{ display: "block", marginTop: "4px", fontSize: "14px" }}>
                                            {formatTime(todayAttendance?.check_out)}
                                        </strong>
                                    </div>
                                    <div>
                                        <small style={{ color: "#8a92a0", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Overtime</small>
                                        <strong style={{ display: "block", marginTop: "4px", fontSize: "14px", color: Number(todayAttendance?.overtime_minutes || 0) > 0 ? "var(--primary)" : "inherit" }}>
                                            {fmtOT(todayAttendance?.overtime_minutes)}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Flow Area */}
                            <div>
                                {/* State 1: Not Marked -> Show Mark Present */}
                                {isNotMarked && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <button
                                            className="primary-btn"
                                            onClick={markPresent}
                                            disabled={actionLoading}
                                            id="btn-mark-present"
                                            style={{ width: "fit-content", minWidth: "160px" }}
                                        >
                                            {actionLoading ? "Recording Arrival..." : "✓ Mark Present"}
                                        </button>
                                        <small style={{ color: "#8a92a0", fontSize: "11px" }}>
                                            Target arrival is 9:10 AM IST. Check-ins after 9:10 AM are recorded as Late.
                                        </small>
                                    </div>
                                )}

                                {/* State 2: Marked Present / Late, Awaiting Departure -> Show Mark Departure */}
                                {isCheckedIn && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <button
                                            className="departure-btn"
                                            onClick={checkOut}
                                            disabled={actionLoading}
                                            id="btn-mark-departure"
                                            style={{ width: "fit-content", minWidth: "200px" }}
                                        >
                                            {actionLoading ? "Recording Departure..." : "↪ Mark Departure (Check Out)"}
                                        </button>
                                        <small style={{ color: "#8a92a0", fontSize: "11px" }}>
                                            Arrival recorded at {formatTime(todayAttendance.check_in)}. Standard departure is 6:10 PM. Overtime starts after 7:10 PM.
                                        </small>
                                    </div>
                                )}

                                {/* State 3: Completed -> Show Completion Banner & Disable Further Action */}
                                {isCompleted && (
                                    <div className="attendance-completed-banner">
                                        <span style={{ fontSize: "18px" }}>✓</span>
                                        <div>
                                            <strong>Attendance Completed for Today</strong>
                                            <div style={{ fontSize: "12px", color: "#166534", marginTop: "2px" }}>
                                                Arrival: {formatTime(todayAttendance.check_in)} · Departure: {formatTime(todayAttendance.check_out)}
                                                {Number(todayAttendance.overtime_minutes || 0) > 0 ? ` · Overtime: ${fmtOT(todayAttendance.overtime_minutes)}` : " · No Overtime"}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* State 4: On Leave -> Show Approved Leave Banner */}
                                {isOnLeave && (
                                    <div className="attendance-completed-banner" style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
                                        <span style={{ fontSize: "18px" }}>🏖</span>
                                        <div>
                                            <strong>On Approved Leave Today</strong>
                                            <div style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>
                                                Your leave request for today is approved. No attendance actions required.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance Rules Card */}
                        <div className="panel">
                            <div className="panel-head" style={{ marginBottom: "16px" }}>
                                <div>
                                    <h3 style={{ fontSize: "16px" }}>Attendance Rules</h3>
                                    <p>Official working hours & overtime policy</p>
                                </div>
                            </div>

                            <div className="attendance-legend" style={{ gap: "14px" }}>
                                <div>
                                    <span className="legend-dot present"></span>
                                    <div>
                                        <strong>Arrival Target: 09:10 AM</strong>
                                        <small>Arrivals at or before 9:10 AM IST are marked as Present. Arrivals after 9:10 AM are marked as Late.</small>
                                    </div>
                                </div>
                                <div>
                                    <span className="legend-dot" style={{ background: "#5b55e8" }}></span>
                                    <div>
                                        <strong>Normal Departure: 06:10 PM</strong>
                                        <small>Standard workday ends at 6:10 PM. Check-out is required at the end of your shift.</small>
                                    </div>
                                </div>
                                <div>
                                    <span className="legend-dot leave"></span>
                                    <div>
                                        <strong>Overtime Eligibility: After 07:10 PM</strong>
                                        <small>Time between 6:10 PM and 7:10 PM is an uncredited buffer. Official overtime starts accumulating after 7:10 PM.</small>
                                    </div>
                                </div>
                                <div>
                                    <span className="legend-dot late"></span>
                                    <div>
                                        <strong>Single Checkout Policy</strong>
                                        <small>Departure can only be recorded once per calendar day. Once completed, attendance is finalized.</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* 3. Recent Attendance History Table */}
                    <div className="panel table-panel" style={{ paddingBottom: "16px" }}>
                        <div className="panel-head">
                            <div>
                                <h3 style={{ fontSize: "16px" }}>Recent Attendance History</h3>
                                <p>Your past attendance records</p>
                            </div>
                            <span style={{ fontSize: "12px", color: "#8a92a0" }}>
                                Total records: {attendance.length}
                            </span>
                        </div>

                        {attendanceLoading ? (
                            <div className="table-message" style={{ padding: "30px 20px", textAlign: "center", color: "#8a92a0" }}>
                                Loading attendance records...
                            </div>
                        ) : attendance.length === 0 ? (
                            <div className="table-message" style={{ padding: "30px 20px", textAlign: "center", color: "#8a92a0" }}>
                                No attendance records found yet.
                            </div>
                        ) : (
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>DATE</th>
                                            <th>DAY</th>
                                            <th>ARRIVAL</th>
                                            <th>DEPARTURE</th>
                                            <th>STATUS</th>
                                            <th>OVERTIME</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.slice(0, 20).map(item => {
                                            const itemCompleted = Boolean(item.check_out);
                                            const itemClass = itemCompleted
                                                ? "completed"
                                                : item.status === "Present"
                                                    ? "present"
                                                    : item.status === "Late"
                                                        ? "late"
                                                        : item.status === "On Leave"
                                                            ? "on-leave"
                                                            : "";
                                            return (
                                                <tr key={item.id}>
                                                    <td style={{ fontWeight: "600", color: "var(--ink)" }}>
                                                        {formatDateShort(item.date)}
                                                    </td>
                                                    <td style={{ color: "#8a92a0" }}>
                                                        {getDayName(item.date)}
                                                    </td>
                                                    <td>{formatTime(item.check_in)}</td>
                                                    <td>{formatTime(item.check_out)}</td>
                                                    <td>
                                                        <span className={`status ${itemClass}`}>
                                                            {itemCompleted ? `Completed (${item.status})` : item.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: Number(item.overtime_minutes || 0) > 0 ? "700" : "normal", color: Number(item.overtime_minutes || 0) > 0 ? "var(--primary)" : "inherit" }}>
                                                        {fmtOT(item.overtime_minutes)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ══════════════════ LEAVE TAB ══════════════════ */}
            {activeTab === "leave" && (
                <>
                    {/* Feedback Messages */}
                    {leaveMessage && <div className="success-message" style={{ marginBottom: "16px" }}>{leaveMessage}</div>}
                    {leaveError && <div className="error-message" style={{ marginBottom: "16px" }}>{leaveError}</div>}

                    {/* Leave Summary Cards */}
                    <div className="summary-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "22px" }}>
                        <div>
                            <span>Total Requests</span>
                            <strong>{leaveSummary.total}</strong>
                        </div>
                        <div>
                            <span>Pending Review</span>
                            <strong style={{ color: "#8a6500" }}>{leaveSummary.pending}</strong>
                        </div>
                        <div>
                            <span>Approved</span>
                            <strong style={{ color: "#207342" }}>{leaveSummary.approved}</strong>
                        </div>
                    </div>

                    <div className="module-grid">

                        {/* Apply for Leave Form */}
                        <form className="module-form" onSubmit={submitLeave}>
                            <h3 style={{ fontSize: "16px" }}>Apply for Leave</h3>
                            <p style={{ margin: "4px 0 16px", color: "var(--muted)", fontSize: "12px" }}>
                                Submit a request for manager approval.
                            </p>

                            <label>
                                Leave Type
                                <select
                                    value={leaveForm.leave_type}
                                    onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                                >
                                    <option>Casual Leave</option>
                                    <option>Sick Leave</option>
                                    <option>Earned Leave</option>
                                    <option>Unpaid Leave</option>
                                </select>
                            </label>

                            <div className="form-row">
                                <label>
                                    Start Date
                                    <input
                                        type="date"
                                        value={leaveForm.start_date}
                                        onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                        required
                                    />
                                </label>
                                <label>
                                    End Date
                                    <input
                                        type="date"
                                        value={leaveForm.end_date}
                                        onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                        required
                                    />
                                </label>
                            </div>

                            <label>
                                Reason
                                <textarea
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    placeholder="Brief reason for your leave (optional)"
                                    rows={3}
                                />
                            </label>

                            {leaveForm.start_date && leaveForm.end_date && (() => {
                                const days = Math.floor((new Date(leaveForm.end_date) - new Date(leaveForm.start_date)) / 86400000) + 1;
                                return days >= 1 ? (
                                    <p style={{ color: "var(--primary)", fontSize: "13px", margin: "12px 0 0", fontWeight: "600" }}>
                                        Duration: {days} day{days !== 1 ? "s" : ""}
                                    </p>
                                ) : null;
                            })()}

                            <button
                                className="primary-btn"
                                type="submit"
                                disabled={leaveSubmitting}
                                style={{ marginTop: "18px" }}
                            >
                                {leaveSubmitting ? "Submitting..." : "Submit Leave Request"}
                            </button>
                        </form>

                        {/* Leave History Table Card */}
                        <div className="module-table-card">
                            <div className="card-title">
                                <div>
                                    <h3 style={{ fontSize: "16px" }}>My Leave History</h3>
                                    <span style={{ fontSize: "12px" }}>{leaveHistory.length} request{leaveHistory.length !== 1 ? "s" : ""}</span>
                                </div>
                            </div>

                            {leaveLoading ? (
                                <p style={{ color: "var(--muted)", padding: "20px 0" }}>Loading leave records...</p>
                            ) : leaveHistory.length === 0 ? (
                                <p style={{ color: "var(--muted)", padding: "20px 0" }}>
                                    No leave requests submitted yet.
                                </p>
                            ) : (
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>TYPE</th>
                                                <th>DATES</th>
                                                <th>DAYS</th>
                                                <th>STATUS</th>
                                                <th>APPLIED ON</th>
                                                <th>REVIEWED ON</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaveHistory.map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: "600" }}>{r.leave_type}</td>
                                                    <td>
                                                        {formatDateShort(r.start_date)}
                                                        {normalizeDate(r.start_date) !== normalizeDate(r.end_date) && ` → ${formatDateShort(r.end_date)}`}
                                                    </td>
                                                    <td>{r.days}</td>
                                                    <td>
                                                        <span className={`status-pill ${getLeaveStatusClass(r.status)}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td>{formatDateShort(r.applied_on)}</td>
                                                    <td>{formatDateShort(r.reviewed_on)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>
                </>
            )}

        </div>
    );
}