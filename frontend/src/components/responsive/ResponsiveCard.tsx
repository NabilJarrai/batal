'use client';

import { ReactNode } from 'react';

interface ResponsiveCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export default function ResponsiveCard({
  children,
  header,
  footer,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: ResponsiveCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      {header && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]} pb-4`}>
          {header}
        </div>
      )}

      {/* Content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`border-t border-gray-200 ${paddingClasses[padding]} pt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
}
