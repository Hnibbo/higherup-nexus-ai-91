import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { InstallPrompt } from "./components/PWA/InstallPrompt";
import { BehaviorTracker } from "./components/Analytics/BehaviorTracker";
import { AnalyticsTracker } from "./components/Analytics/AnalyticsTracker";
import ProtectedRoute from "./components/ProtectedRoute";
import { MobileLayout } from "./components/mobile/MobileLayout";
import { useMobileOptimization } from "./hooks/useMobileOptimization";
import PWAService from "./services/pwa/PWAService";
import { useEffect } from "react";
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
import Settings from "./pages/Settings";
import Collaboration from "./pages/Collaboration";
import FileManager from "./pages/FileManager";
import VoiceTools from "./pages/VoiceTools";
import AutomationBuilder from "./pages/AutomationBuilder";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const AppContent = () => {
  const { device } = useMobileOptimization();

  // Initialize PWA service
  useEffect(() => {
    const initializePWA = async () => {
      try {
        const pwaService = PWAService.getInstance();
        console.log('PWA Service initialized');
      } catch (error) {
        console.error('Failed to initialize PWA service:', error);
      }
    };

    initializePWA();
  }, []);

  // Determine if we should use mobile layout
  const shouldUseMobileLayout = device?.device_type === 'phone' || 
    (device?.device_type === 'tablet' && window.innerWidth < 1024);

  const routes = (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/funnel-builder" element={<ProtectedRoute><FunnelBuilder /></ProtectedRoute>} />
      <Route path="/video-creator" element={<ProtectedRoute><VideoCreator /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
      <Route path="/email-marketing" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/ecommerce" element={<ProtectedRoute><Ecommerce /></ProtectedRoute>} />
      <Route path="/sms-marketing" element={<ProtectedRoute><SMSMarketing /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/website-builder" element={<ProtectedRoute><WebsiteBuilder /></ProtectedRoute>} />
      <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
      <Route path="/file-manager" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
      <Route path="/voice-tools" element={<ProtectedRoute><VoiceTools /></ProtectedRoute>} />
      <Route path="/automation-builder" element={<ProtectedRoute><AutomationBuilder /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <>
      <AnalyticsTracker />
      {shouldUseMobileLayout ? (
        <MobileLayout>{routes}</MobileLayout>
      ) : (
        routes
      )}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BehaviorTracker />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
