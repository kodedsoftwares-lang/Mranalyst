import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Link } from "wouter";

interface HeaderProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Header({ darkMode, onToggleDark }: HeaderProps) {
  const { isAdmin } = useAuth();

  return (
    <header
      data-testid="header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#0a0a0a",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      <Link href="/" data-testid="link-home-logo">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          {/* Logo badge */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#1a1a1a",
              border: "1px solid #333",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ⚽
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "0.01em" }}>
            Mr Analyst
          </span>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isAdmin && (
          <Link href="/admin">
            <button
              data-testid="button-admin-panel"
              style={{
                background: "transparent",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#a8ff4d",
                fontSize: "0.7rem",
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              Admin
            </button>
          </Link>
        )}
        <button
          onClick={onToggleDark}
          data-testid="button-theme-toggle"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: darkMode ? "#1a1a1a" : "#f0f0f0",
            border: darkMode ? "1px solid #333" : "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {darkMode
            ? <Moon size={16} color="#aaa" />
            : <Sun size={16} color="#555" />
          }
        </button>
      </div>
    </header>
  );
}
