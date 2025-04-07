
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };
  
  return (
    <div className={`inline-block ${sizeClasses[size]} border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/10 rounded-full animate-spin`} />
  );
};

export default LoadingSpinner;
