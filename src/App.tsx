import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import FunnelBuilder from "./pages/FunnelBuilder";
import VideoCreator from "./pages/VideoCreator";
import CRM from "./pages/CRM";
import Pricing from "./pages/Pricing";
import EmailMarketing from "./pages/EmailMarketing";
import AIAssistant from "./pages/AIAssistant";
import Marketplace from "./pages/Marketplace";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Ecommerce from "./pages/Ecommerce";
import SMSMarketing from "./pages/SMSMarketing";
import Calendar from "./pages/Calendar";
import WebsiteBuilder from "./pages/WebsiteBuilder";
import Demo from "./pages/Demo";
import Features from "./pages/Features";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/funnel-builder" element={<FunnelBuilder />} />
              <Route path="/video-creator" element={<VideoCreator />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/email-marketing" element={<EmailMarketing />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/ecommerce" element={<Ecommerce />} />
              <Route path="/sms-marketing" element={<SMSMarketing />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/website-builder" element={<WebsiteBuilder />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/features" element={<Features />} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
