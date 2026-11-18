const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `API request failed: ${response.status}`);
    return data;
}

async function request(url, options = {}) {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("emplox_token") : null;
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    return handleResponse(await fetch(`${API_BASE_URL}${url}`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
            ...(options.headers || {})
        },
        ...options
    }));
}

export const getDashboardStats = () => request("/dashboard-stats");
export const getEmployees = () => request("/employees");
export const getEmployeeById = (id) =>
    request(`/employees/${id}`);
export const updateEmployeeStatus = (id, status) =>
    request(`/employees/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });
export const addEmployee = (employee) => request("/employees", { method: "POST", body: JSON.stringify(employee) });
export const updateEmployee = (id, employee) => request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(employee) });
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: "DELETE" });

export const getAttendance = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.status) params.set("status", filters.status);
    if (filters.employee_id) params.set("employee_id", filters.employee_id);
    const qs = params.toString();
    return request(qs ? `/attendance?${qs}` : "/attendance");
};
export const saveAttendance = (data) => request("/attendance", { method: "POST", body: JSON.stringify(data) });
export const updateAttendance = (id, data) => request(`/attendance/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getLeaveRequests = () => request("/leave");
export const createLeaveRequest = (data) => request("/leave", { method: "POST", body: JSON.stringify(data) });
export const updateLeaveRequest = (id, data) => request(`/leave/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getPayroll = (month) => request(`/payroll?month=${encodeURIComponent(month)}`);
export const runPayroll = (month) => request("/payroll/run", { method: "POST", body: JSON.stringify({ month }) });
export const updatePayroll = (id, data) => request(`/payroll/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const getApplications = () => request("/applications");
export const createApplication = (data) => request("/applications", { method: "POST", body: JSON.stringify(data) });
export const updateApplication = (id, data) => request(`/applications/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Departments
export const getDepartments = () => request("/departments");

export const addDepartment = (data) =>
    request("/departments", {
        method: "POST",
        body: JSON.stringify(data)
    });

export const updateDepartment = (id, data) =>
    request(`/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteDepartment = (id) =>
    request(`/departments/${id}`, {
        method: "DELETE"
    });


// Roles
export const getRoles = () => request("/roles");

export const addRole = (data) =>
    request("/roles", {
        method: "POST",
        body: JSON.stringify(data)
    });

export const updateRole = (id, data) =>
    request(`/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteRole = (id) =>
    request(`/roles/${id}`, {
        method: "DELETE"
    });