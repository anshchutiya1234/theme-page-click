import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectAssignment } from '@/contexts/ProjectAssignmentContext';

export const useProjectAssignmentNotification = () => {
  const { profile } = useAuth();
  const { showNotification } = useProjectAssignment();
  const checkedAssignments = useRef<Set<string>>(new Set());

  // Load previously shown notifications from localStorage
  useEffect(() => {
    if (profile) {
      const shownNotifications = localStorage.getItem(`shown_notifications_${profile.id}`);
      if (shownNotifications) {
        const parsed = JSON.parse(shownNotifications);
        checkedAssignments.current = new Set(parsed);
      }
    }
  }, [profile]);

  // Save shown notifications to localStorage
  const saveShownNotification = (assignmentId: string) => {
    if (profile) {
      checkedAssignments.current.add(assignmentId);
      const shownArray = Array.from(checkedAssignments.current);
      localStorage.setItem(`shown_notifications_${profile.id}`, JSON.stringify(shownArray));
    }
  };

  useEffect(() => {
    if (!profile) return;

    // Check for new assignments periodically
    const checkForNewAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('project_assignments')
          .select(`
            id,
            status,
            created_at,
            projects (
              title
            )
          `)
          .eq('user_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error checking for new assignments:', error);
          return;
        }

        if (data) {
          // Check for any new assignments we haven't shown notifications for
          const newAssignments = data.filter(assignment => 
            !checkedAssignments.current.has(assignment.id)
          );

          if (newAssignments.length > 0) {
            // Show notification only for the newest assignment
            const newestAssignment = newAssignments[0];
            saveShownNotification(newestAssignment.id);
            showNotification((newestAssignment as any).projects?.title);
          }
        }
      } catch (error) {
        console.error('Error in checkForNewAssignments:', error);
      }
    };

    // Check immediately when the hook is first used
    checkForNewAssignments();

    // Set up real-time subscription for new assignments
    const channel = supabase
      .channel('project_assignments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_assignments',
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('New assignment received:', payload);
          
          // Check if we've already shown notification for this assignment
          if (checkedAssignments.current.has(payload.new.id)) {
            return;
          }
          
          // Mark as shown and save to localStorage
          saveShownNotification(payload.new.id);
          
          // Fetch the project title for the notification
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('title')
            .eq('id', payload.new.project_id)
            .single();

          if (!projectError && projectData) {
            showNotification(projectData.title);
          } else {
            showNotification();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, showNotification]);

  return null;
}; 