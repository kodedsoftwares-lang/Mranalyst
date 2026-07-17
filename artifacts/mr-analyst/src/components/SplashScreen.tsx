import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2000);
    const t2 = setTimeout(onDone, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 45%, #c89400 0%, #8a6200 35%, #3a2800 60%, #0a0500 85%, #000 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div style={{ textAlign: "center", userSelect: "none" }}>
        <h1
          style={{
            fontSize: "4.5rem",
            fontWeight: 900,
            color: "#a8ff4d",
            lineHeight: 1,
            textShadow: "0 0 20px #a8ff4d, 0 0 40px #a8ff4d88, 0 0 80px #7eff0044",
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.02em",
          }}
        >
          Mr
        </h1>
        <p
          style={{
            fontSize: "0.65rem",
            color: "#d4b840",
            letterSpacing: "0.35em",
            fontWeight: 500,
            marginTop: "0.25rem",
            marginBottom: "0.1rem",
            textTransform: "uppercase",
          }}
        >
          CORRECT SCORE TIPS
        </p>
        <h1
          style={{
            fontSize: "4.5rem",
            fontWeight: 900,
            color: "#a8ff4d",
            lineHeight: 1,
            textShadow: "0 0 20px #a8ff4d, 0 0 40px #a8ff4d88, 0 0 80px #7eff0044",
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.02em",
          }}
        >
          Analyst
        </h1>
        <div style={{ fontSize: "3.5rem", marginTop: "0.25rem", lineHeight: 1 }}>⚽</div>
      </div>
    </div>
  );
}
