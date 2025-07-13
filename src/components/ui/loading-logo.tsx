import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingLogo: React.FC<LoadingLogoProps> = ({ size = 'md', className = '' }) => {
  const [animationData, setAnimationData] = useState(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/trail-loading.json');
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Failed to load animation:', error);
      }
    };

    loadAnimation();
  }, []);

  if (!animationData) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <div className="h-8 w-8 border-4 border-partner-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default LoadingLogo; 