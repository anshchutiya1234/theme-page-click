export interface Project {
  id: string;
  title: string;
  description?: string;
  reference_link?: string;
  recreate_link?: string;
  download_link?: string;
  deadline?: string;
  reward_clicks: number;
  status: 'active' | 'inactive' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'submitted' | 'approved' | 'rejected_by_admin';
  accepted_at?: string;
  submitted_at?: string;
  submission_link?: string;
  admin_feedback?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithAssignment extends Project {
  assignment?: ProjectAssignment;
  assigned_users_count?: number;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  reference_link?: string;
  recreate_link?: string;
  download_link?: string;
  deadline?: string;
  reward_clicks: number;
  assigned_user_ids: string[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  reference_link?: string;
  recreate_link?: string;
  download_link?: string;
  deadline?: string;
  reward_clicks?: number;
  status?: 'active' | 'inactive' | 'completed';
}

export interface ProjectSubmissionData {
  submission_link: string;
}

export interface ProjectReviewData {
  status: 'approved' | 'rejected_by_admin';
  admin_feedback?: string;
} 