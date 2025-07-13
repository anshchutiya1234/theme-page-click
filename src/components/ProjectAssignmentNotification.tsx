import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectAssignmentNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle?: string;
}

const ProjectAssignmentNotification: React.FC<ProjectAssignmentNotificationProps> = ({
  isOpen,
  onClose,
  projectTitle
}) => {
  const navigate = useNavigate();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load the animation data
    fetch('/Trophy.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // Auto-close after 6 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000); // 6 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const handleViewProjects = () => {
    onClose();
    navigate('/projects');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay with blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-white shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Trophy Animation */}
          <div className="mb-6 flex justify-center">
            {animationData && (
              <Lottie
                animationData={animationData}
                style={{ width: 200, height: 200 }}
                loop={true}
              />
            )}
          </div>
          
          {/* Congratulations Text */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-600 text-lg">
              You got one project assigned
            </p>
            {projectTitle && (
              <p className="text-sm text-gray-500 mt-2">
                Project: {projectTitle}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleViewProjects}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              View Projects
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-2"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectAssignmentNotification; 