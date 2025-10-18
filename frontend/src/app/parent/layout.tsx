"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { RoleGuard } from "@/components/RoleGuard";
import { UserRole } from "@/types/auth";
import ChildSelector from "@/components/parent/ChildSelector";
import {
  UserCircleIcon,
  DocumentChartBarIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
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
      href: "/parent/dashboard",
      icon: HomeIcon,
    },
    {
      name: "Assessments",
      href: "/parent/assessments",
      icon: DocumentChartBarIcon,
    },
    {
      name: "Nutrition Program",
      href: "/parent/nutrition",
      icon: HeartIcon,
    },
    {
      name: "Profile",
      href: "/parent/profile",
      icon: UserCircleIcon,
    },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <RoleGuard allowedRoles={[UserRole.PARENT]}>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <nav className="bg-background border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-3">
                <Link href="/parent/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/Logo.jpeg"
                      alt="Batal Sports Academy"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    Batal Academy
                  </h1>
                </Link>
                <span className="ml-1 text-sm text-text-secondary">Parent Portal</span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-text-primary">
                  Welcome, {user?.firstName || "Parent"}
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
            {/* Child Selector at the top of sidebar */}
            <div className="p-4 border-b border-border">
              <ChildSelector />
            </div>

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
