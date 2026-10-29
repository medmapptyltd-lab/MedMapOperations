import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from "@/lib/supabase-auth";
import { AuthGate } from "@/components/medmap/AuthGate";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index, { CeoDashboard } from "./pages/Index";
import DashboardRouter from "./pages/DashboardRouter";
import Finance from "./pages/Finance";
import People from "./pages/People";
import Operations from "./pages/Operations";
import DoctorAcquisition from "./pages/DoctorAcquisition";
import Ambassadors from "./pages/Ambassadors";
import Sales from "./pages/Sales";
import CustomerOperations from "./pages/CustomerOperations";
import Meetings from "./pages/Meetings";
import KPIs from "./pages/KPIs";
import NotFound from "./pages/NotFound";
import Product from "./pages/Product";
import Engineering from "./pages/Engineering";
import Security from "./pages/Security";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseAuthProvider>
        <AuthGate>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/ceo" element={<CeoDashboard />} />
              <Route path="/index" element={<Index />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/people" element={<People />} />
              <Route path="/operations" element={<Operations />} />
              <Route
                path="/doctor-acquisition"
                element={<DoctorAcquisition />}
              />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/kpis" element={<KPIs />} />
              <Route path="/ambassadors" element={<Ambassadors />} />
              <Route path="/sales" element={<Sales />} />
              <Route
                path="/customer-operations"
                element={<CustomerOperations />}
              />
              <Route path="/product" element={<Product />} />
              <Route path="/engineering" element={<Engineering />} />
              <Route path="/security" element={<Security />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthGate>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
