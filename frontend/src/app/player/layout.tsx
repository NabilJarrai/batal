"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { RoleGuard } from "@/components/RoleGuard";
import { UserRole } from "@/types/auth";
import { ResponsiveLayout } from "@/components/responsive";
import {
  UserCircleIcon,
  DocumentChartBarIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface PlayerLayoutProps {
  children: React.ReactNode;
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/player/dashboard",
      icon: HomeIcon,
    },
    {
      name: "My Assessments",
      href: "/player/assessments",
      icon: DocumentChartBarIcon,
    },
    {
      name: "Nutrition Program",
      href: "/player/nutrition",
      icon: HeartIcon,
    },
    {
      name: "My Profile",
      href: "/player/profile",
      icon: UserCircleIcon,
    },
  ];

  const isActive = (path: string) => pathname === path;

  const navItemsForMobile = navigation.map((item) => ({
    href: item.href,
    label: item.name,
    icon: <item.icon className="h-5 w-5" />,
  }));

  const logoComponent = (
    <Link href="/player/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="relative w-8 h-8">
        <Image
          src="/Logo.jpeg"
          alt="Batal Sports Academy"
          fill
          className="object-contain"
        />
      </div>
      <span className="text-lg font-bold text-gray-900">Batal</span>
    </Link>
  );

  const sidebarContent = (
    <>
      {/* Logo for desktop sidebar */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/player/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-10 h-10">
            <Image
              src="/Logo.jpeg"
              alt="Batal Sports Academy"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Batal Academy
            </h1>
            <p className="text-xs text-gray-500">Player Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  const topNavContent = (
    <div className="flex justify-between items-center h-16 pl-14 lg:pl-0">
      <div className="flex items-center">
        <span className="text-sm sm:text-base text-gray-700">
          Welcome, <span className="font-semibold">{user?.firstName || "Player"}</span>
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-2 sm:px-4 text-xs sm:text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );

  return (
    <RoleGuard allowedRoles={[UserRole.PARENT]}>
      <ResponsiveLayout
        sidebar={sidebarContent}
        navItems={navItemsForMobile}
        userInfo={{
          name: user?.firstName || "Player",
          role: "Player",
        }}
        onLogout={handleLogout}
        logo={logoComponent}
        topNav={topNavContent}
      >
        <div className="max-w-6xl mx-auto">{children}</div>
      </ResponsiveLayout>
    </RoleGuard>
  );
}