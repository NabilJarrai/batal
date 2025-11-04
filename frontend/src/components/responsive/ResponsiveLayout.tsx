'use client';

import { ReactNode } from 'react';
import MobileNav from './MobileNav';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  navItems: NavItem[];
  userInfo?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onLogout?: () => void;
  logo?: React.ReactNode;
  topNav?: ReactNode;
  mobileExtraContent?: ReactNode;
}

export default function ResponsiveLayout({
  children,
  sidebar,
  navItems,
  userInfo,
  onLogout,
  logo,
  topNav,
  mobileExtraContent,
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav
        navItems={navItems}
        userInfo={userInfo}
        onLogout={onLogout}
        logo={logo}
        extraContent={mobileExtraContent}
      />

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 w-full">
          {/* Top Navigation */}
          {topNav && (
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
              <div className="px-4 sm:px-6 lg:px-8">
                {topNav}
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
