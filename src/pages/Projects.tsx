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
      className="space-y-6 px-4 sm:px-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center sm:text-left"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-partner-darkGray">My Projects</h1>
        <p className="text-partner-mediumGray mt-1 text-sm sm:text-base">
          View and manage your assigned projects
        </p>
      </motion.div>

      {/* Stats Cards - Mobile responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-partner-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-partner-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-partner-mediumGray">Total Projects</p>
              <p className="text-2xl font-bold text-partner-darkGray">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-partner-mediumGray">Completed</p>
              <p className="text-2xl font-bold text-partner-darkGray">
                {projects.filter(p => p.assignment?.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-partner-mediumGray">In Progress</p>
              <p className="text-2xl font-bold text-partner-darkGray">
                {projects.filter(p => p.assignment?.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
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
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl text-partner-darkGray flex items-start gap-2 flex-wrap">
                        <span className="break-words">{project.title}</span>
                        {isDeadlinePassed(project.deadline) && (
                          <Badge variant="destructive" className="text-xs whitespace-nowrap">
                            Deadline Passed
                          </Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <p className="text-partner-mediumGray mt-2 text-sm sm:text-base break-words">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-partner-primary/10 text-partner-primary whitespace-nowrap">
                        {project.reward_clicks} points
                      </Badge>
                      {project.assignment && getStatusBadge(project.assignment.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Links - Mobile responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {project.reference_link && (
                      <a 
                        href={project.reference_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-partner-primary hover:underline text-sm flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Reference Link</span>
                      </a>
                    )}
                    {project.recreate_link && (
                      <a 
                        href={project.recreate_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-partner-primary hover:underline text-sm flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Recreate Link</span>
                      </a>
                    )}
                    {project.download_link && (
                      <a 
                        href={project.download_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-partner-primary hover:underline text-sm flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Download Link</span>
                      </a>
                    )}
                  </div>

                  {/* Deadline */}
                  {project.deadline && (
                    <div className="flex items-center gap-2 text-sm text-partner-mediumGray mb-4 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        Deadline: {new Date(project.deadline).toLocaleDateString()} at {new Date(project.deadline).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Admin Feedback */}
                  {project.assignment?.admin_feedback && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Admin Feedback:</p>
                      <p className="text-sm text-gray-600 break-words">{project.assignment.admin_feedback}</p>
                    </div>
                  )}

                  {/* Submission Link */}
                  {project.assignment?.submission_link && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">Your Submission:</p>
                      <a 
                        href={project.assignment.submission_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all">{project.assignment.submission_link}</span>
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {project.assignment?.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleProjectAction(project.assignment!.id, 'accepted')}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accept Project
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleProjectAction(project.assignment!.id, 'rejected')}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto"
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
                            className="flex items-center justify-center gap-2 w-full sm:w-auto"
                          >
                            <Upload className="h-4 w-4" />
                            Submit Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-4 max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-lg">Submit Project</DialogTitle>
                            <p className="text-sm text-gray-600 break-words">{project.title}</p>
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
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Provide a link to your completed project (GitHub, live demo, etc.)
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button 
                                type="submit" 
                                disabled={isSubmitting || !submissionLink.trim()}
                                className="w-full sm:flex-1"
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
                                className="w-full sm:w-auto"
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