import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Join from "./pages/Join";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SubPartners from "./pages/SubPartners";
import Settings from "./pages/Settings";
import Withdrawals from "./pages/Withdrawals";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ShortUrlRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!code) return;

      try {
        // Get the target URL from short_urls
        const { data: urlData, error: urlError } = await supabase
          .from('short_urls')
          .select('target_url')
          .eq('short_code', code)
          .single();

        if (urlError || !urlData) {
          console.error('Error fetching short URL:', urlError);
          navigate('/404');
          return;
        }

        // Redirect to the target URL
        window.location.href = urlData.target_url;
      } catch (error) {
        console.error('Error handling redirect:', error);
        navigate('/404');
      }
    };

    handleRedirect();
  }, [code, navigate]);

  return <div>Redirecting...</div>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/join" element={<Join />} />
            <Route path="/login" element={<Login />} />
            <Route path="/r/:code" element={<ShortUrlRedirect />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sub-partners" element={<SubPartners />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
