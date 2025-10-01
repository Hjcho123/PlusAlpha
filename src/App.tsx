import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import AITrading from "./pages/ai_trading";
import PredictiveAnalytics from "./pages/predictive_analytics";
import PortfolioOptimization from "./pages/portfolio_optimization";
import RiskManagement from "./pages/risk_management";
import NotFound from "./pages/NotFound";
import DesktopOnly from "./components/DesktopOnly"; // Add this import

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Desktop-only message - will only show on small screens */}
        <DesktopOnly />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ai_trading" element={<AITrading />} />
            <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
            <Route path="/portfolio-optimization" element={<PortfolioOptimization />} />
            <Route path="/risk-management" element={<RiskManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;