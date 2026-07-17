interface PrivacyPageProps {
  darkMode?: boolean;
}

const sections = [
  {
    title: "Information We Collect",
    body: "We do not directly collect personal information from users of this application. Our service operates without requiring user registration or personal data submission. However, our app may use third-party services (such as advertising networks like AdMob, location services, and analytics tools) that may collect personal information as governed by their own privacy policies.",
  },
  {
    title: "How We Use Information",
    body: "Since we do not directly collect personal information, we do not use user data for any purposes. All football tips and statistics are generated algorithmically and do not involve user data. However, third-party services we may use (such as advertising networks like AdMob, location services, and analytics tools) may use information collected by their own policies and practices.",
  },
  {
    title: "Data Security",
    body: "We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of data. However, please note that we may use third-party services (such as advertising networks like AdMob, location services, and analytics tools) whose data security practices are governed by their own policies.",
  },
  {
    title: "Third-Party Services",
    body: "We may use third-party services including advertising networks (such as AdMob), location services, and analytics providers that may collect personal information. These services have their own privacy policies governing their data collection and usage practices.",
  },
  {
    title: "Changes to This Privacy Policy",
    body: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.",
  },
  {
    title: "Contact Us",
    body: "If you have any questions about this Privacy Policy, please contact us through the support options available in the app.",
  },
];

export default function PrivacyPage({ darkMode = true }: PrivacyPageProps) {
  const cardBg = darkMode ? "#1a1a1a" : "#fff";
  const cardBorder = darkMode ? "#2a2a2a" : "#e0e0e0";
  const textMain = darkMode ? "#fff" : "#111";
  const textSub = darkMode ? "#ccc" : "#444";

  return (
    <div style={{ position: "relative", paddingBottom: "80px" }}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          padding: "40px 20px 20px",
          background: darkMode
            ? "linear-gradient(180deg, rgba(10,30,10,0.85) 0%, rgba(0,0,0,0.7) 100%)"
            : "linear-gradient(180deg, rgba(200,230,200,0.4) 0%, rgba(240,240,240,0) 100%)",
          overflow: "hidden",
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
          data-testid="text-privacy-title"
          style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.05em",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          PRIVACY POLICY
        </h1>
      </div>

      {/* Cards */}
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: "14px",
                  color: textMain,
                  marginBottom: "8px",
                }}
              >
                {section.title}
              </h2>
              <p style={{ fontSize: "13px", color: textSub, lineHeight: 1.65 }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
