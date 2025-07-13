import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectApprovalNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle?: string;
  earnings?: number;
}

const ProjectApprovalNotification: React.FC<ProjectApprovalNotificationProps> = ({
  isOpen,
  onClose,
  projectTitle,
  earnings = 0
}) => {
  const navigate = useNavigate();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load the animation data
    fetch('/Money.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const handleViewProjects = () => {
    onClose();
    navigate('/projects');
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background overlay with blur */}
      <motion.div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative z-10 w-full max-w-md mx-4 bg-white shadow-2xl">
          <CardContent className="p-8 text-center">
            {/* Money Animation */}
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
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Congratulations!
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                Your project has been approved
              </p>
              {projectTitle && (
                <p className="text-sm text-gray-500 mb-3">
                  Project: {projectTitle}
                </p>
              )}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-lg font-semibold text-green-800">
                  You earned: <span className="text-2xl">${earnings.toFixed(2)}</span>
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleViewProjects}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
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
      </motion.div>
    </motion.div>
  );
};

export default ProjectApprovalNotification; 