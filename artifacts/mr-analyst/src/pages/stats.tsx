import { useState } from "react";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import type { TierStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const LIME = "#a8ff4d";

interface StatsPageProps {
  darkMode?: boolean;
}

function StatCard({ label, value, darkMode }: { label: string; value: string | number; darkMode: boolean }) {
  const cardBg = darkMode ? "#1a2219" : "#fff";
  const cardBorder = darkMode ? "#2d3d2d" : "#e0e0e0";
  const textSub = darkMode ? "#999" : "#666";

  return (
    <div
      data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: "1.6rem", fontWeight: 800, color: LIME, lineHeight: 1 }}>
        {value}
      </span>
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: textSub,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TierGrid({ stats, tier, darkMode }: { stats: TierStats; tier: string; darkMode: boolean }) {
  const cards = [
    { label: "TOTAL TIPS", value: stats.total },
    { label: "PENDING", value: stats.pending },
    { label: "WON", value: stats.won },
    { label: "WIN RATE", value: `${stats.win_rate}%` },
    { label: "LOST", value: stats.lost },
    { label: "POSTPONED", value: stats.postponed },
    { label: "CANCELED", value: stats.cancelled },
    { label: "TODAY'S TIPS", value: stats.todays_tips },
  ];

  return (
    <>
      <p
        style={{
          color: LIME,
          fontWeight: 800,
          fontSize: "12px",
          padding: "0 16px",
          marginBottom: "8px",
          letterSpacing: "0.02em",
        }}
      >
        {tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP"}
      </p>
      <div
        data-testid="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          padding: "0 16px",
          marginBottom: "16px",
        }}
      >
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} darkMode={darkMode} />
        ))}
      </div>
    </>
  );
}

export default function StatsPage({ darkMode = true }: StatsPageProps) {
  const [tickerSpeed, setTickerSpeed] = useState(15);

  const { data: stats, isLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  const cardBg = darkMode ? "#1a1a1a" : "#fff";
  const cardBorder = darkMode ? "#2a2a2a" : "#e0e0e0";
  const textMain = darkMode ? "#fff" : "#111";
  const textSub = darkMode ? "#aaa" : "#666";

  return (
    <div style={{ position: "relative", paddingBottom: "100px" }}>
      {/* Hero */}
      <div
        style={{
          padding: "40px 20px 20px",
          position: "relative",
          background: darkMode
            ? "linear-gradient(180deg, rgba(10,30,10,0.85) 0%, rgba(0,0,0,0) 100%)"
            : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(168,255,77,0.03) 0px, rgba(168,255,77,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(168,255,77,0.03) 0px, rgba(168,255,77,0.03) 1px, transparent 1px, transparent 40px)",
            pointerEvents: "none",
          }}
        />
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.05em",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          STATISTICS
        </h1>
      </div>

      {/* Stats grids */}
      {isLoading ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "16px" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "80px",
                borderRadius: "12px",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {stats?.pro_plus && (
            <TierGrid stats={stats.pro_plus} tier="pro_plus" darkMode={darkMode} />
          )}
          {stats?.pro && (
            <TierGrid stats={stats.pro} tier="pro" darkMode={darkMode} />
          )}
        </>
      )}

      {/* Detailed stats note */}
      <p
        style={{
          textAlign: "center",
          color: textSub,
          fontSize: "12px",
          padding: "0 20px 16px",
          lineHeight: 1.5,
        }}
      >
        Detailed statistics and performance metrics for both VIP tiers.
      </p>

      {/* App Settings card */}
      <div
        style={{
          margin: "0 16px 10px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <h3 style={{ fontWeight: 800, fontSize: "15px", color: textMain, marginBottom: "6px" }}>
          App Settings
        </h3>
        <p style={{ fontSize: "12px", color: textSub, marginBottom: "12px", lineHeight: 1.5 }}>
          Premium Mr Analyst mode is active with light and dark theme support from the top switch.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            padding: "9px 20px",
            borderRadius: "20px",
            border: "none",
            background: "linear-gradient(135deg, #e6b800 0%, #a8ff4d 100%)",
            color: "#0a0a0a",
            fontWeight: 800,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Delete App Data
        </button>
      </div>

      {/* Ticker Speed card */}
      <div
        style={{
          margin: "0 16px 10px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: "12px",
          padding: "16px",
        }}
      >
        <h3 style={{ fontWeight: 800, fontSize: "15px", color: textMain, marginBottom: "10px" }}>
          Ticker Speed
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: textSub, fontSize: "13px", minWidth: "48px" }}>Speed</span>
          <input
            type="range"
            min={5}
            max={30}
            value={tickerSpeed}
            onChange={(e) => setTickerSpeed(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: LIME,
            }}
          />
          <span style={{ color: textMain, fontWeight: 700, fontSize: "13px", minWidth: "32px", textAlign: "right" }}>
            {tickerSpeed}s
          </span>
        </div>
      </div>

      {/* About card */}
      <div
        style={{
          margin: "0 16px 10px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ fontWeight: 800, fontSize: "15px", color: textMain, marginBottom: "6px" }}>
            About
          </h3>
          <p style={{ fontSize: "12px", color: textSub, lineHeight: 1.5 }}>
            Mr Analyst gives members a clean way to review football analysis, VIP tiers, and match performance.
          </p>
        </div>
      </div>
    </div>
  );
}
