import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award, Clock, CheckCircle, XCircle, ChevronRight, TrendingUp, FileText, Upload, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectActivity {
  id: string;
  title: string;
  status: string;
  reward_clicks: number;
  created_at: string;
  updated_at: string;
  assignment_status: string;
  reviewed_at: string | null;
}

const RecentActivity = () => {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('project_assignments')
          .select(`
            id,
            status,
            created_at,
            updated_at,
            reviewed_at,
            projects (
              title,
              reward_clicks
            )
          `)
          .eq('user_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedActivities = data?.map((item: any) => ({
          id: item.id,
          title: item.projects?.title || 'Unknown Project',
          status: item.projects?.status || 'active',
          reward_clicks: item.projects?.reward_clicks || 0,
          created_at: item.created_at,
          updated_at: item.updated_at,
          assignment_status: item.status,
          reviewed_at: item.reviewed_at
        })) || [];

        setActivities(formattedActivities);
      } catch (error: any) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivities();
  }, [profile]);

  const getStatusConfig = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        label: 'Pending', 
        icon: Clock,
        bgColor: 'bg-amber-100'
      },
      accepted: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        label: 'In Progress', 
        icon: TrendingUp,
        bgColor: 'bg-blue-100'
      },
      rejected: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Rejected', 
        icon: XCircle,
        bgColor: 'bg-red-100'
      },
      submitted: { 
        color: 'bg-purple-50 text-purple-700 border-purple-200', 
        label: 'Under Review', 
        icon: Upload,
        bgColor: 'bg-purple-100'
      },
      approved: { 
        color: 'bg-green-50 text-green-700 border-green-200', 
        label: 'Completed', 
        icon: CheckCircle,
        bgColor: 'bg-green-100'
      },
      rejected_by_admin: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Rejected', 
        icon: XCircle,
        bgColor: 'bg-red-100'
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateEarnings = (status: string, rewardClicks: number) => {
    // Only show earnings if the project was approved
    if (status === 'approved') {
      return (rewardClicks * 0.10).toFixed(2);
    }
    return '0.00';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="h-96 shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-gray-900">
              <FolderOpen className="h-5 w-5 text-partner-primary" />
              Recent Activity
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="flex justify-center items-center h-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-8 w-8 border-4 border-partner-primary border-t-transparent rounded-full" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-gray-900">
            <FolderOpen className="h-5 w-5 text-partner-primary" />
            Recent Activity
          </CardTitle>
          <Link 
            to="/projects" 
            className="flex items-center gap-1 text-sm text-partner-primary hover:text-partner-secondary transition-colors font-medium"
          >
            See more
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 max-h-72 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No recent activity</p>
              <p className="text-xs text-gray-500">
                Project activities will appear here
              </p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const statusConfig = getStatusConfig(activity.assignment_status);
              const IconComponent = statusConfig.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                    {/* Icon */}
                    <div className={`h-10 w-10 ${statusConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="h-5 w-5 text-gray-700" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                            {activity.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.updated_at)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(activity.assignment_status)}
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              ${calculateEarnings(activity.assignment_status, activity.reward_clicks)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 