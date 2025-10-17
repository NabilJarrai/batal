"use client";

import { useAppSelector } from "@/store/hooks";

export default function ParentProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">Name</label>
            <p className="text-text-primary">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Email</label>
            <p className="text-text-primary">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
