"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { parentAPI } from "@/lib/api";
import { DocumentChartBarIcon, CalendarIcon, ChevronRightIcon, UserCircleIcon } from "@heroicons/react/24/outline";

interface AssessmentResponse {
  id: number;
  playerName: string;
  assessorName: string;
  assessmentDate: string;
  period: string;
  comments?: string;
  coachNotes?: string;
  isFinalized: boolean;
  overallAverage?: number;
  skillScores?: Array<{
    id: number;
    skillId: number;
    skillName: string;
    category: string;
    score: number;
    notes?: string;
  }>;
}

export default function ParentAssessmentsPage() {
  const selectedChildId = useAppSelector((state) => state.auth.selectedChildId);
  const children = useAppSelector((state) => state.auth.children);
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "finalized" | "draft">("all");

  const selectedChild = children?.find(child => child.id === selectedChildId);

  useEffect(() => {
    if (selectedChildId) {
      fetchAssessments();
    }
  }, [selectedChildId]);

  const fetchAssessments = async () => {
    if (!selectedChildId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await parentAPI.getChildAssessments(selectedChildId);
      setAssessments(data);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      setError("Failed to load assessments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (filter === "all") return true;
    if (filter === "finalized") return assessment.isFinalized;
    if (filter === "draft") return !assessment.isFinalized;
    return true;
  });

  const calculateAverageScore = (assessment: AssessmentResponse) => {
    const skillScores = assessment.skillScores;
    if (!skillScores || skillScores.length === 0) return 0;
    const sum = skillScores.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skillScores.length).toFixed(1);
  };

  if (!selectedChildId) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center">
        <UserCircleIcon className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-3">No Child Selected</h3>
        <p className="text-text-secondary text-base">
          Please select a child from the sidebar to view their assessments.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {selectedChild?.firstName}'s Assessments
          </h1>
          <p className="text-gray-600">Track your child's performance evaluations over time</p>
        </div>
        <div className="alert-error">
          <h3 className="text-lg font-bold text-accent-red mb-2">Error Loading Assessments</h3>
          <p className="text-accent-red">{error}</p>
          <button
            onClick={fetchAssessments}
            className="mt-4 btn-destructive btn-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {selectedChild?.firstName}'s Assessments
        </h1>
        <p className="text-gray-600">Track your child's performance evaluations over time</p>
      </div>

      {/* Filter tabs. Wrap rather than run off the side of a phone. */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: "All", count: assessments.length },
          {
            key: "finalized",
            label: "Finalised",
            count: assessments.filter((a) => a.isFinalized).length,
          },
          {
            key: "draft",
            label: "Draft",
            count: assessments.filter((a) => !a.isFinalized).length,
          },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 sm:px-4 py-2 text-sm rounded-lg transition-all font-medium ${
              filter === tab.key
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Assessments List */}
      {filteredAssessments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <Link
              key={assessment.id}
              href={`/parent/assessments/${assessment.id}`}
              className="block bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 sm:gap-4 mb-2">
                    <DocumentChartBarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                        {assessment.period} Assessment
                      </h3>
                      {/* Date and assessor wrap on narrow screens instead of
                          pushing the score and chevron off the edge. */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </span>
                        <span className="truncate">By {assessment.assessorName}</span>
                      </div>
                    </div>
                  </div>

                  {assessment.skillScores && assessment.skillScores.length > 0 && (
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-xs sm:text-sm text-gray-600">Average</span>
                      <span className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">
                        {calculateAverageScore(assessment)}/10
                      </span>
                    </div>
                  )}

                  {assessment.comments && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {assessment.comments}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    assessment.isFinalized
                      ? "bg-green-500/20 text-accent-teal"
                      : "bg-yellow-500/20 text-accent-yellow"
                  }`}>
                    {assessment.isFinalized ? "Final" : "Draft"}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 text-text-secondary group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <DocumentChartBarIcon className="h-16 w-16 text-text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Assessments Found</h3>
          <p className="text-gray-600">
            {filter === "all"
              ? `${selectedChild?.firstName} doesn't have any assessments yet.`
              : `${selectedChild?.firstName} doesn't have any ${filter} assessments.`}
          </p>
        </div>
      )}
    </div>
  );
}
