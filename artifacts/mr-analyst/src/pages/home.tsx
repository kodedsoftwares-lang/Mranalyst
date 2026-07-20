import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useGetTips, useGetStats, getGetTipsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import type { TierStats } from "@workspace/api-client-react";
import { TipCard } from "@/components/TipCard";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const LIME = "#a8ff4d";
const GOLD_BG = "linear-gradient(135deg, #e6b800 0%, #f5d700 50%, #c89400 100%)";
const PRO_GREEN = "#22c55e";
const CARD_DARK = "#1a2219";
const CARD_LIGHT = "#fff";
const BORDER_DARK = "#2d3d2d";
const BORDER_LIGHT = "#e0e0e0";

type Tier = "pro_plus" | "pro";

interface HomePageProps {
  darkMode?: boolean;
}

interface StatsData { pro_plus?: TierStats; pro?: TierStats; }

function Ticker({ stats, darkMode }: { stats: StatsData | undefined; darkMode: boolean }) {
  if (!stats) return null;
  const pps = stats.pro_plus;
  const ps = stats.pro;

  const items = [
    { label: "Pro Plus VIP", type: "badge", bg: GOLD_BG, color: "#1a0f00" },
    { label: `Played: ${(pps?.won ?? 0) + (pps?.lost ?? 0)}`, type: "text" },
    { label: `W: ${pps?.won ?? 0} (${pps?.win_rate ?? 0}%)`, type: "won" },
    { label: `L: ${pps?.lost ?? 0} (${100 - (pps?.win_rate ?? 100)}%)`, type: "lost" },
    { label: `Pending: ${pps?.pending ?? 0}`, type: "text" },
    { label: `Postponed: ${pps?.postponed ?? 0}`, type: "text" },
    { label: "Pro VIP", type: "badge", bg: PRO_GREEN, color: "#fff" },
    { label: `Played: ${(ps?.won ?? 0) + (ps?.lost ?? 0)}`, type: "text" },
    { label: `W: ${ps?.won ?? 0} (${ps?.win_rate ?? 0}%)`, type: "won" },
    { label: `L: ${ps?.lost ?? 0} (${100 - (ps?.win_rate ?? 100)}%)`, type: "lost" },
    { label: `Pending: ${ps?.pending ?? 0}`, type: "text" },
    { label: `Postponed: ${ps?.postponed ?? 0}`, type: "text" },
  ];

  const renderItem = (item: typeof items[0], i: number) => {
    if (item.type === "badge") {
      return (
        <span
          key={i}
          style={{
            background: item.bg,
            color: item.color,
            fontWeight: 800,
            fontSize: "10px",
            padding: "3px 12px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginRight: "4px",
          }}
        >
          {item.label}
        </span>
      );
    }
    if (item.type === "won") {
      return (
        <span
          key={i}
          style={{
            background: "#22c55e",
            color: "#fff",
            fontWeight: 700,
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginRight: "4px",
          }}
        >
          {item.label}
        </span>
      );
    }
    if (item.type === "lost") {
      return (
        <span
          key={i}
          style={{
            background: "#ef4444",
            color: "#fff",
            fontWeight: 700,
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginRight: "4px",
          }}
        >
          {item.label}
        </span>
      );
    }
    return (
      <span
        key={i}
        style={{
          color: darkMode ? "#aaa" : "#555",
          fontSize: "11px",
          whiteSpace: "nowrap",
          flexShrink: 0,
          marginRight: "12px",
        }}
      >
        {item.label}
      </span>
    );
  };

  return (
    <div
      style={{
        overflow: "hidden",
        padding: "8px 0",
        position: "relative",
        borderTop: `1px solid ${darkMode ? "#1a2219" : "#e0e0e0"}`,
        borderBottom: `1px solid ${darkMode ? "#1a2219" : "#e0e0e0"}`,
      }}
    >
      <style>{`
        @keyframes mr-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .mr-ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: mr-ticker 22s linear infinite;
        }
        .mr-ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="mr-ticker-track">
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}

export default function HomePage({ darkMode = true }: HomePageProps) {
  const [activeTier, setActiveTier] = useState<Tier>("pro_plus");
  const [showCount, setShowCount] = useState(10);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const { data: pubConfig } = useQuery<Record<string, string>>({
    queryKey: ["pub-config"],
    queryFn: () => fetch(`${BASE}/api/config`).then(r => r.json()),
    staleTime: 60_000,
  });
  const heroBgUrl = pubConfig?.hero_bg_url ?? "";
  const supportEmail = pubConfig?.support_email || "support@mranalyst.org";

  const { data: tips, isLoading: tipsLoading } = useGetTips(
    { tier: activeTier },
    { query: { queryKey: getGetTipsQueryKey({ tier: activeTier }) } },
  );

  const { data: stats } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() },
  });

  const tierStats = activeTier === "pro_plus" ? stats?.pro_plus : stats?.pro;
  const today = new Date().toISOString().slice(0, 10);

  const todayTips = (tips || []).filter((t) => t.match_date === today);
  const todayIds = new Set(todayTips.map((t) => t.id));
  const pendingTips = (tips || []).filter(
    (t) => (t.status === "pending" || t.status === "locked") && !todayIds.has(t.id),
  );
  const pastTips = (tips || []).filter(
    (t) => t.match_date !== today && t.status !== "pending" && t.status !== "locked",
  );

  const displayedPast = pastTips.slice(0, showCount);
  const allCurrent = [...todayTips, ...pendingTips];

  const cardBg = darkMode ? CARD_DARK : CARD_LIGHT;
  const cardBorder = darkMode ? BORDER_DARK : BORDER_LIGHT;
  const textMain = darkMode ? "#fff" : "#111";
  const textSub = darkMode ? "#aaa" : "#555";

  const tierLabel = activeTier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP";
  const wonCount = tierStats?.won ?? 0;
  const lostCount = tierStats?.lost ?? 0;

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "80px",
      }}
    >
      {/* Background image + texture */}
      {heroBgUrl ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${heroBgUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: 0.18,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(13,15,13,0.6) 0%, rgba(13,15,13,0.85) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: darkMode
              ? "radial-gradient(ellipse at 50% 0%, rgba(30,60,20,0.4) 0%, rgba(0,0,0,0) 60%)"
              : "none",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Support bar */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 16px 8px" }}>
          <a
            href={`mailto:${supportEmail}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "20px",
              background: "transparent",
              border: `1px solid ${darkMode ? "#333" : "#ccc"}`,
              color: textSub,
              fontSize: "11px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <Mail size={12} />
            {supportEmail}
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Mr Analyst", url: window.location.href });
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "20px",
              background: "transparent",
              border: `1px solid ${darkMode ? "#4ade80" : "#22c55e"}`,
              color: darkMode ? "#4ade80" : "#16a34a",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Share2 size={12} />
            Share
          </button>
        </div>

        {/* Tier tabs */}
        <div style={{ padding: "0 16px 8px" }}>
          <div
            style={{
              display: "flex",
              gap: "0",
              background: darkMode ? "#111" : "#e8e8e8",
              borderRadius: "10px",
              padding: "4px",
            }}
          >
            {(["pro_plus", "pro"] as Tier[]).map((tier) => {
              const active = activeTier === tier;
              const label = tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP";
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  data-testid={`tab-${tier}`}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: active ? LIME : "transparent",
                    color: active ? "#0a0a0a" : (darkMode ? "#777" : "#999"),
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats ticker */}
        <Ticker stats={stats} darkMode={darkMode} />

        {/* Today's tips */}
        <div style={{ padding: "8px 16px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontWeight: 800, fontSize: "14px", color: textMain }}>Today's Tips</span>
            <span
              style={{
                background: LIME,
                color: "#0a0a0a",
                fontWeight: 800,
                fontSize: "11px",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {allCurrent.length}
            </span>
          </div>

          {tipsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{ height: "140px", borderRadius: "12px", background: cardBg, border: `1px solid ${cardBorder}` }}
                />
              ))}
            </div>
          ) : allCurrent.length === 0 ? (
            <p style={{ color: textSub, fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
              No tips available today
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {allCurrent.map((tip) => (
                <TipCard key={tip.id} tip={tip} darkMode={darkMode} />
              ))}
            </div>
          )}
        </div>

        {/* Past results */}
        {pastTips.length > 0 && (
          <div style={{ padding: "16px 16px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "14px", color: textMain, flex: 1 }}>
                Results - {tierLabel}
              </span>
              <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "12px" }}>W: {wonCount}</span>
              <span style={{ color: textSub, fontWeight: 500, fontSize: "12px" }}>L: {lostCount}</span>
              <span style={{ color: textSub, fontSize: "12px" }}>Show</span>
              <select
                value={showCount}
                onChange={(e) => setShowCount(Number(e.target.value))}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  color: textMain,
                  borderRadius: "8px",
                  padding: "3px 6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {displayedPast.map((tip) => (
                <TipCard key={tip.id} tip={tip} darkMode={darkMode} />
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer accordion */}
        <div style={{ margin: "20px 16px 0" }}>
          <button
            onClick={() => setDisclaimerOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: darkMode ? "#1a1a1a" : "#e8e8e8",
              border: `1px solid ${cardBorder}`,
              borderRadius: disclaimerOpen ? "12px 12px 0 0" : "12px",
              color: textMain,
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <span>Disclaimer</span>
            {disclaimerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {disclaimerOpen && (
            <div
              style={{
                background: darkMode ? "#141414" : "#f5f5f5",
                border: `1px solid ${cardBorder}`,
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "14px 16px",
                fontSize: "12px",
                color: textSub,
                lineHeight: 1.6,
              }}
            >
              <p>
                This content is for informational and educational purposes only and does not constitute
                financial or betting advice. Past performance is not indicative of future results.
              </p>
              <br />
              <p>
                We do not collect personal data directly on this page beyond essential session storage
                required for functionality. Third-party services such as advertising networks, analytics
                tools, and platform webviews may process data under their own policies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
