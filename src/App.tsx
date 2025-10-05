import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import AITrading from "./pages/ai_trading";
import PredictiveAnalytics from "./pages/predictive_analytics";
import PortfolioOptimization from "./pages/portfolio_optimization";
import RiskManagement from "./pages/RiskManagement";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import DesktopOnly from "./components/DesktopOnly"; // Add this import
import StockDetail from "./pages/StockDetail"; // Add stock detail page
import { AuthProvider } from "./contexts/AuthContext";

// Initialize theme immediately to prevent flash
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Run immediately
initializeTheme();

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Desktop-only message - will only show on small screens */}
          <DesktopOnly />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/ai_trading" element={<AITrading />} />
              <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
              <Route path="/portfolio-optimization" element={<PortfolioOptimization />} />
              <Route path="/risk-management" element={<RiskManagement />} />
              <Route path="/stock/:symbol" element={<StockDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
