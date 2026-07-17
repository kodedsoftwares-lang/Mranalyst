import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Crown, Diamond, Mail, Key, Download, CheckCircle } from "lucide-react";
import { useVipLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

const LIME = "#a8ff4d";
const GOLD_BG = "linear-gradient(135deg, #e6b800 0%, #f5d700 50%, #c89400 100%)";
const PRO_GREEN = "#22c55e";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  access_code: z.string().min(1, "Access code is required"),
});
type FormValues = z.infer<typeof formSchema>;

interface VipPageProps {
  darkMode?: boolean;
}

export default function VipPage({ darkMode = true }: VipPageProps) {
  const { setVipAccess, isVip, tier } = useAuth();
  const { toast } = useToast();
  const { mutate: vipLogin, isPending } = useVipLogin();

  const cardBg = darkMode ? "#1a1a1a" : "#f5f5f5";
  const cardBorder = darkMode ? "#2a2a2a" : "#e0e0e0";
  const textMain = darkMode ? "#fff" : "#111";
  const textSub = darkMode ? "#aaa" : "#666";
  const inputBg = darkMode ? "#111" : "#fff";
  const inputBorder = darkMode ? "#333" : "#ccc";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", access_code: "" },
  });

  const onSubmit = (values: FormValues) => {
    vipLogin(
      { data: values },
      {
        onSuccess: (result) => {
          if (result.success && result.tier) {
            setVipAccess(result.tier as "pro_plus" | "pro", result.token);
            toast({ title: "Welcome!", description: `VIP access granted — ${result.tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP"}` });
          } else {
            toast({ title: "Invalid or expired access code", variant: "destructive" });
          }
        },
        onError: () => toast({ title: "Invalid or expired access code", variant: "destructive" }),
      },
    );
  };

  if (isVip) {
    const color = tier === "pro_plus" ? "#e6b800" : PRO_GREEN;
    const label = tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP";
    return (
      <div
        style={{
          minHeight: "calc(100dvh - 120px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px 100px",
          background: darkMode
            ? "radial-gradient(ellipse at 50% 20%, rgba(30,60,20,0.5) 0%, rgba(0,0,0,0) 60%)"
            : undefined,
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: `${color}22`,
            border: `2px solid ${color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <CheckCircle size={36} color={color} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: textMain, marginBottom: "4px" }}>
          VIP Access Active
        </h2>
        <p style={{ fontWeight: 700, color, marginBottom: "8px" }}>{label}</p>
        <p style={{ color: textSub, fontSize: "13px", textAlign: "center", maxWidth: "280px" }}>
          You have active VIP access. Enjoy premium predictions!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px 100px",
        background: darkMode
          ? "radial-gradient(ellipse at 50% 20%, rgba(20,40,15,0.8) 0%, rgba(0,0,0,0.95) 80%)"
          : "#f0f0f0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: "16px",
          padding: "20px",
          position: "relative",
        }}
      >
        {/* Label */}
        <p style={{ color: LIME, fontWeight: 800, fontSize: "11px", letterSpacing: "0.1em", marginBottom: "4px" }}>
          PREMIUM MEMBERSHIP
        </p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: textMain, marginBottom: "4px" }}>
          Unlock VIP Access
        </h2>
        <p style={{ fontSize: "12px", color: textSub, marginBottom: "16px", lineHeight: 1.5 }}>
          Choose your membership, enter your official access code, or contact support to activate your plan.
        </p>

        {/* Plan cards */}
        <div
          style={{
            background: darkMode ? "#0f0f0f" : "#e8e8e8",
            border: `1px solid ${darkMode ? "#2a3a1a" : "#ccc"}`,
            borderRadius: "10px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#1a2a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Crown size={18} color="#e6b800" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: "13px", color: textMain }}>Pro Plus VIP</p>
            <p style={{ fontSize: "11px", color: textSub, marginTop: "2px" }}>
              Correct score focus, premium match selection, priority coverage.
            </p>
          </div>
          <span
            style={{
              background: LIME,
              color: "#0a0a0a",
              fontWeight: 800,
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
            }}
          >
            $419
          </span>
        </div>

        <div
          style={{
            background: darkMode ? "#0f0f0f" : "#e8e8e8",
            border: `1px solid ${cardBorder}`,
            borderRadius: "10px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#1a2a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Diamond size={18} color={PRO_GREEN} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: "13px", color: textMain }}>Pro VIP</p>
            <p style={{ fontSize: "11px", color: textSub, marginTop: "2px" }}>
              VIP football analysis with clear daily match insights.
            </p>
          </div>
          <span
            style={{
              background: LIME,
              color: "#0a0a0a",
              fontWeight: 800,
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
            }}
          >
            $219
          </span>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <Mail size={14} color="#888" />
              <input
                type="email"
                placeholder="Email address"
                {...form.register("email")}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: textMain,
                  fontSize: "13px",
                }}
              />
            </div>
            {form.formState.errors.email && (
              <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <Key size={14} color="#888" />
              <input
                type="text"
                placeholder="VIP access code"
                {...form.register("access_code")}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: textMain,
                  fontSize: "13px",
                }}
              />
            </div>
            {form.formState.errors.access_code && (
              <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>
                {form.formState.errors.access_code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            data-testid="button-unlock-vip"
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "none",
              background: `linear-gradient(135deg, ${LIME} 0%, #7ed321 100%)`,
              color: "#0a0a0a",
              fontWeight: 800,
              fontSize: "14px",
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "10px",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            <Lock size={14} strokeWidth={2.5} />
            {isPending ? "Checking..." : "Login to VIP"}
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <a
              href="mailto:support@mranalyst.org"
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #e6b800 0%, #f5d700 100%)",
                color: "#0a0a0a",
                fontWeight: 800,
                fontSize: "12px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <Mail size={13} />
              Request Access
            </a>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: `linear-gradient(135deg, ${LIME} 0%, #7ed321 100%)`,
                color: "#0a0a0a",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <Download size={13} />
              Download VIP App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
