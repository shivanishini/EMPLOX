import React, { useEffect, useRef, useState } from "react";
import { navItems } from "../data/navigation";

export default function Topbar({ active, onSearch, user, onLogout }) {
    const current = navItems.find(n => n.key === active)?.label || "Dashboard";
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery]           = useState("");
    const [menuOpen, setMenuOpen]     = useState(false);
    const inputRef = useRef(null);
    const menuRef  = useRef(null);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    // Close profile menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const submitSearch = e => {
        e.preventDefault();
        const value = query.trim();
        if (!value) return;
        onSearch?.(value);
        setSearchOpen(false);
        setQuery("");
    };

    const displayName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Admin"
        : "Admin";

    const initials = displayName
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="topbar">
            <div>
                <div className="breadcrumb">
                    EMPLOX <span>/</span> {current.toUpperCase()}
                </div>
                <h1>{current}</h1>
            </div>

            <div className="top-actions">
                {searchOpen ? (
                    <form className="top-search" onSubmit={submitSearch}>
                        <span>⌕</span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search employees..."
                            aria-label="Search employees"
                        />
                        <button
                            type="button"
                            className="top-search-close"
                            onClick={() => { setQuery(""); setSearchOpen(false); }}
                        >
                            ✕
                        </button>
                    </form>
                ) : (
                    <button
                        className="icon-btn"
                        aria-label="Search employees"
                        title="Search employees"
                        onClick={() => setSearchOpen(true)}
                    >
                        ⌕
                    </button>
                )}

                <button className="icon-btn notification" aria-label="Notifications">
                    ♧
                    <i></i>
                </button>

                {/* Profile + dropdown */}
                <div className="profile" ref={menuRef} style={{ position: "relative", cursor: "pointer" }} onClick={() => setMenuOpen(o => !o)}>
                    <div className="avatar">{initials}</div>
                    <div>
                        <strong>{displayName}</strong>
                        <small>{user?.role || "Administrator"}</small>
                    </div>
                    <span>⌄</span>

                    {menuOpen && (
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 10px)",
                            right: 0,
                            background: "#fff",
                            border: "1px solid #e8ebef",
                            borderRadius: "12px",
                            boxShadow: "0 10px 30px rgba(0,0,0,.1)",
                            minWidth: "180px",
                            zIndex: 100,
                            overflow: "hidden"
                        }}>
                            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f1f3" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700 }}>{displayName}</div>
                                <div style={{ fontSize: "11px", color: "#9aa1ac", marginTop: "2px" }}>{user?.email || "admin@emplox.com"}</div>
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); onLogout?.(); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    padding: "11px 16px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    color: "#c65353",
                                    fontWeight: 600,
                                    textAlign: "left"
                                }}
                            >
                                ↪ Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
