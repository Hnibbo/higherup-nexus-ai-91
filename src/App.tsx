import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
