import React, { useEffect, useMemo, useState } from "react";
import { createLeaveRequest, getEmployees, getLeaveRequests, updateLeaveRequest } from "../services/api";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"];

export default function Leave() {
    const [employees, setEmployees] = useState([]);
    const [requests, setRequests]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [actionId, setActionId]   = useState(null); // id being acted upon

    // Filters
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterStatus,   setFilterStatus]   = useState("");
    const [filterType,     setFilterType]     = useState("");

    // New request form
    const [form, setForm] = useState({
        employee_id: "", leave_type: "Casual Leave",
        start_date: "", end_date: "", reason: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [formMsg, setFormMsg]       = useState("");
    const [formErr, setFormErr]       = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const [e, l] = await Promise.all([getEmployees(), getLeaveRequests()]);
            setEmployees(Array.isArray(e) ? e : []);
            setRequests(Array.isArray(l) ? l : []);
        } catch (err) {
            setError(err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setFormErr("");
        setFormMsg("");
        if (!form.employee_id || !form.start_date || !form.end_date) {
            setFormErr("Select employee and both dates.");
            return;
        }
        const days = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
        if (days < 1) { setFormErr("End date must be on or after start date."); return; }
        try {
            setSubmitting(true);
            await createLeaveRequest({ ...form, days });
            setFormMsg(`✓ Leave request created for ${days} day${days !== 1 ? "s" : ""}.`);
            setForm({ employee_id: "", leave_type: "Casual Leave", start_date: "", end_date: "", reason: "" });
            await load();
        } catch (err) {
            setFormErr(err.message || "Failed to create leave request.");
        } finally {
            setSubmitting(false);
        }
    };

    const changeStatus = async (id, status) => {
        if (status === "Rejected" && !window.confirm(`Reject this leave request?`)) return;
        try {
            setActionId(id);
            await updateLeaveRequest(id, { status });
            await load();
        } catch (err) {
            setError(err.message || "Failed to update leave request.");
        } finally {
            setActionId(null);
        }
    };

    // Summary counts
    const summary = useMemo(() => {
        const total    = requests.length;
        const pending  = requests.filter(r => r.status === "Pending").length;
        const approved = requests.filter(r => r.status === "Approved").length;
        const rejected = requests.filter(r => r.status === "Rejected").length;
        return { total, pending, approved, rejected };
    }, [requests]);

    // Apply filters locally
    const filtered = useMemo(() => {
        return requests.filter(r => {
            if (filterEmployee && String(r.employee_id) !== String(filterEmployee)) return false;
            if (filterStatus   && r.status     !== filterStatus)                   return false;
            if (filterType     && r.leave_type !== filterType)                     return false;
            return true;
        });
    }, [requests, filterEmployee, filterStatus, filterType]);

    const fmtDate = d => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const pillClass = s => {
        if (s === "Approved") return "approved";
        if (s === "Rejected") return "rejected";
        if (s === "Pending")  return "pending";
        return "";
    };

    const leaveDuration = () => {
        if (!form.start_date || !form.end_date) return null;
        const d = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1;
        return d >= 1 ? d : null;
    };

    return (
        <div className="module-page">

            {/* HEADER */}
            <div className="page-heading">
                <div>
                    <span className="eyebrow">EMPLOX MODULE</span>
                    <h2>Leave Management</h2>
                    <p>Submit, review and approve employee leave requests.</p>
                </div>
                <div className="module-stat">
                    <strong style={{ color: summary.pending > 0 ? "#8a6500" : "inherit" }}>
                        {summary.pending}
                    </strong>
                    <span>Pending requests</span>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            {/* SUMMARY CARDS */}
            <div className="summary-cards" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                <div>
                    <span>Total Requests</span>
                    <strong>{summary.total}</strong>
                </div>
                <div>
                    <span>Pending</span>
                    <strong style={{ color: "#8a6500" }}>{summary.pending}</strong>
                </div>
                <div>
                    <span>Approved</span>
                    <strong style={{ color: "#207342" }}>{summary.approved}</strong>
                </div>
                <div>
                    <span>Rejected</span>
                    <strong style={{ color: "#a33a3a" }}>{summary.rejected}</strong>
                </div>
            </div>

            <div className="module-grid">

                {/* FORM */}
                <form className="module-form" onSubmit={submit}>
                    <h3>New Leave Request</h3>

                    {formMsg && <div className="success-message" style={{ marginTop: "12px" }}>{formMsg}</div>}
                    {formErr && <div className="error-message" style={{ marginTop: "12px" }}>{formErr}</div>}

                    <label>
                        Employee
                        <select
                            value={form.employee_id}
                            onChange={e => setForm({ ...form, employee_id: e.target.value })}
                            required
                        >
                            <option value="">Select employee</option>
                            {employees.map(x => (
                                <option key={x.id} value={x.id}>
                                    {x.employee_code} · {x.first_name} {x.last_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Leave Type
                        <select
                            value={form.leave_type}
                            onChange={e => setForm({ ...form, leave_type: e.target.value })}
                        >
                            {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </label>

                    <div className="form-row">
                        <label>
                            Start Date
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={e => setForm({ ...form, start_date: e.target.value })}
                                required
                            />
                        </label>
                        <label>
                            End Date
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={e => setForm({ ...form, end_date: e.target.value })}
                                required
                            />
                        </label>
                    </div>

                    {leaveDuration() && (
                        <p style={{ fontSize: "12px", color: "var(--primary)", margin: "4px 0 0", fontWeight: 600 }}>
                            Duration: {leaveDuration()} day{leaveDuration() !== 1 ? "s" : ""}
                        </p>
                    )}

                    <label>
                        Reason
                        <textarea
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="Reason for leave"
                        />
                    </label>

                    <button className="primary-btn" type="submit" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                </form>

                {/* TABLE */}
                <div className="module-table-card">

                    {/* Inline Filters */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
                        <select
                            value={filterEmployee}
                            onChange={e => setFilterEmployee(e.target.value)}
                            style={{ flex: "1 1 160px", padding: "8px 10px", border: "1px solid #dddfe7", borderRadius: "8px", fontSize: "12px", background: "#fafbfc" }}
                        >
                            <option value="">All employees</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.first_name} {e.last_name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ flex: "1 1 120px", padding: "8px 10px", border: "1px solid #dddfe7", borderRadius: "8px", fontSize: "12px", background: "#fafbfc" }}
                        >
                            <option value="">All statuses</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>

                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            style={{ flex: "1 1 140px", padding: "8px 10px", border: "1px solid #dddfe7", borderRadius: "8px", fontSize: "12px", background: "#fafbfc" }}
                        >
                            <option value="">All types</option>
                            {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>

                        {(filterEmployee || filterStatus || filterType) && (
                            <button
                                onClick={() => { setFilterEmployee(""); setFilterStatus(""); setFilterType(""); }}
                                style={{ padding: "8px 12px", border: "1px solid #dddfe7", borderRadius: "8px", background: "#fff", cursor: "pointer", fontSize: "11px", color: "#777" }}
                            >
                                ✕ Clear
                            </button>
                        )}

                        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#9aa1ac" }}>
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {loading ? (
                        <p style={{ color: "#9aa1ac", padding: "30px 0", textAlign: "center" }}>Loading...</p>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#9aa1ac" }}>
                            <p style={{ fontSize: "16px", marginBottom: "6px" }}>No leave requests found</p>
                            <p style={{ fontSize: "12px" }}>Try adjusting filters or add a new request.</p>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>EMPLOYEE</th>
                                        <th>TYPE</th>
                                        <th>DATES</th>
                                        <th>DAYS</th>
                                        <th>APPLIED ON</th>
                                        <th>STATUS</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <strong>{r.employee_name}</strong>
                                                <small>{r.employee_code}</small>
                                            </td>
                                            <td>{r.leave_type}</td>
                                            <td style={{ whiteSpace: "nowrap" }}>
                                                {fmtDate(r.start_date)}
                                                {r.start_date?.slice(0, 10) !== r.end_date?.slice(0, 10) && (
                                                    <> → {fmtDate(r.end_date)}</>
                                                )}
                                            </td>
                                            <td>{r.days}</td>
                                            <td>{fmtDate(r.applied_on)}</td>
                                            <td>
                                                <span className={`status-pill ${pillClass(r.status)}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td>
                                                {r.status === "Pending" ? (
                                                    <div className="action-group">
                                                        <button
                                                            className="small-btn approve"
                                                            disabled={actionId === r.id}
                                                            onClick={() => changeStatus(r.id, "Approved")}
                                                            title="Approve this leave request"
                                                        >
                                                            {actionId === r.id ? "…" : "✓ Approve"}
                                                        </button>
                                                        <button
                                                            className="small-btn reject"
                                                            disabled={actionId === r.id}
                                                            onClick={() => changeStatus(r.id, "Rejected")}
                                                            title="Reject this leave request"
                                                        >
                                                            {actionId === r.id ? "…" : "✗ Reject"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "#bbb", fontSize: "11px" }}>
                                                        {r.reviewed_on ? `Reviewed ${fmtDate(r.reviewed_on)}` : "—"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
