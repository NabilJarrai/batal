"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { AssessmentCard } from "@/components/player/AssessmentCard";
import { 
  UserCircleIcon, 
  CalendarIcon, 
  TrophyIcon,
  ChartBarIcon 
} from "@heroicons/react/24/outline";

interface Assessment {
  id: number;
  assessmentDate: string;
  period: string;
  overallScore?: number;
  isFinalized: boolean;
}

interface PlayerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  groupName?: string;
  joiningDate: string;
}

export default function PlayerDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player profile
      const profileResponse = await fetch("/api/players/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch latest assessment
      const assessmentResponse = await fetch("/api/players/me/assessments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      
      if (assessmentResponse.ok) {
        const assessments = await assessmentResponse.json();
        if (assessments.length > 0) {
          setLatestAssessment(assessments[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.firstName}!
        </h1>
        <p className="text-blue-200">
          Track your progress and view your performance assessments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-blue-200">Level</p>
              <p className="text-xl font-bold text-white">
                {profile?.level || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-blue-200">Group</p>
              <p className="text-xl font-bold text-white">
                {profile?.groupName || "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-sm text-blue-200">Member Since</p>
              <p className="text-xl font-bold text-white">
                {profile?.joiningDate
                  ? new Date(profile.joiningDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-sm text-blue-200">Assessments</p>
              <p className="text-xl font-bold text-white">
                {latestAssessment ? "View Latest" : "None Yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Assessment */}
      {latestAssessment && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Latest Assessment
          </h2>
          <AssessmentCard assessment={latestAssessment} />
        </div>
      )}

      {/* No Assessment Message */}
      {!latestAssessment && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <ChartBarIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            No Assessments Yet
          </h3>
          <p className="text-blue-200">
            Your coach will evaluate your performance regularly. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}