import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, CheckCircle, XCircle, Upload, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectWithAssignment, ProjectSubmissionData } from '@/types/project';

const Projects = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithAssignment | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchUserProjects();
    }
  }, [profile]);

  const fetchUserProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', profile?.id);

      if (error) throw error;

      const projectsWithAssignments = data?.map((assignment: any) => ({
        ...assignment.projects,
        assignment
      })) || [];

      setProjects(projectsWithAssignments);
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

  const handleProjectAction = async (assignmentId: string, action: 'accepted' | 'rejected') => {
    try {
      const updateData: any = {
        status: action,
        [action === 'accepted' ? 'accepted_at' : 'rejected_at']: new Date().toISOString()
      };

      const { error } = await supabase
        .from('project_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project ${action} successfully`,
      });

      fetchUserProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${action.slice(0, -2)} project`,
        variant: "destructive",
      });
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject?.assignment || !submissionLink.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_assignments')
        .update({
          status: 'submitted',
          submission_link: submissionLink.trim(),
          submitted_at: new Date().toISOString()
        })
        .eq('id', selectedProject.assignment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project submitted successfully! Waiting for admin review.",
      });

      setSelectedProject(null);
      setSubmissionLink('');
      fetchUserProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      submitted: { color: 'bg-purple-100 text-purple-800', label: 'Submitted', icon: Upload },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: Award },
      rejected_by_admin: { color: 'bg-red-100 text-red-800', label: 'Rejected by Admin', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const canSubmit = (project: ProjectWithAssignment) => {
    return project.assignment?.status === 'accepted' && !isDeadlinePassed(project.deadline);
  };

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
        <h1 className="text-3xl font-bold text-partner-darkGray">My Projects</h1>
        <p className="text-partner-mediumGray mt-1">
          View and manage your assigned projects
        </p>
      </motion.div>

      <div className="flex gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-partner-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-partner-primary" />
            </div>
            <div>
              <p className="text-sm text-partner-mediumGray">Total Projects</p>
              <p className="text-xl font-bold text-partner-darkGray">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-partner-mediumGray">Completed</p>
              <p className="text-xl font-bold text-partner-darkGray">
                {projects.filter(p => p.assignment?.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-partner-mediumGray">In Progress</p>
              <p className="text-xl font-bold text-partner-darkGray">
                {projects.filter(p => p.assignment?.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects assigned</h3>
            <p className="text-gray-500">You haven't been assigned any projects yet.</p>
          </motion.div>
        ) : (
          projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-partner-darkGray flex items-center gap-2">
                        {project.title}
                        {isDeadlinePassed(project.deadline) && (
                          <Badge variant="destructive" className="text-xs">
                            Deadline Passed
                          </Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <p className="text-partner-mediumGray mt-2">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-partner-primary/10 text-partner-primary">
                        {project.reward_clicks} points
                      </Badge>
                      {project.assignment && getStatusBadge(project.assignment.status)}
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
                        className="text-partner-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Reference Link
                      </a>
                    )}
                    {project.recreate_link && (
                      <a 
                        href={project.recreate_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-partner-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Recreate Link
                      </a>
                    )}
                    {project.download_link && (
                      <a 
                        href={project.download_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-partner-primary hover:underline text-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Download Link
                      </a>
                    )}
                  </div>

                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm text-partner-mediumGray mb-4">
                      <Calendar className="h-4 w-4" />
                      Deadline: {new Date(project.deadline).toLocaleDateString()} at {new Date(project.deadline).toLocaleTimeString()}
                    </div>
                  )}

                  {project.assignment?.admin_feedback && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Admin Feedback:</p>
                      <p className="text-sm text-gray-600">{project.assignment.admin_feedback}</p>
                    </div>
                  )}

                  {project.assignment?.submission_link && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Your Submission:</p>
                      <a 
                        href={project.assignment.submission_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {project.assignment.submission_link}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {project.assignment?.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleProjectAction(project.assignment!.id, 'accepted')}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accept Project
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleProjectAction(project.assignment!.id, 'rejected')}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Project
                        </Button>
                      </>
                    )}

                    {canSubmit(project) && !project.assignment?.submission_link && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedProject(project)}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Submit Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Project - {project.title}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmitProject} className="space-y-4">
                            <div>
                              <Label htmlFor="submission_link">Submission Link *</Label>
                              <Input
                                id="submission_link"
                                type="url"
                                value={submissionLink}
                                onChange={(e) => setSubmissionLink(e.target.value)}
                                placeholder="https://your-project-link.com"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Provide a link to your completed project (GitHub, live demo, etc.)
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                type="submit" 
                                disabled={isSubmitting || !submissionLink.trim()}
                                className="flex-1"
                              >
                                {isSubmitting ? 'Submitting...' : 'Submit Project'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedProject(null);
                                  setSubmissionLink('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Projects; 