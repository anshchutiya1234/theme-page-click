import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectAssignmentContextType {
  showNotification: (projectTitle?: string) => void;
  hideNotification: () => void;
  isNotificationOpen: boolean;
  currentProjectTitle?: string;
}

const ProjectAssignmentContext = createContext<ProjectAssignmentContextType | undefined>(undefined);

export const useProjectAssignment = () => {
  const context = useContext(ProjectAssignmentContext);
  if (!context) {
    throw new Error('useProjectAssignment must be used within a ProjectAssignmentProvider');
  }
  return context;
};

interface ProjectAssignmentProviderProps {
  children: ReactNode;
}

export const ProjectAssignmentProvider: React.FC<ProjectAssignmentProviderProps> = ({ children }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string | undefined>(undefined);

  const showNotification = (projectTitle?: string) => {
    setCurrentProjectTitle(projectTitle);
    setIsNotificationOpen(true);
  };

  const hideNotification = () => {
    setIsNotificationOpen(false);
    setCurrentProjectTitle(undefined);
  };

  return (
    <ProjectAssignmentContext.Provider value={{
      showNotification,
      hideNotification,
      isNotificationOpen,
      currentProjectTitle
    }}>
      {children}
    </ProjectAssignmentContext.Provider>
  );
}; 