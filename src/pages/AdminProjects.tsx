import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Project, CreateProjectData, ProjectAssignment } from '@/types/project';

interface User {
  id: string;
  username: string;
  name: string;
}

const AdminProjects = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);

  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    reference_link: '',
    recreate_link: '',
    download_link: '',
    deadline: '',
    reward_clicks: 0,
    assigned_user_ids: []
  });

  useEffect(() => {
    if (profile?.is_admin) {
      fetchProjects();
      fetchUsers();
    }
  }, [profile]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name')
        .eq('is_admin', false);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectAssignments = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          users!project_assignments_user_id_fkey(username, name)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setProjectAssignments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load project assignments",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          reference_link: formData.reference_link,
          recreate_link: formData.recreate_link,
          download_link: formData.download_link,
          deadline: formData.deadline || null,
          reward_clicks: formData.reward_clicks,
          created_by: profile?.id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create assignments for selected users
      if (formData.assigned_user_ids.length > 0) {
        const assignments = formData.assigned_user_ids.map(userId => ({
          project_id: project.id,
          user_id: userId,
          status: 'pending' as const
        }));

        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      toast({
        title: "Success",
        description: "Project created and assigned successfully",
      });

      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        reference_link: '',
        recreate_link: '',
        download_link: '',
        deadline: '',
        reward_clicks: 0,
        assigned_user_ids: []
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleReviewSubmission = async (assignmentId: string, status: 'approved' | 'rejected_by_admin', feedback?: string) => {
    try {
      const { error } = await supabase
        .from('project_assignments')
        .update({
          status,
          admin_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Submission ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      });

      if (selectedProject) {
        fetchProjectAssignments(selectedProject.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to review submission",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      submitted: { color: 'bg-purple-100 text-purple-800', label: 'Submitted' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected_by_admin: { color: 'bg-red-100 text-red-800', label: 'Rejected by Admin' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (!profile?.is_admin) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="h-12 w-12 border-4 border-partner-primary border-t-transparent rounded-full" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-partner-darkGray">Project Management</h1>
        <p className="text-partner-mediumGray mt-1">
          Create and manage projects for users
        </p>
      </motion.div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-partner-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-partner-primary" />
              </div>
              <div>
                <p className="text-sm text-partner-mediumGray">Total Projects</p>
                <p className="text-xl font-bold text-partner-darkGray">{projects.length}</p>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reference_link">Reference Link</Label>
                  <Input
                    id="reference_link"
                    type="url"
                    value={formData.reference_link}
                    onChange={(e) => setFormData({...formData, reference_link: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="recreate_link">Recreate Link</Label>
                  <Input
                    id="recreate_link"
                    type="url"
                    value={formData.recreate_link}
                    onChange={(e) => setFormData({...formData, recreate_link: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="download_link">Download Link</Label>
                  <Input
                    id="download_link"
                    type="url"
                    value={formData.download_link}
                    onChange={(e) => setFormData({...formData, download_link: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reward_clicks">Reward Points *</Label>
                <Input
                  id="reward_clicks"
                  type="number"
                  min="0"
                  value={formData.reward_clicks}
                  onChange={(e) => setFormData({...formData, reward_clicks: parseInt(e.target.value) || 0})}
                  required
                />
              </div>

              <div>
                <Label>Assign to Users</Label>
                <Select 
                  value=""
                  onValueChange={(userId) => {
                    if (!formData.assigned_user_ids.includes(userId)) {
                      setFormData({
                        ...formData,
                        assigned_user_ids: [...formData.assigned_user_ids, userId]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select users to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.assigned_user_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.assigned_user_ids.map((userId) => {
                      const user = users.find(u => u.id === userId);
                      return (
                        <Badge 
                          key={userId} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setFormData({
                            ...formData,
                            assigned_user_ids: formData.assigned_user_ids.filter(id => id !== userId)
                          })}
                        >
                          {user?.name} ✕
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">Create Project</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-partner-darkGray">{project.title}</CardTitle>
                    {project.description && (
                      <p className="text-partner-mediumGray mt-2">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-partner-primary/10 text-partner-primary">
                      {project.reward_clicks} points
                    </Badge>
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {project.reference_link && (
                    <a 
                      href={project.reference_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-partner-primary hover:underline text-sm"
                    >
                      📖 Reference Link
                    </a>
                  )}
                  {project.recreate_link && (
                    <a 
                      href={project.recreate_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-partner-primary hover:underline text-sm"
                    >
                      🔄 Recreate Link
                    </a>
                  )}
                  {project.download_link && (
                    <a 
                      href={project.download_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-partner-primary hover:underline text-sm"
                    >
                      📥 Download Link
                    </a>
                  )}
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-2 text-sm text-partner-mediumGray mb-4">
                    <Calendar className="h-4 w-4" />
                    Deadline: {new Date(project.deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProject(project);
                      fetchProjectAssignments(project.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Assignments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Project Assignments Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Assignments - {selectedProject?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {projectAssignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{(assignment as any).users?.name}</h4>
                    <p className="text-sm text-gray-500">@{(assignment as any).users?.username}</p>
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
                
                {assignment.submission_link && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Submission:</p>
                    <a 
                      href={assignment.submission_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-partner-primary hover:underline text-sm"
                    >
                      {assignment.submission_link}
                    </a>
                  </div>
                )}

                {assignment.admin_feedback && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Admin Feedback:</p>
                    <p className="text-sm text-gray-600">{assignment.admin_feedback}</p>
                  </div>
                )}

                {assignment.status === 'submitted' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleReviewSubmission(assignment.id, 'approved')}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const feedback = prompt('Enter rejection feedback (optional):');
                        handleReviewSubmission(assignment.id, 'rejected_by_admin', feedback || undefined);
                      }}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {projectAssignments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No assignments found for this project.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminProjects; 