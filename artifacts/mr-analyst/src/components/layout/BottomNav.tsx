import { useLocation, Link } from "wouter";
import { Home, Lock, Download, BarChart2, Radio } from "lucide-react";

const tabs = [
  { path: "/", key: "home", icon: Home, label: "HOME" },
  { path: "/privacy", key: "privacy", icon: Lock, label: "PRIVACY" },
  { path: "/vip", key: "vip", icon: Download, label: "VIP" },
  { path: "/stats", key: "stats", icon: BarChart2, label: "STATS" },
  { path: "/live", key: "live", icon: Radio, label: "LIVE" },
];

interface BottomNavProps {
  darkMode: boolean;
}

export function BottomNav({ darkMode }: BottomNavProps) {
  const [location] = useLocation();

  return (
    <nav
      data-testid="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        zIndex: 50,
        display: "flex",
        background: darkMode ? "#0a0a0a" : "#f5f5f5",
        borderTop: darkMode ? "1px solid #1a1a1a" : "1px solid #e0e0e0",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      {tabs.map(({ path, key, icon: Icon, label }) => {
        const isActive = location === path || (path !== "/" && location.startsWith(path));
        return (
          <Link
            key={key}
            href={path}
            data-testid={`nav-tab-${key}`}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 4px",
              textDecoration: "none",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: isActive ? "6px 12px" : "6px 4px",
                borderRadius: "12px",
                background: isActive ? "#a8ff4d" : "transparent",
                minWidth: isActive ? "52px" : undefined,
              }}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? "#0a0a0a" : (darkMode ? "#888" : "#999")}
              />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: isActive ? "#0a0a0a" : (darkMode ? "#888" : "#999"),
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
