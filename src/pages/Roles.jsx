import React, { useEffect, useState } from "react";
import {
    getRoles,
    addRole,
    updateRole,
    deleteRole
} from "../services/api";

const emptyForm = {
    name: "",
    description: "",
    status: "Active"
};

export default function Roles() {

    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadRoles = async () => {
        try {
            setLoading(true);

            const data = await getRoles();

            setRoles(Array.isArray(data) ? data : []);
            setError("");

        } catch (err) {
            setError(err.message || "Failed to load roles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
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

    const openEdit = (role) => {

        setEditingId(role.id);

        setForm({
            name: role.name || "",
            description: role.description || "",
            status: role.status || "Active"
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("Role name is required.");
            return;
        }

        try {

            setSaving(true);
            setError("");

            if (editingId) {

                await updateRole(editingId, form);

                setSuccess("Role updated successfully.");

            } else {

                await addRole(form);

                setSuccess("Role added successfully.");
            }

            setForm(emptyForm);
            setEditingId(null);
            setShowForm(false);

            await loadRoles();

        } catch (err) {

            setError(err.message || "Failed to save role.");

        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role) => {

        const confirmed = window.confirm(
            `Delete "${role.name}"?`
        );

        if (!confirmed) return;

        try {

            await deleteRole(role.id);

            setSuccess("Role deleted successfully.");

            await loadRoles();

        } catch (err) {

            setError(err.message || "Failed to delete role.");

        }
    };

    return (
        <div className="placeholder-page">

            <div className="placeholder-hero">

                <div>

                    <span className="eyebrow">
                        EMPLOX MODULE
                    </span>

                    <h2>Roles</h2>

                    <p>
                        Manage employee roles and designations.
                    </p>

                </div>

                <button
                    className="primary-btn"
                    onClick={openAdd}
                >
                    + Add Role
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
                                    ? "Edit Role"
                                    : "Add Role"}
                            </h3>

                            <p>
                                Enter role information.
                            </p>

                        </div>

                        <button
                            className="close-btn"
                            onClick={() =>
                                setShowForm(false)
                            }
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

                                <label>
                                    Role Name *
                                </label>

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Software Developer"
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
                                style={{
                                    gridColumn: "1 / -1"
                                }}
                            >

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Responsible for developing and maintaining software applications."
                                    rows="4"
                                />

                            </div>

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                    setShowForm(false)
                                }
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
                                        ? "Update Role"
                                        : "Save Role"}

                            </button>

                        </div>

                    </form>

                </section>

            )}

            <div className="panel employee-toolbar">

                <div>

                    <strong>
                        {roles.length}
                    </strong>

                    <span>
                        Total Roles
                    </span>

                </div>

            </div>

            <section className="panel table-panel">

                <div className="panel-head">

                    <div>

                        <h3>
                            Role Directory
                        </h3>

                        <p>
                            Manage employee roles and
                            designations.
                        </p>

                    </div>

                </div>

                {loading ? (

                    <div className="table-message">
                        Loading roles...
                    </div>

                ) : roles.length === 0 ? (

                    <div className="table-message">

                        <h3>
                            No roles yet
                        </h3>

                        <p>
                            Click "Add Role" to create one.
                        </p>

                    </div>

                ) : (

                    <div className="responsive-table">

                        <table>

                            <thead>

                                <tr>
                                    <th>ROLE</th>
                                    <th>DESCRIPTION</th>
                                    <th>EMPLOYEES</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>

                            </thead>

                            <tbody>

                                {roles.map((role) => (

                                    <tr key={role.id}>

                                        <td>
                                            <strong>
                                                {role.name}
                                            </strong>
                                        </td>

                                        <td>
                                            {role.description || "-"}
                                        </td>

                                        <td>
                                            {role.employee_count || 0}
                                        </td>

                                        <td>

                                            <span
                                                className={`status ${role.status.toLowerCase()}`}
                                            >
                                                {role.status}
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
                                                        openEdit(role)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="danger-btn"
                                                    onClick={() =>
                                                        handleDelete(role)
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