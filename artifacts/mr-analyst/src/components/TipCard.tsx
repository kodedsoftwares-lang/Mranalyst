import { useTranslation } from "react-i18next";
import { Shield, Target, TrendingUp, Calendar, Clock, Lock } from "lucide-react";
import type { Tip } from "@workspace/api-client-react";
import { useNavigate } from "@/hooks/use-navigate";

interface TipCardProps {
  tip: Tip;
  darkMode?: boolean;
}

const LIME = "#a8ff4d";
const GOLD_BG = "linear-gradient(135deg, #e6b800 0%, #f5d700 50%, #c89400 100%)";
const PRO_GREEN = "#22c55e";

function TierBadge({ tier }: { tier: string }) {
  if (tier === "pro_plus") {
    return (
      <span
        style={{
          background: GOLD_BG,
          color: "#1a0f00",
          fontWeight: 800,
          fontSize: "10px",
          padding: "3px 10px",
          borderRadius: "20px",
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}
      >
        Pro Plus VIP
      </span>
    );
  }
  return (
    <span
      style={{
        background: PRO_GREEN,
        color: "#fff",
        fontWeight: 800,
        fontSize: "10px",
        padding: "3px 10px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
      }}
    >
      Pro VIP
    </span>
  );
}

function TodayBadge() {
  return (
    <span
      style={{
        background: "#3b82f6",
        color: "#fff",
        fontWeight: 700,
        fontSize: "10px",
        padding: "3px 10px",
        borderRadius: "20px",
      }}
    >
      Today
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    won: { label: "Won", bg: "#22c55e", color: "#fff" },
    lost: { label: "Lost", bg: "#ef4444", color: "#fff" },
    pending: { label: "Pending", bg: "#3b82f6", color: "#fff" },
    postponed: { label: "Postponed", bg: "#6b7280", color: "#fff" },
    cancelled: { label: "Cancelled", bg: "#6b7280", color: "#fff" },
    locked: { label: "Locked", bg: "#3b82f6", color: "#fff" },
  };
  const s = config[status] ?? config.locked;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontWeight: 700,
        fontSize: "10px",
        padding: "3px 10px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueColor,
  right,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  value: string;
  valueColor?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "6px" }}>
      <Icon size={14} color={LIME} strokeWidth={2} />
      <span style={{ color: "#888", fontSize: "12px", minWidth: "36px", fontWeight: 500 }}>
        {label}:
      </span>
      <span style={{ flex: 1, color: valueColor ?? "#ddd", fontSize: "12px", fontWeight: 500 }}>
        {value}
      </span>
      {right && <div>{right}</div>}
    </div>
  );
}

export function TipCard({ tip, darkMode = true }: TipCardProps) {
  const { t } = useTranslation();

  const today = new Date().toISOString().slice(0, 10);
  const isToday = tip.match_date === today;
  const cardBg = darkMode ? "#1a2219" : "#f8f8f8";
  const cardBorder = darkMode ? "#2d3d2d" : "#e0e0e0";

  if (tip.is_locked) {
    return (
      <div
        data-testid={`card-tip-${tip.id}`}
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderLeft: `3px solid ${LIME}`,
          borderRadius: "12px",
          padding: "12px 14px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <TierBadge tier={tip.tier} />
          {isToday && <TodayBadge />}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#888", fontSize: "11px" }}>
              <Calendar size={11} color="#888" />
              {isToday ? "Today" : (tip.match_date ?? "")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#888", fontSize: "11px" }}>
              <Clock size={11} color="#888" />
              Locked
            </span>
          </div>
        </div>

        {/* Info rows */}
        <InfoRow icon={Shield} label="Teams" value="Click to Unlock" />
        <InfoRow icon={Target} label="Tip" value="Correct Score / HTFT Locked" />
        <InfoRow
          icon={TrendingUp}
          label="Odds"
          value="Click to Unlock"
          right={<StatusBadge status="pending" />}
        />

        {/* Unlock button */}
        <button
          style={{
            marginTop: "10px",
            width: "auto",
            background: "linear-gradient(135deg, #e6b800, #a8ff4d)",
            border: "none",
            borderRadius: "20px",
            padding: "7px 16px",
            fontWeight: 800,
            fontSize: "12px",
            color: "#0a0a0a",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          onClick={() => window.location.href = "/vip"}
        >
          <Lock size={12} strokeWidth={2.5} />
          Unlock VIP
        </button>
      </div>
    );
  }

  // Format date nicely
  const dateLabel = tip.match_date
    ? new Date(tip.match_date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const timeLabel = tip.match_time
    ? (tip.match_time as string).slice(0, 5)
    : "";

  return (
    <div
      data-testid={`card-tip-${tip.id}`}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderLeft: `3px solid ${LIME}`,
        borderRadius: "12px",
        padding: "12px 14px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <TierBadge tier={tip.tier} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {dateLabel && (
            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#888", fontSize: "11px" }}>
              <Calendar size={11} color="#888" />
              {dateLabel}
            </span>
          )}
          {timeLabel && (
            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#888", fontSize: "11px" }}>
              <Clock size={11} color="#888" />
              {timeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Info rows */}
      <InfoRow icon={Shield} label="Teams" value={tip.teams ?? "—"} />
      <InfoRow icon={Target} label="Tip" value={tip.tip_type ?? "—"} />
      <InfoRow
        icon={TrendingUp}
        label="Odds"
        value={tip.odds != null ? String(tip.odds) : "—"}
        valueColor={LIME}
        right={<StatusBadge status={tip.status} />}
      />
    </div>
  );
}
