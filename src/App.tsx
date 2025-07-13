
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { AuthProvider } from "./contexts/AuthContext";
import { ProjectAssignmentProvider, useProjectAssignment } from "./contexts/ProjectAssignmentContext";
import { useProjectAssignmentNotification } from "./hooks/useProjectAssignmentNotification";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoadingLogo from "./components/ui/loading-logo";
import ProjectAssignmentNotification from "./components/ProjectAssignmentNotification";
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
  const edgeFunctionsUrl = import.meta.env.VITE_EDGE_FUNCTIONS_URL || 'https://ekfgfyjtfgjrfwbkoifd.supabase.co/functions/v1';
  
  useEffect(() => {
    // Redirect to the edge function URL directly in the browser
    if (code) {
      window.location.href = `${edgeFunctionsUrl}/redirect/${code}`;
    }
  }, [code, edgeFunctionsUrl]);

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
      <Toaster />
      <Sonner />
      <AuthDebug />
      <ProjectAssignmentNotificationWrapper />
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
