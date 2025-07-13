import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectApprovalContextType {
  showApprovalNotification: (projectTitle?: string, earnings?: number) => void;
  hideApprovalNotification: () => void;
  isApprovalNotificationOpen: boolean;
  currentApprovalProject?: string;
  currentEarnings?: number;
}

const ProjectApprovalContext = createContext<ProjectApprovalContextType | undefined>(undefined);

export const useProjectApproval = () => {
  const context = useContext(ProjectApprovalContext);
  if (!context) {
    throw new Error('useProjectApproval must be used within a ProjectApprovalProvider');
  }
  return context;
};

interface ProjectApprovalProviderProps {
  children: ReactNode;
}

export const ProjectApprovalProvider: React.FC<ProjectApprovalProviderProps> = ({ children }) => {
  const [isApprovalNotificationOpen, setIsApprovalNotificationOpen] = useState(false);
  const [currentApprovalProject, setCurrentApprovalProject] = useState<string | undefined>(undefined);
  const [currentEarnings, setCurrentEarnings] = useState<number | undefined>(undefined);

  const showApprovalNotification = (projectTitle?: string, earnings?: number) => {
    setCurrentApprovalProject(projectTitle);
    setCurrentEarnings(earnings);
    setIsApprovalNotificationOpen(true);
  };

  const hideApprovalNotification = () => {
    setIsApprovalNotificationOpen(false);
    setCurrentApprovalProject(undefined);
    setCurrentEarnings(undefined);
  };

  return (
    <ProjectApprovalContext.Provider value={{
      showApprovalNotification,
      hideApprovalNotification,
      isApprovalNotificationOpen,
      currentApprovalProject,
      currentEarnings
    }}>
      {children}
    </ProjectApprovalContext.Provider>
  );
}; 