"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { AssessmentCard } from "@/components/player/AssessmentCard";
import { CategoryProgressChart } from "@/components/player/CategoryProgressChart";
import { SkillProgressChart } from "@/components/player/SkillProgressChart";
import { ResponsiveHeader, ResponsiveGrid, ResponsiveCard, ResponsiveButtonGroup } from "@/components/responsive";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
import {
  UserCircleIcon,
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import { AppDispatch, RootState } from "@/store";
import { fetchMyAssessments, selectLatestAssessment, selectAssessments, selectAssessmentLoading } from "@/store/assessmentSlice";

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
  const assessmentLoading = useSelector((state: RootState) => selectAssessmentLoading(state));

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; category: string } | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "skills">("overview");

  useEffect(() => {
    fetchPlayerProfile();
    dispatch(fetchMyAssessments());
  }, [dispatch]);

  // Get all unique skills from assessments for selection
  const availableSkills = Array.from(
    new Set(
      assessments
        .flatMap(a => a.skillScores || [])
        .map(skill => `${skill.skillName}|${skill.skillCategory}`)
    )
  ).map(skillStr => {
    const [name, category] = skillStr.split("|");
    return { name, category };
  }).sort((a, b) => `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`));

  const getProgressStats = () => {
    if (assessments.length < 2) return null;

    const latest = assessments[0];
    const previous = assessments[1];

    if (!latest.skillScores || !previous.skillScores) return null;

    const latestAvg = latest.skillScores.reduce((sum, skill) => sum + skill.score, 0) / latest.skillScores.length;
    const previousAvg = previous.skillScores.reduce((sum, skill) => sum + skill.score, 0) / previous.skillScores.length;

    return {
      current: latestAvg,
      change: latestAvg - previousAvg,
      assessmentCount: assessments.length,
      latestDate: new Date(latest.assessmentDate).toLocaleDateString(),
    };
  };

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

  const stats = getProgressStats();

  if (loading || assessmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section with Progress Summary */}
      <div className="bg-gradient-to-r from-primary/5 via-white to-accent-teal/5 rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              Welcome back, {profile?.firstName}!
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Track your progress and view your performance assessments
            </p>
          </div>

          {stats && (
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 flex-shrink-0 w-full sm:w-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                  {stats.current.toFixed(1)}/10
                </div>
                <div className={`text-sm font-medium mb-1 ${
                  stats.change >= 0 ? 'text-accent-teal' : 'text-accent-red'
                }`}>
                  {stats.change >= 0 ? '↑' : '↓'} {Math.abs(stats.change).toFixed(1)} from last assessment
                </div>
                <div className="text-xs text-text-secondary">
                  Latest: {stats.latestDate}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <AcademicCapIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Level</p>
              <p className="text-xl font-bold text-text-primary">
                {profile?.level || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-yellow/10 rounded-full">
              <TrophyIcon className="h-6 w-6 text-accent-yellow" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Group</p>
              <p className="text-xl font-bold text-text-primary">
                {profile?.groupName || "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-teal/10 rounded-full">
              <CalendarIcon className="h-6 w-6 text-accent-teal" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Member Since</p>
              <p className="text-lg font-bold text-text-primary">
                {profile?.joiningDate
                  ? new Date(profile.joiningDate).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary">Assessments</p>
              <p className="text-xl font-bold text-text-primary">
                {assessments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Analytics Section */}
      {assessments.length >= 2 ? (
        <div className="space-y-4">
          {/* Progress Analytics Header */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">Progress Analytics</h2>
                <p className="text-sm text-text-secondary">
                  Track your skill development and performance trends over time
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("overview")}
                  className={`px-3 py-2 text-sm rounded-lg transition-all font-medium ${
                    viewMode === "overview"
                      ? "bg-primary text-white shadow-lg"
                      : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
                  }`}
                >
                  Category Overview
                </button>
                <button
                  onClick={() => setViewMode("skills")}
                  className={`px-3 py-2 text-sm rounded-lg transition-all font-medium ${
                    viewMode === "skills"
                      ? "bg-primary text-white shadow-lg"
                      : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
                  }`}
                >
                  Individual Skills
                </button>
              </div>
            </div>

            {/* Overview Mode */}
            {viewMode === "overview" && (
              <CategoryProgressChart assessments={assessments} />
            )}

            {/* Skills Mode */}
            {viewMode === "skills" && (
              <div className="space-y-4">
                {/* Skill Selector */}
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-3">
                    Select a Skill to View Progress
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableSkills.map((skill) => (
                      <button
                        key={`${skill.category}-${skill.name}`}
                        onClick={() => setSelectedSkill(skill)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedSkill?.name === skill.name && selectedSkill?.category === skill.category
                            ? "bg-primary text-white shadow-lg"
                            : "bg-secondary-50 text-text-primary hover:bg-secondary-100 hover:shadow-md"
                        }`}
                      >
                        <div className="text-sm font-medium">{skill.name}</div>
                        <div className="text-xs opacity-70">{skill.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Skill Progress */}
                {selectedSkill && (
                  <SkillProgressChart
                    assessments={assessments}
                    skillName={selectedSkill.name}
                    category={selectedSkill.category}
                  />
                )}

                {!selectedSkill && (
                  <div className="bg-secondary-50 rounded-xl p-8 text-center">
                    <ChartBarIcon className="h-12 w-12 text-text-primary mx-auto mb-3" />
                    <p className="text-text-secondary text-base">
                      Select a skill above to view its progress over time
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : assessments.length === 1 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center">
          <ArrowTrendingUpIcon className="h-16 w-16 text-accent-yellow mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-3">Need More Data</h3>
          <p className="text-text-secondary text-base">
            Complete at least 2 assessments to see your progress trends and analytics.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center">
          <ChartBarIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-3">
            No Progress Data
          </h3>
          <p className="text-text-secondary text-base mb-4">
            Complete your first assessment to start tracking your progress.
          </p>
        </div>
      )}

      {/* Latest Assessment Section */}
      {latestAssessment && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">
              Latest Assessment
            </h2>
            <Link
              href={`/player/assessments/${latestAssessment.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium"
            >
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <AssessmentCard assessment={latestAssessment} />
        </div>
      )}

      {/* Assessment History */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Recent Assessment History</h3>
            <Link
              href="/player/assessments"
              className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {assessments.slice(0, 5).map((assessment, index) => (
              <div key={assessment.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{assessment.period}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(assessment.assessmentDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-bold text-text-primary">
                      {assessment.skillScores
                        ? (assessment.skillScores.reduce((sum, skill) => sum + skill.score, 0) / assessment.skillScores.length).toFixed(1)
                        : "N/A"
                      }/10
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assessment.isFinalized
                      ? "bg-accent-teal/20 text-accent-teal"
                      : "bg-accent-yellow/20 text-accent-yellow"
                  }`}>
                    {assessment.isFinalized ? "Final" : "Draft"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}