"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProgressRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the enhanced dashboard which now includes progress analytics
    router.replace("/player/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">Progress analytics have been moved to your dashboard...</p>
      </div>
    </div>
  );
}