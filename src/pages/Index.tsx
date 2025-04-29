
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the join page
    navigate('/join');
  }, [navigate]);

  // This will never be shown as we redirect immediately
  return null;
};

export default Index;
