'use client';

import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  // Build grid column classes
  const colClasses = [];
  if (cols.default) colClasses.push(`grid-cols-${cols.default}`);
  if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
  if (cols['2xl']) colClasses.push(`2xl:grid-cols-${cols['2xl']}`);

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-10',
  };

  return (
    <div className={`grid ${colClasses.join(' ')} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}
