"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchMyAssessments, selectAssessments, selectAssessmentLoading } from "@/store/assessmentSlice";
import { CategoryProgressChart } from "@/components/player/CategoryProgressChart";
import { SkillProgressChart } from "@/components/player/SkillProgressChart";
import { ChartBarIcon, ArrowTrendingUpIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function PlayerProgress() {
  const dispatch = useDispatch<AppDispatch>();
  const assessments = useSelector((state: RootState) => selectAssessments(state));
  const loading = useSelector((state: RootState) => selectAssessmentLoading(state));
  
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; category: string } | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "skills">("overview");

  useEffect(() => {
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

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Analytics</h1>
            <p className="text-gray-600">
              Track your skill development and performance trends over time
            </p>
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {stats.current.toFixed(1)}/10
              </div>
              <div className={`text-sm ${stats.change >= 0 ? 'text-accent-teal' : 'text-accent-red'}`}>
                {stats.change >= 0 ? '↑' : '↓'} {Math.abs(stats.change).toFixed(1)} from last assessment
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {stats.assessmentCount} total assessments
              </div>
            </div>
          )}
        </div>
      </div>

      {assessments.length === 0 && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <ChartBarIcon className="h-16 w-16 text-text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Progress Data</h3>
          <p className="text-gray-600">
            Complete your first assessment to start tracking your progress.
          </p>
        </div>
      )}

      {assessments.length === 1 && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <ArrowTrendingUpIcon className="h-16 w-16 text-accent-yellow mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Need More Data</h3>
          <p className="text-gray-600">
            Complete at least 2 assessments to see your progress trends and charts.
          </p>
        </div>
      )}

      {assessments.length >= 2 && (
        <>
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === "overview"
                  ? "bg-primary text-white"
                  : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
              }`}
            >
              Category Overview
            </button>
            <button
              onClick={() => setViewMode("skills")}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === "skills"
                  ? "bg-primary text-white"
                  : "bg-secondary-100 text-text-primary hover:bg-secondary-50"
              }`}
            >
              Individual Skills
            </button>
          </div>

          {/* Overview Mode */}
          {viewMode === "overview" && (
            <CategoryProgressChart assessments={assessments} />
          )}

          {/* Skills Mode */}
          {viewMode === "skills" && (
            <div className="space-y-6">
              {/* Skill Selector */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select a Skill to View Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSkills.map((skill, index) => (
                    <button
                      key={`${skill.category}-${skill.name}`}
                      onClick={() => setSelectedSkill(skill)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedSkill?.name === skill.name && selectedSkill?.category === skill.category
                          ? "bg-primary text-white"
                          : "bg-secondary-50 text-text-primary hover:bg-secondary-100"
                      }`}
                    >
                      <div className="font-medium">{skill.name}</div>
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
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                  <ChartBarIcon className="h-12 w-12 text-text-primary mx-auto mb-3" />
                  <p className="text-gray-600">
                    Select a skill above to view its progress over time
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick Stats Summary */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment History</h3>
          <div className="space-y-3">
            {assessments.slice(0, 5).map((assessment, index) => (
              <div key={assessment.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-text-primary" />
                  <div>
                    <span className="text-gray-900 font-medium">{assessment.period}</span>
                    <span className="text-gray-600 text-sm ml-2">
                      {new Date(assessment.assessmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-bold">
                    {assessment.skillScores 
                      ? (assessment.skillScores.reduce((sum, skill) => sum + skill.score, 0) / assessment.skillScores.length).toFixed(1)
                      : "N/A"
                    }/10
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    assessment.isFinalized 
                      ? "bg-green-500/20 text-accent-teal" 
                      : "bg-yellow-500/20 text-accent-yellow"
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