'use client';

import { ReactNode } from 'react';

interface ResponsiveButtonGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  fullWidthOnMobile?: boolean;
}

export default function ResponsiveButtonGroup({
  children,
  orientation = 'responsive',
  align = 'start',
  gap = 'md',
  className = '',
  fullWidthOnMobile = false,
}: ResponsiveButtonGroupProps) {
  // Orientation classes
  const orientationClasses = {
    horizontal: 'flex-row flex-wrap',
    vertical: 'flex-col',
    responsive: 'flex-col sm:flex-row flex-wrap',
  };

  // Alignment classes
  const alignClasses = {
    start: 'justify-start items-start',
    center: 'justify-center items-center',
    end: 'justify-end items-end',
    stretch: 'justify-start items-stretch',
  };

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
  };

  // Full width on mobile
  const widthClasses = fullWidthOnMobile ? '[&>*]:w-full sm:[&>*]:w-auto' : '';

  return (
    <div
      className={`flex ${orientationClasses[orientation]} ${alignClasses[align]} ${gapClasses[gap]} ${widthClasses} ${className}`}
    >
      {children}
    </div>
  );
}
