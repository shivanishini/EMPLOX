import React, { useEffect, useMemo, useState } from "react";
import { getAttendance, getEmployees, updateAttendance } from "../services/api";

const STATUS_OPTIONS = ["", "Present", "Late", "Absent", "On Leave"];

export default function Attendance() {
    const [attendance, setAttendance]     = useState([]);
    const [employees, setEmployees]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [saving, setSaving]             = useState(false);
    const [saveMsg, setSaveMsg]           = useState("");
    const [saveErr, setSaveErr]           = useState("");

    // Filters
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo,   setFilterDateTo]   = useState("");
    const [filterStatus,   setFilterStatus]   = useState("");

    const loadAttendance = async (filters = {}) => {
        try {
            setLoading(true);
            setSaveMsg("");
            setSaveErr("");
            const data = await getAttendance(filters);
            setAttendance(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load attendance:", err);
            setSaveErr("Failed to load attendance records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
        getEmployees()
            .then(d => setEmployees(Array.isArray(d) ? d : []))
            .catch(() => {});
    }, []);

    const applyFilters = () => {
        const filters = {};
        if (filterEmployee) filters.employee_id = filterEmployee;
        if (filterDateFrom) filters.date_from   = filterDateFrom;
        if (filterDateTo)   filters.date_to     = filterDateTo;
        if (filterStatus)   filters.status      = filterStatus;
        loadAttendance(filters);
    };

    const clearFilters = () => {
        setFilterEmployee("");
        setFilterDateFrom("");
        setFilterDateTo("");
        setFilterStatus("");
        loadAttendance();
    };

    // Local status change
    const updateStatus = (id, newStatus) => {
        setAttendance(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    // Save all changed records
    const handleSaveAttendance = async () => {
        setSaving(true);
        setSaveMsg("");
        setSaveErr("");
        try {
            for (const rec of attendance) {
                await updateAttendance(rec.id, {
                    status:    rec.status,
                    check_in:  rec.check_in,
                    check_out: rec.check_out
                });
            }
            setSaveMsg("✓ Attendance saved successfully.");
        } catch (err) {
            console.error("Failed to save attendance:", err);
            setSaveErr("Failed to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Summary aggregates
    const summary = useMemo(() => {
        const counts = { Present: 0, Late: 0, Absent: 0, "On Leave": 0 };
        let totalOT = 0;
        attendance.forEach(r => {
            if (counts[r.status] !== undefined) counts[r.status]++;
            totalOT += Number(r.overtime_minutes || 0);
        });
        return { ...counts, totalOT };
    }, [attendance]);

    const fmtTime = t => {
        if (!t) return "—";
        const [h, m] = t.split(":");
        const d = new Date();
        d.setHours(+h, +m, 0);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const fmtDate = d => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const fmtOT = mins => {
        if (!mins) return "—";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getStatusClass = s => {
        if (s === "Present")  return "present";
        if (s === "Late")     return "late";
        if (s === "On Leave") return "on-leave";
        return "";
    };

    return (
        <div className="module-page">

            {/* HEADER */}
            <div className="page-heading">
                <div>
                    <span className="eyebrow">EMPLOX MODULE</span>
                    <h2>Attendance</h2>
                    <p>Track, filter and manage daily employee attendance.</p>
                </div>
                <button
                    className="primary-btn"
                    onClick={handleSaveAttendance}
                    disabled={saving || loading}
                >
                    {saving ? "Saving..." : "✓ Save Changes"}
                </button>
            </div>

            {saveMsg && <div className="success-message">{saveMsg}</div>}
            {saveErr && <div className="error-message">{saveErr}</div>}

            {/* SUMMARY CARDS */}
            <div className="summary-cards">
                <div>
                    <span>Present</span>
                    <strong style={{ color: "#29966a" }}>{summary.Present}</strong>
                </div>
                <div>
                    <span>Late</span>
                    <strong style={{ color: "#ce6262" }}>{summary.Late}</strong>
                </div>
                <div>
                    <span>On Leave</span>
                    <strong style={{ color: "#c1832e" }}>{summary["On Leave"]}</strong>
                </div>
                <div>
                    <span>Absent</span>
                    <strong style={{ color: "#9aa1ac" }}>{summary.Absent}</strong>
                </div>
                <div>
                    <span>Total Records</span>
                    <strong>{attendance.length}</strong>
                </div>
                <div>
                    <span>Total Overtime</span>
                    <strong style={{ color: "#5b55e8" }}>{fmtOT(summary.totalOT)}</strong>
                </div>
            </div>

            {/* FILTERS */}
            <div className="module-form" style={{ marginBottom: "18px", borderRadius: "12px" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 180px" }}>
                        <label style={{ fontSize: "11px", color: "#777", fontWeight: 700, display: "block", marginBottom: "6px" }}>EMPLOYEE</label>
                        <select
                            value={filterEmployee}
                            onChange={e => setFilterEmployee(e.target.value)}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", fontSize: "13px" }}
                        >
                            <option value="">All employees</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.employee_code} · {e.first_name} {e.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: "1 1 140px" }}>
                        <label style={{ fontSize: "11px", color: "#777", fontWeight: 700, display: "block", marginBottom: "6px" }}>FROM DATE</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e.target.value)}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", fontSize: "13px" }}
                        />
                    </div>

                    <div style={{ flex: "1 1 140px" }}>
                        <label style={{ fontSize: "11px", color: "#777", fontWeight: 700, display: "block", marginBottom: "6px" }}>TO DATE</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e.target.value)}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", fontSize: "13px" }}
                        />
                    </div>

                    <div style={{ flex: "1 1 130px" }}>
                        <label style={{ fontSize: "11px", color: "#777", fontWeight: 700, display: "block", marginBottom: "6px" }}>STATUS</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ width: "100%", padding: "9px 11px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", fontSize: "13px" }}
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button className="primary-btn" onClick={applyFilters} style={{ height: "40px", padding: "0 18px" }}>
                            Filter
                        </button>
                        <button
                            onClick={clearFilters}
                            style={{ height: "40px", padding: "0 14px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "12px", color: "#777" }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <section className="module-table-card" style={{ padding: 0 }}>
                <div className="card-title" style={{ padding: "16px 20px 0" }}>
                    <h3>Attendance Records</h3>
                    <span>{attendance.length} record{attendance.length !== 1 ? "s" : ""}</span>
                </div>

                {loading ? (
                    <div className="table-message">Loading attendance...</div>
                ) : attendance.length === 0 ? (
                    <div className="table-message">
                        <strong>No attendance records found</strong>
                        <p style={{ color: "#9aa1ac", margin: "8px 0 0" }}>Try adjusting your filters or adding new records.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>EMPLOYEE</th>
                                    <th>DEPARTMENT</th>
                                    <th>DATE</th>
                                    <th>CHECK IN</th>
                                    <th>CHECK OUT</th>
                                    <th>OVERTIME</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map(rec => {
                                    const fullName = `${rec.first_name || ""} ${rec.last_name || ""}`.trim();
                                    return (
                                        <tr key={rec.id}>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="small-avatar">
                                                        {fullName ? fullName.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <strong>{fullName || "Unknown"}</strong>
                                                        <small>{rec.employee_code}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{rec.department || "—"}</td>
                                            <td>{fmtDate(rec.date)}</td>
                                            <td>
                                                {rec.check_in
                                                    ? <span style={{ color: "#29966a", fontWeight: 600 }}>{fmtTime(rec.check_in)}</span>
                                                    : <span style={{ color: "#bbb" }}>—</span>}
                                            </td>
                                            <td>
                                                {rec.check_out
                                                    ? <span style={{ color: "#5b55e8", fontWeight: 600 }}>{fmtTime(rec.check_out)}</span>
                                                    : <span style={{ color: "#bbb" }}>—</span>}
                                            </td>
                                            <td>
                                                {rec.overtime_minutes > 0
                                                    ? <span style={{ color: "#e5a13d", fontWeight: 600 }}>{fmtOT(rec.overtime_minutes)}</span>
                                                    : <span style={{ color: "#ccc" }}>—</span>}
                                            </td>
                                            <td>
                                                <select
                                                    value={rec.status}
                                                    onChange={e => updateStatus(rec.id, e.target.value)}
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: "7px",
                                                        border: "1px solid #ddd",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        fontWeight: 600,
                                                        background: "#fafbfc"
                                                    }}
                                                >
                                                    {["Present", "Late", "Absent", "On Leave"].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}