import React, { useEffect, useState } from "react";
import {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment
} from "../services/api";

const emptyForm = {
    name: "",
    description: "",
    status: "Active"
};

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadDepartments = async () => {
        try {
            setLoading(true);

            const data = await getDepartments();

            setDepartments(
                Array.isArray(data) ? data : []
            );

            setError("");

        } catch (err) {
            console.error("Failed to load departments:", err);

            setError(
                err.message || "Failed to load departments."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const openEdit = (department) => {
        setEditingId(department.id);

        setForm({
            name: department.name || "",
            description: department.description || "",
            status: department.status || "Active"
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("Department name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingId) {
                await updateDepartment(editingId, form);
                setSuccess("Department updated successfully.");
            } else {
                await addDepartment(form);
                setSuccess("Department added successfully.");
            }

            setForm(emptyForm);
            setEditingId(null);
            setShowForm(false);

            await loadDepartments();

        } catch (err) {
            setError(err.message || "Failed to save department.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (department) => {
        const confirmed = window.confirm(
            `Delete "${department.name}"?`
        );

        if (!confirmed) return;

        try {
            await deleteDepartment(department.id);
            setSuccess("Department deleted successfully.");
            await loadDepartments();
        } catch (err) {
            setError(err.message || "Failed to delete department.");
        }
    };

    return (
        <div className="placeholder-page">

            <div className="placeholder-hero">
                <div>
                    <span className="eyebrow">EMPLOX MODULE</span>
                    <h2>Departments</h2>
                    <p>
                        Manage departments and organize employees into teams.
                    </p>
                </div>

                <button
                    className="primary-btn"
                    onClick={openAdd}
                >
                    + Add Department
                </button>
            </div>

            {success && (
                <div className="success-message">
                    ✓ {success}
                </div>
            )}

            {error && (
                <div className="error-message">
                    ⚠ {error}
                </div>
            )}

            {showForm && (
                <section className="panel employee-form-panel">

                    <div className="panel-head">
                        <div>
                            <h3>
                                {editingId
                                    ? "Edit Department"
                                    : "Add Department"}
                            </h3>

                            <p>
                                Enter department information.
                            </p>
                        </div>

                        <button
                            className="close-btn"
                            onClick={() => setShowForm(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <form
                        className="employee-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-grid">

                            <div className="form-group">
                                <label>Department Name *</label>

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Engineering"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                            <div
                                className="form-group"
                                style={{ gridColumn: "1 / -1" }}
                            >
                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Software development and technology team"
                                    rows="4"
                                />
                            </div>

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Department"
                                        : "Save Department"}
                            </button>

                        </div>

                    </form>

                </section>
            )}

            <div className="panel employee-toolbar">

                <div>
                    <strong>{departments.length}</strong>
                    <span>Total Departments</span>
                </div>

            </div>

            <section className="panel table-panel">

                <div className="panel-head">

                    <div>
                        <h3>Department Directory</h3>
                        <p>
                            Manage your organization's departments.
                        </p>
                    </div>

                </div>

                {loading ? (
                    <div className="table-message">
                        Loading departments...
                    </div>
                ) : departments.length === 0 ? (
                    <div className="table-message">
                        <h3>No departments yet</h3>
                        <p>
                            Click "Add Department" to create one.
                        </p>
                    </div>
                ) : (
                    <div className="responsive-table">

                        <table>

                            <thead>
                                <tr>
                                    <th>DEPARTMENT</th>
                                    <th>DESCRIPTION</th>
                                    <th>EMPLOYEES</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>

                                {departments.map((department) => (
                                    <tr key={department.id}>

                                        <td>
                                            <strong>
                                                {department.name}
                                            </strong>
                                        </td>

                                        <td>
                                            {department.description || "-"}
                                        </td>

                                        <td>
                                            {department.employee_count || 0}
                                        </td>

                                        <td>
                                            <span
                                                className={`status ${department.status.toLowerCase()}`}
                                            >
                                                {department.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    flexWrap: "wrap"
                                                }}
                                            >

                                                <button
                                                    className="secondary-btn"
                                                    onClick={() =>
                                                        openEdit(department)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="danger-btn"
                                                    onClick={() =>
                                                        handleDelete(department)
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

        </div>
    );
}