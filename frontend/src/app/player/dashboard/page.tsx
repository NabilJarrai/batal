"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { AssessmentCard } from "@/components/player/AssessmentCard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
import { 
  UserCircleIcon, 
  CalendarIcon, 
  TrophyIcon,
  ChartBarIcon 
} from "@heroicons/react/24/outline";
import { AppDispatch, RootState } from "@/store";
import { fetchMyAssessments, selectLatestAssessment, selectAssessments } from "@/store/assessmentSlice";

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
  const dispatch = useDispatch<AppDispatch>();
  const latestAssessment = useSelector((state: RootState) => selectLatestAssessment(state));
  const assessments = useSelector((state: RootState) => selectAssessments(state));
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerProfile();
    dispatch(fetchMyAssessments());
  }, [dispatch]);

  const fetchPlayerProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch player profile
      const profileResponse = await fetch(`${API_BASE_URL}/players/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching player profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Welcome back, {profile?.firstName}!
        </h1>
        <p className="text-text-secondary">
          Track your progress and view your performance assessments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <UserCircleIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-text-secondary">Level</p>
              <p className="text-xl font-bold text-text-primary">
                {profile?.level || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 text-accent-yellow" />
            <div>
              <p className="text-sm text-text-secondary">Group</p>
              <p className="text-xl font-bold text-text-primary">
                {profile?.groupName || "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-accent-teal" />
            <div>
              <p className="text-sm text-text-secondary">Member Since</p>
              <p className="text-xl font-bold text-text-primary">
                {profile?.joiningDate
                  ? new Date(profile.joiningDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-secondary" />
            <div>
              <p className="text-sm text-text-secondary">Assessments</p>
              <p className="text-xl font-bold text-text-primary">
                {assessments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Assessment */}
      {latestAssessment && (
        <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">
              Latest Assessment
            </h2>
            <Link
              href={`/player/assessments/${latestAssessment.id}`}
              className="text-primary hover:text-primary-hover transition-colors"
            >
              View Details →
            </Link>
          </div>
          <AssessmentCard assessment={latestAssessment} />
        </div>
      )}

      {/* No Assessment Message */}
      {!latestAssessment && (
        <div className="bg-background rounded-xl p-8 border border-border shadow-sm text-center">
          <ChartBarIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">
            No Assessments Yet
          </h3>
          <p className="text-text-secondary mb-4">
            Your coach will evaluate your performance regularly. Check back soon!
          </p>
          <Link
            href="/player/assessments"
            className="inline-block px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            View All Assessments
          </Link>
        </div>
      )}
    </div>
  );
}