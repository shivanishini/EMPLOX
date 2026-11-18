import React from "react";
import { navItems } from "../data/navigation";
export default function Sidebar({ active, setActive, onLogout }) {
    return (
        <aside className="sidebar">
            <div className="brand">
                <span className="brand-mark">E</span>
                <span>EMPLOX</span>
            </div>

            <div className="nav-section">
                <span className="nav-title">MAIN MENU</span>

                {navItems.map(item => (
                    <button
                        key={item.key}
                        className={`nav-item ${active === item.key ? "active" : ""
                            }`}
                        onClick={() => setActive(item.key)}
                    >
                        <span className="nav-icon">
                            {item.icon}
                        </span>

                        <span>{item.label}</span>

                        {item.badge && <b>{item.badge}</b>}
                    </button>
                ))}
            </div>

            <div className="sidebar-bottom">
                <div className="help-card">
                    <div className="help-icon">?</div>

                    <strong>Need help?</strong>

                    <small>
                        Contact the system administrator.
                    </small>

                    <button>Get support →</button>
                </div>

                <button
                    className="logout"
                    onClick={onLogout}
                >
                    ↪ <span>Log out</span>
                </button>
            </div>
        </aside>
    );
}