import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AuthProvider } from "@/context/auth-context";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SplashScreen } from "@/components/SplashScreen";
import { FloatingChat } from "@/components/FloatingChat";
import HomePage from "@/pages/home";
import PrivacyPage from "@/pages/privacy";
import VipPage from "@/pages/vip";
import StatsPage from "@/pages/stats";
import LivePage from "@/pages/live";
import AdminPage from "@/pages/admin/index";
import NotFound from "@/pages/not-found";
import "@/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppLayout({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const pageBg = darkMode ? "#0d0f0d" : "#f0f0f0";
  const textColor = darkMode ? "#f0f0f0" : "#111";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        maxWidth: "430px",
        margin: "0 auto",
        position: "relative",
        background: pageBg,
        color: textColor,
      }}
    >
      <Header darkMode={darkMode} onToggleDark={onToggleDark} />
      <main style={{ flex: 1, overflowX: "hidden" }}>
        <Switch>
          <Route path="/" component={() => <HomePage darkMode={darkMode} />} />
          <Route path="/privacy" component={() => <PrivacyPage darkMode={darkMode} />} />
          <Route path="/vip" component={() => <VipPage darkMode={darkMode} />} />
          <Route path="/stats" component={() => <StatsPage darkMode={darkMode} />} />
          <Route path="/live" component={() => <LivePage darkMode={darkMode} />} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNav darkMode={darkMode} />
      <FloatingChat />
    </div>
  );
}

function App() {
  const skipSplash = new URLSearchParams(window.location.search).has("nosplash");
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [darkMode, setDarkMode] = useState(true);
  const onToggleDark = useCallback(() => setDarkMode((d) => !d), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            <AppLayout darkMode={darkMode} onToggleDark={onToggleDark} />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
