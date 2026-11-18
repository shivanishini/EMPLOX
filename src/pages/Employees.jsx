import React, { useEffect, useMemo, useState } from "react";
import {
    addEmployee,
    updateEmployee,
    updateEmployeeStatus,
    getEmployees,
    getEmployeeById,
    getDepartments,
    getRoles
} from "../services/api";

const emptyForm = {
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    joining_date: "",
    department: "",
    role: "",
    employment_type: "Full-Time",
    salary: "",
    status: "Active"
};

export default function Employees({ initialSearch = "" }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [departments, setDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(true);
    const [dropdownError, setDropdownError] = useState("");

    const loadDepartmentsAndRoles = async () => {
        try {
            setDropdownLoading(true);
            setDropdownError("");

            const [departmentData, roleData] = await Promise.all([
                getDepartments(),
                getRoles()
            ]);

            setDepartments(
                Array.isArray(departmentData)
                    ? departmentData.filter(item => item.status === "Active")
                    : []
            );

            setRoles(
                Array.isArray(roleData)
                    ? roleData.filter(item => item.status === "Active")
                    : []
            );

        } catch (err) {
            console.error("Failed to load departments and roles:", err);

            setDropdownError(
                err.message || "Could not load departments and roles."
            );

        } finally {
            setDropdownLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const data = await getEmployees();
            setEmployees(Array.isArray(data) ? data : []);
            setError("");
        } catch (err) {
            console.error("Failed to load employees:", err);
            setError(err.message || "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
        loadDepartmentsAndRoles();
    }, []);

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    const filteredEmployees = useMemo(() => {
        const q = search.trim().toLowerCase();

        return employees.filter(employee => {
            const name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

            const searchableFields = [
                name,
                employee.employee_code || "",
                employee.email || "",
                employee.phone || "",
                employee.role || "",
                employee.department || ""
            ];

            const matchesSearch =
                !q ||
                searchableFields.some(value =>
                    String(value).toLowerCase().includes(q)
                );

            const matchesDepartment =
                !departmentFilter ||
                employee.department === departmentFilter;

            const matchesStatus =
                !statusFilter ||
                employee.status === statusFilter;

            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [employees, search, departmentFilter, statusFilter]);
    // Reset to page 1 whenever search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, departmentFilter, statusFilter, pageSize]);

    // Calculate total pages
    const totalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / pageSize)
    );

    // Keep current page valid when the employee list changes
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Employees to display on the current page
    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;

        return filteredEmployees.slice(
            startIndex,
            startIndex + pageSize
        );
    }, [filteredEmployees, currentPage, pageSize]);

    const handleChange = event => {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
    };

    const handleViewProfile = async (employeeId) => {
        try {
            setProfileLoading(true);
            setProfileError("");
            setSelectedEmployee(null);

            const employee = await getEmployeeById(employeeId);

            setSelectedEmployee(employee);
        } catch (err) {
            console.error("Failed to load employee profile:", err);
            setProfileError(err.message || "Failed to load employee profile.");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleToggleStatus = async (employee) => {
        const currentStatus = employee.status || "Active";

        const newStatus =
            currentStatus === "Active" ? "Inactive" : "Active";

        const employeeName =
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} ${employeeName}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingStatusId(employee.id);
            setError("");
            setSuccess("");

            const result = await updateEmployeeStatus(
                employee.id,
                newStatus
            );

            setSuccess(
                result.message || `Employee ${newStatus.toLowerCase()} successfully.`
            );

            await loadEmployees();

        } catch (err) {
            console.error("Failed to update employee status:", err);
            setError(err.message || "Failed to update employee status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const formatProfileDate = (value) => {
        if (!value) return "—";

        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    const handleEdit = employee => {
        setError("");
        setSuccess("");

        setEditingEmployee(employee);

        setForm({
            employee_code: employee.employee_code || "",
            first_name: employee.first_name || "",
            last_name: employee.last_name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            gender: employee.gender || "",
            date_of_birth: employee.date_of_birth
                ? String(employee.date_of_birth).slice(0, 10)
                : "",
            joining_date: employee.joining_date
                ? String(employee.joining_date).slice(0, 10)
                : "",
            department: employee.department || "",
            role: employee.role || "",
            employment_type: employee.employment_type || "Full-Time",
            salary: employee.salary ?? "",
            status: employee.status || "Active"
        });

        setShowForm(true);
    };


    const handleSubmit = async event => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (
            !form.employee_code ||
            !form.first_name ||
            !form.last_name ||
            !form.email ||
            !form.joining_date
        ) {
            setError(
                "Please fill Employee Code, First Name, Last Name, Email and Joining Date."
            );
            return;
        }

        try {
            setSaving(true);

            let result;

            if (editingEmployee) {
                result = await updateEmployee(editingEmployee.id, form);
            } else {
                result = await addEmployee(form);
            }

            setSuccess(
                result.message ||
                (editingEmployee
                    ? "Employee updated successfully."
                    : "Employee added successfully.")
            );

            setForm(emptyForm);
            setEditingEmployee(null);
            setShowForm(false);

            await loadEmployees();

        } catch (err) {
            console.error("Failed to save employee:", err);
            setError(err.message || "Failed to save employee.");
        } finally {
            setSaving(false);
        }
    };

    // Employee profile loading screen
    if (profileLoading) {
        return (
            <div className="placeholder-page">
                <div className="panel employee-profile-panel">
                    <p>Loading employee profile...</p>
                </div>
            </div>
        );
    }

    // Employee profile error screen
    if (profileError) {
        return (
            <div className="placeholder-page">
                <div className="panel employee-profile-panel">
                    <div className="error-message">{profileError}</div>

                    <button
                        className="secondary-btn"
                        onClick={() => setProfileError("")}
                    >
                        Back to Employee Directory
                    </button>
                </div>
            </div>
        );
    }

    // Employee profile screen
    if (selectedEmployee) {
        const employee = selectedEmployee;
        const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

        return (
            <div className="placeholder-page employee-profile-page">

                <button
                    className="secondary-btn profile-back-btn"
                    onClick={() => setSelectedEmployee(null)}
                >
                    ← Back to Employee Directory
                </button>

                <section className="panel employee-profile-header">
                    <div className="profile-avatar">
                        {fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="profile-heading">
                        <span className="eyebrow">EMPLOYEE PROFILE</span>
                        <h2>{fullName || "Employee"}</h2>
                        <p>
                            {employee.role || "Role not assigned"}
                            {" · "}
                            {employee.department || "Department not assigned"}
                        </p>
                        <span className={`status ${(employee.status || "Active").toLowerCase()}`}>
                            {employee.status || "Active"}
                        </span>
                    </div>
                </section>

                <section className="panel employee-profile-section">
                    <div className="panel-head">
                        <div>
                            <h3>Personal Information</h3>
                            <p>Employee contact and personal details</p>
                        </div>
                    </div>

                    <div className="profile-details-grid">
                        <ProfileField label="Employee Code" value={employee.employee_code} />
                        <ProfileField label="First Name" value={employee.first_name} />
                        <ProfileField label="Last Name" value={employee.last_name} />
                        <ProfileField label="Email Address" value={employee.email} />
                        <ProfileField label="Phone Number" value={employee.phone} />
                        <ProfileField label="Gender" value={employee.gender} />
                        <ProfileField
                            label="Date of Birth"
                            value={formatProfileDate(employee.date_of_birth)}
                        />
                    </div>
                </section>

                <section className="panel employee-profile-section">
                    <div className="panel-head">
                        <div>
                            <h3>Employment Information</h3>
                            <p>Current employment and compensation details</p>
                        </div>
                    </div>

                    <div className="profile-details-grid">
                        <ProfileField label="Department" value={employee.department} />
                        <ProfileField label="Role / Designation" value={employee.role} />
                        <ProfileField
                            label="Employment Type"
                            value={employee.employment_type}
                        />
                        <ProfileField
                            label="Joining Date"
                            value={formatProfileDate(employee.joining_date)}
                        />
                        <ProfileField
                            label="Employment Status"
                            value={employee.status}
                        />
                        <ProfileField
                            label="Salary"
                            value={
                                employee.salary !== null && employee.salary !== undefined
                                    ? `₹${Number(employee.salary).toLocaleString("en-IN")}`
                                    : "Not specified"
                            }
                        />
                    </div>
                </section>

                <div className="profile-actions">
                    <button
                        className="primary-btn"
                        onClick={() => {
                            setSelectedEmployee(null);
                            handleEdit(employee);
                        }}
                    >
                        Edit Employee
                    </button>
                </div>

            </div>
        );
    }


    return (
        <div className="placeholder-page">
            <div className="placeholder-hero">
                <div>
                    <span className="eyebrow">EMPLOX MODULE</span>
                    <h2>Employees</h2>
                    <p>Manage employee profiles, contact details and employment information.</p>
                </div>
                <button
                    className="primary-btn"
                    onClick={() => {
                        setError("");
                        setSuccess("");
                        setEditingEmployee(null);
                        setForm(emptyForm);
                        setShowForm(true);
                    }}
                >
                    + Add Employee
                </button>
            </div>

            {success && <div className="success-message">✓ {success}</div>}
            {error && <div className="error-message">⚠ {error}</div>}
            {dropdownError && (
                <div className="error-message">
                    ⚠ {dropdownError}
                </div>
            )}

            {showForm && (
                <section className="panel employee-form-panel">
                    <div className="panel-head">
                        <div>
                            <h3>
                                {editingEmployee ? "Edit Employee" : "Add New Employee"}
                            </h3>

                            <p>
                                {editingEmployee
                                    ? "Update the employee information below."
                                    : "Enter the employee information below."}
                            </p>
                        </div>
                        <button type="button" className="close-btn" onClick={() => setShowForm(false)}>✕</button>
                    </div>

                    <form className="employee-form" onSubmit={handleSubmit}>
                        <div className="form-section-title">Basic Information</div>
                        <div className="form-grid">
                            <FormInput
                                label="Employee Code *"
                                name="employee_code"
                                value={form.employee_code}
                                onChange={handleChange}
                                placeholder="EMP005"
                                required
                                readOnly={Boolean(editingEmployee)}
                            />
                            <FormInput label="First Name *" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Shivani" required />
                            <FormInput label="Last Name *" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Sharma" required />
                            <FormInput label="Email *" type="email" name="email" value={form.email} onChange={handleChange} placeholder="employee@example.com" required />
                            <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
                            <FormSelect label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["", "Female", "Male", "Other"]} labels={["Select gender", "Female", "Male", "Other"]} />
                            <FormInput label="Date of Birth" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                            <FormInput label="Joining Date *" type="date" name="joining_date" value={form.joining_date} onChange={handleChange} required />
                        </div>

                        <div className="form-section-title">Employment Information</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Department</label>

                                <select
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    disabled={dropdownLoading}
                                >
                                    <option value="">
                                        {dropdownLoading
                                            ? "Loading departments..."
                                            : "Select department"}
                                    </option>

                                    {editingEmployee &&
                                        form.department &&
                                        !departments.some(item => item.name === form.department) && (
                                            <option value={form.department}>
                                                {form.department} (Existing)
                                            </option>
                                        )}

                                    {departments.map(department => (
                                        <option
                                            key={department.id}
                                            value={department.name}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Role / Designation</label>

                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    disabled={dropdownLoading}
                                >
                                    <option value="">
                                        {dropdownLoading
                                            ? "Loading roles..."
                                            : "Select role"}
                                    </option>

                                    {editingEmployee &&
                                        form.role &&
                                        !roles.some(item => item.name === form.role) && (
                                            <option value={form.role}>
                                                {form.role} (Existing)
                                            </option>
                                        )}

                                    {roles.map(role => (
                                        <option
                                            key={role.id}
                                            value={role.name}
                                        >
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <FormSelect label="Employment Type" name="employment_type" value={form.employment_type} onChange={handleChange} options={["Full-Time", "Part-Time", "Contract", "Intern"]} />
                            <FormInput label="Salary" type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="45000" min="0" />
                            <FormSelect label="Status" name="status" value={form.status} onChange={handleChange} options={["Active", "Inactive"]} />

                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingEmployee(null);
                                    setForm(emptyForm);
                                    setError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="primary-btn" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingEmployee
                                        ? "Save Changes"
                                        : "Save Employee"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <div className="panel employee-toolbar">
                <div>
                    <strong>{filteredEmployees.length}</strong>
                    <span>Employees Found</span>
                </div>

                <div className="employee-filter-controls">
                    <input
                        type="text"
                        placeholder="Search name, email, code..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                    >
                        <option value="">All Departments</option>

                        {departments.map(department => (
                            <option key={department.id} value={department.name}>
                                {department.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                            setSearch("");
                            setDepartmentFilter("");
                            setStatusFilter("");
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <section className="panel table-panel">
                <div className="panel-head">
                    <div>
                        <h3>Employee Directory</h3>
                        <p>{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found</p>
                    </div>
                </div>

                {loading ? (
                    <div className="table-message">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="table-message">
                        <h3>No employees found</h3>
                        <p>Try changing your search or add a new employee.</p>
                    </div>
                ) : (
                    <div className="responsive-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>EMPLOYEE</th>
                                    <th>CODE</th>
                                    <th>POSITION</th>
                                    <th>DEPARTMENT</th>
                                    <th>PHONE</th>
                                    <th>JOINING DATE</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEmployees.map(employee => {
                                    const name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Unknown Employee";
                                    return (
                                        <tr key={employee.id}>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="small-avatar">{name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <strong>{name}</strong>
                                                        <small>{employee.email || ""}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{employee.employee_code}</td>
                                            <td>{employee.role || "Not assigned"}</td>
                                            <td>{employee.department || "Not assigned"}</td>
                                            <td>{employee.phone || "-"}</td>
                                            <td>{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString("en-IN") : "-"}</td>
                                            <td><span className={`status ${(employee.status || "Active").toLowerCase().replace(" ", "-")}`}>{employee.status || "Active"}</span></td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        onClick={() => handleViewProfile(employee.id)}
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        onClick={() => handleEdit(employee)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        disabled={updatingStatusId === employee.id}
                                                        onClick={() => handleToggleStatus(employee)}
                                                    >
                                                        {updatingStatusId === employee.id
                                                            ? "Updating..."
                                                            : employee.status === "Inactive"
                                                                ? "Activate"
                                                                : "Deactivate"}
                                                    </button>
                                                </div>
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

function FormInput({ label, ...props }) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <input {...props} />
        </div>
    );
}

function FormSelect({ label, options, labels, ...props }) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <select {...props}>
                {options.map((option, index) => (
                    <option key={option || `empty-${index}`} value={option}>
                        {labels ? labels[index] : option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ProfileField({ label, value }) {
    return (
        <div className="profile-field">
            <span>{label}</span>
            <strong>{value || "—"}</strong>
        </div>
    );
}
