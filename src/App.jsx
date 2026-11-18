import React, { useState } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import GenericPage from "./pages/GenericPage";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Applications from "./pages/Applications";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Roles from "./pages/Roles";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("emplox_user");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const [active, setActive] = useState("dashboard");
    const [employeeSearch, setEmployeeSearch] = useState("");

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        setActive("dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("emplox_token");
        localStorage.removeItem("emplox_user");

        setUser(null);
        setActive("dashboard");
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    // Employee dashboard will be added in Step 2.
    // For now, employees can login but we keep them out
    // of the admin pages until their dashboard is created.
    if (user.role === "Employee") {
        return <EmployeeDashboard user={user} onLogout={handleLogout} />;
    }

    const goToEmployees = () => {
        setEmployeeSearch("");
        setActive("employees");
    };

    const handleSearch = (query) => {
        setEmployeeSearch(query);
        setActive("employees");
    };

    return (
        <div className="app">
            <Sidebar
                active={active}
                setActive={setActive}
                onLogout={handleLogout}
            />

            <main className="main">
                <Topbar
                    active={active}
                    onSearch={handleSearch}
                    user={user}
                    onLogout={handleLogout}
                />

                <div className="page">
                    {active === "dashboard" && (
                        <Dashboard
                            onAddEmployee={goToEmployees}
                            onViewEmployees={goToEmployees}
                        />
                    )}

                    {active === "employees" && (
                        <Employees
                            initialSearch={employeeSearch}
                        />
                    )}

                    {active === "attendance" && (
                        <Attendance />
                    )}

                    {active === "leave" && <Leave />}

                    {active === "payroll" && <Payroll />}

                    {active === "applications" && (
                        <Applications />
                    )}

                    {active === "departments" && (
                        <Departments />
                    )}

                    {active === "roles" && <Roles />}

                    {![
                        "dashboard",
                        "employees",
                        "attendance",
                        "leave",
                        "payroll",
                        "applications",
                        "departments",
                        "roles"
                    ].includes(active) && (
                        <GenericPage type={active} />
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;