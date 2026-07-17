import { useState, useEffect, useRef } from "react";
import { useGetLiveMessages, useSendLiveMessage, getGetLiveMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const LIME = "#a8ff4d";
const GOLD_BG = "linear-gradient(135deg, #e6b800 0%, #f5d700 50%, #c89400 100%)";
const PRO_GREEN = "#22c55e";

interface LivePageProps {
  darkMode?: boolean;
}

function MessageCard({
  msg,
  darkMode,
}: {
  msg: { user_name: string; user_city?: string | null; message: string; tier: string; created_at: string };
  darkMode: boolean;
}) {
  const isProPlus = msg.tier === "pro_plus";
  const tierLabel = isProPlus ? "Pro Plus VIP" : "Pro VIP";
  const cardBg = isProPlus
    ? (darkMode ? "#2a2218" : "#fdf9ec")
    : (darkMode ? "#1a2219" : "#f0f8f2");
  const cardBorder = isProPlus
    ? (darkMode ? "#3d3220" : "#e8d89a")
    : (darkMode ? "#2d3d2d" : "#b8e0c0");

  const displayName = msg.user_city
    ? `${msg.user_name}, ${msg.user_city}`
    : msg.user_name;

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontWeight: 700, fontSize: "12px", color: darkMode ? "#ddd" : "#222" }}>
          {displayName}
        </span>
        <span style={{ fontSize: "10px", color: darkMode ? "#888" : "#666", fontWeight: 600 }}>
          {tierLabel}
        </span>
      </div>
      <p style={{ fontSize: "13px", color: darkMode ? "#ccc" : "#333", lineHeight: 1.5 }}>
        {msg.message}
      </p>
    </div>
  );
}

export default function LivePage({ darkMode = true }: LivePageProps) {
  const { isVip, tier } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState("");
  const [userName] = useState(() => localStorage.getItem("mr_analyst_name") ?? "");
  const [userCity] = useState(() => localStorage.getItem("mr_analyst_city") ?? "");

  const { data: messages, isLoading } = useGetLiveMessages(
    { limit: 50 },
    {
      query: {
        queryKey: getGetLiveMessagesQueryKey({ limit: 50 }),
        refetchInterval: 5000,
      },
    },
  );

  const { mutate: sendMessage, isPending: sending } = useSendLiveMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!isVip || !messageText.trim()) return;
    sendMessage(
      {
        data: {
          user_name: userName || "Anonymous",
          user_city: userCity || undefined,
          message: messageText.trim(),
          tier: (tier ?? "pro") as "pro_plus" | "pro",
        },
      },
      {
        onSuccess: () => {
          setMessageText("");
          queryClient.invalidateQueries({ queryKey: getGetLiveMessagesQueryKey({ limit: 50 }) });
        },
      },
    );
  };

  const sortedMessages = [...(messages || [])].reverse();
  const inputBg = darkMode ? "#1a1a1a" : "#f5f5f5";
  const inputBorder = darkMode ? "#333" : "#ccc";
  const textMain = darkMode ? "#fff" : "#111";
  const textSub = darkMode ? "#aaa" : "#666";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 120px)",
        position: "relative",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: darkMode
            ? "radial-gradient(ellipse at 50% 30%, rgba(20,40,15,0.7) 0%, rgba(0,0,0,0.95) 70%)"
            : "none",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${darkMode ? "#1a2219" : "#e0e0e0"}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: "15px", color: textMain }}>
            Mr Analyst VIP Chat
          </span>
          <a
            href="#"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #e6b800, #a8ff4d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textDecoration: "none",
            }}
          >
            Live feedback
          </a>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          data-testid="messages-container"
        >
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ height: "72px", borderRadius: "10px", background: darkMode ? "#1a2219" : "#e8e8e8" }}
                />
              ))}
            </div>
          ) : sortedMessages.length === 0 ? (
            <p style={{ textAlign: "center", color: textSub, fontSize: "13px", padding: "20px 0" }}>
              No messages yet. Be the first!
            </p>
          ) : (
            sortedMessages.map((msg, idx) => (
              <MessageCard key={msg.id ?? idx} msg={msg} darkMode={darkMode} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            flexShrink: 0,
            padding: "10px 16px",
            borderTop: `1px solid ${darkMode ? "#1a2219" : "#e0e0e0"}`,
            background: darkMode ? "rgba(10,10,10,0.9)" : "#f5f5f5",
            paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0))",
          }}
        >
          {!isVip ? (
            <div
              style={{
                background: darkMode ? "#1a2219" : "#e8f5e8",
                border: `1px solid ${darkMode ? "#2d3d2d" : "#b8ddb8"}`,
                borderRadius: "10px",
                padding: "12px",
                textAlign: "center",
                color: textSub,
                fontSize: "12px",
              }}
            >
              VIP access required to send messages
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Write a VIP message"
                data-testid="input-chat-message"
                style={{
                  flex: 1,
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: "24px",
                  padding: "10px 16px",
                  color: textMain,
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                data-testid="button-send-message"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "none",
                  background: LIME,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sending || !messageText.trim() ? "not-allowed" : "pointer",
                  opacity: sending || !messageText.trim() ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                <Send size={16} color="#0a0a0a" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
