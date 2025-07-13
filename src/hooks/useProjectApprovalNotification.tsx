import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectApproval } from '@/contexts/ProjectApprovalContext';

export const useProjectApprovalNotification = () => {
  const { profile } = useAuth();
  const { showApprovalNotification } = useProjectApproval();
  const checkedApprovals = useRef<Set<string>>(new Set());

  // Load previously shown notifications from localStorage
  useEffect(() => {
    if (profile) {
      const shownApprovals = localStorage.getItem(`shown_approvals_${profile.id}`);
      if (shownApprovals) {
        const parsed = JSON.parse(shownApprovals);
        checkedApprovals.current = new Set(parsed);
      }
    }
  }, [profile]);

  // Save shown notifications to localStorage
  const saveShownApproval = (assignmentId: string) => {
    if (profile) {
      checkedApprovals.current.add(assignmentId);
      const shownArray = Array.from(checkedApprovals.current);
      localStorage.setItem(`shown_approvals_${profile.id}`, JSON.stringify(shownArray));
    }
  };

  useEffect(() => {
    if (!profile) return;

    // Check for existing approved projects that haven't been shown
    const checkForExistingApprovals = async () => {
      try {
        const { data, error } = await supabase
          .from('project_assignments')
          .select(`
            id,
            status,
            reviewed_at,
            projects (
              title,
              reward_clicks
            )
          `)
          .eq('user_id', profile.id)
          .eq('status', 'approved')
          .order('reviewed_at', { ascending: false });

        if (error) {
          console.error('Error checking for existing approvals:', error);
          return;
        }

        if (data) {
          // Check for any approved projects we haven't shown notifications for
          const newApprovals = data.filter(assignment => 
            !checkedApprovals.current.has(assignment.id)
          );

          if (newApprovals.length > 0) {
            // Show notification only for the newest approval
            const newestApproval = newApprovals[0];
            const earnings = ((newestApproval as any).projects?.reward_clicks || 0) * 0.10;
            
            saveShownApproval(newestApproval.id);
            showApprovalNotification(
              (newestApproval as any).projects?.title, 
              earnings
            );
          }
        }
      } catch (error) {
        console.error('Error in checkForExistingApprovals:', error);
      }
    };

    // Check immediately when the hook is first used
    checkForExistingApprovals();

    // Set up real-time subscription for project approval updates
    const channel = supabase
      .channel('project_approvals')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_assignments',
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('Project assignment updated:', payload);
          
          // Check if this is a new approval (status changed to 'approved')
          if (payload.new.status === 'approved' && payload.old.status !== 'approved') {
            
            // Check if we've already shown notification for this approval
            if (checkedApprovals.current.has(payload.new.id)) {
              return;
            }
            
            // Mark as shown and save to localStorage
            saveShownApproval(payload.new.id);
            
            // Fetch the project details for the notification
            const { data: projectData, error: projectError } = await supabase
              .from('projects')
              .select('title, reward_clicks')
              .eq('id', payload.new.project_id)
              .single();

            if (!projectError && projectData) {
              const earnings = (projectData.reward_clicks || 0) * 0.10;
              showApprovalNotification(projectData.title, earnings);
            } else {
              // Show notification without project details if fetch fails
              showApprovalNotification(undefined, 0);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, showApprovalNotification]);

  return null;
}; 