
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";
import { ProjectAssignmentProvider, useProjectAssignment } from "./contexts/ProjectAssignmentContext";
import { ProjectApprovalProvider, useProjectApproval } from "./contexts/ProjectApprovalContext";
import { useProjectAssignmentNotification } from "./hooks/useProjectAssignmentNotification";
import { useProjectApprovalNotification } from "./hooks/useProjectApprovalNotification";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoadingLogo from "./components/ui/loading-logo";
import ProjectAssignmentNotification from "./components/ProjectAssignmentNotification";
import ProjectApprovalNotification from "./components/ProjectApprovalNotification";
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
import AdminProjects from "./pages/AdminProjects";
import Projects from "./pages/Projects";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import AuthDebug from "./components/debug/AuthDebug";

const queryClient = new QueryClient();

const ShortUrlRedirect = () => {
  const { code } = useParams();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleRedirect = async () => {
      if (!code) {
        setError('No redirect code provided');
        setIsRedirecting(false);
        return;
      }

      try {
        // Get the target URL from the database
        const { data: urlData, error: urlError } = await supabase
          .from('short_urls')
          .select('target_url, user_id')
          .eq('short_code', code)
          .single();

        if (urlError || !urlData) {
          setError('Invalid or expired link');
          setIsRedirecting(false);
          return;
        }

        // Track the click
        const { error: clickError } = await supabase
          .from('clicks')
          .insert({
            user_id: urlData.user_id,
            type: 'direct',
            ip_address: 'unknown', // You could get this from a service if needed
            user_agent: navigator.userAgent
          });

        if (clickError) {
          console.error('Error tracking click:', clickError);
          // Continue with redirect even if tracking fails
        }

        // Redirect to the target URL
        window.location.href = urlData.target_url;
      } catch (error) {
        console.error('Redirect error:', error);
        setError('Failed to redirect');
        setIsRedirecting(false);
      }
    };

    handleRedirect();
  }, [code]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Link Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">Go to Homepage</a>
        </div>
      </div>
    );
  }

  // Show loading indicator while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <LoadingLogo size="md" />
        <p className="mt-4">Redirecting...</p>
      </div>
    </div>
  );
};

const AppWithNotifications = () => {
  return (
    <ProjectAssignmentProvider>
      <ProjectApprovalProvider>
        <Toaster />
        <Sonner />
        <AuthDebug />
        <ProjectAssignmentNotificationWrapper />
        <ProjectApprovalNotificationWrapper />
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
            <Route path="/projects" element={<Projects />} />
            <Route path="/sub-partners" element={<SubPartners />} />
            <Route path="/withdrawals" element={<Withdrawals />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProjectApprovalProvider>
    </ProjectAssignmentProvider>
  );
};

const ProjectAssignmentNotificationWrapper = () => {
  const { isNotificationOpen, hideNotification, currentProjectTitle } = useProjectAssignment();
  
  // Use the hook to monitor for new assignments
  useProjectAssignmentNotification();
  
  return (
    <ProjectAssignmentNotification
      isOpen={isNotificationOpen}
      onClose={hideNotification}
      projectTitle={currentProjectTitle}
    />
  );
};

const ProjectApprovalNotificationWrapper = () => {
  const { isApprovalNotificationOpen, hideApprovalNotification, currentApprovalProject, currentEarnings } = useProjectApproval();
  
  // Use the hook to monitor for project approvals
  useProjectApprovalNotification();
  
  return (
    <ProjectApprovalNotification
      isOpen={isApprovalNotificationOpen}
      onClose={hideApprovalNotification}
      projectTitle={currentApprovalProject}
      earnings={currentEarnings}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppWithNotifications />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
