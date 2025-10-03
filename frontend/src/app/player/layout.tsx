"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { RoleGuard } from "@/components/RoleGuard";
import { UserRole } from "@/types/auth";
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

  return (
    <RoleGuard allowedRoles={[UserRole.PLAYER]}>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <nav className="bg-background border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-text-primary">
                  Batal Academy
                </h1>
                <span className="ml-4 text-sm text-text-secondary">Player Portal</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-text-primary">
                  Welcome, {user?.firstName || "Player"}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-secondary-100 hover:bg-secondary rounded-lg transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-[calc(100vh-4rem)] bg-secondary-50 border-r border-border">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary shadow-lg"
                        : "text-text-primary hover:bg-secondary-100 hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}