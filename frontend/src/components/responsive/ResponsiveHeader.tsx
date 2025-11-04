'use client';

import { ReactNode } from 'react';

interface ResponsiveHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function ResponsiveHeader({
  title,
  subtitle,
  actions,
  className = '',
}: ResponsiveHeaderProps) {
  return (
    <div className={`space-y-4 sm:space-y-0 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          {typeof title === 'string' ? (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <div className="mt-1">
              {typeof subtitle === 'string' ? (
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                  {subtitle}
                </p>
              ) : (
                subtitle
              )}
            </div>
          )}
        </div>

        {/* Actions Section */}
        {actions && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
