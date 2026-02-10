/**
 * Thomson Reuters Logo Component
 * 
 * Displays the Thomson Reuters logo with proper styling
 */

import React from 'react';

interface ThomsonReutersLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThomsonReutersLogo: React.FC<ThomsonReutersLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  const sizeDimensions = {
    sm: { width: 120, height: 24 },
    md: { width: 160, height: 32 },
    lg: { width: 240, height: 48 },
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Thomson Reuters Official Logo */}
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/5/59/Thomson_Reuters_logo.svg"
        alt="Thomson Reuters"
        width={sizeDimensions[size].width}
        height={sizeDimensions[size].height}
        className={`${sizeClasses[size]} w-auto object-contain brightness-100 dark:brightness-[1.4] dark:contrast-[1.1] transition-all duration-300`}
      />
    </div>
  );
};
