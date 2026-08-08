"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { parentAPI } from "@/lib/api";
import { SkillRadarChart } from "@/components/player/SkillRadarChart";
import { getScoreBarColor, scoreToPercent } from "@/types/assessments";
import { SkillCategory, getCategoryInfo } from "@/types/skills";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

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
  createdAt?: string;
  updatedAt?: string;
  skillScores?: Array<{
    id: number;
    skillId: number;
    skillName: string;
    // The API sends skillCategory. This was declared as `category`, so every
    // skill grouped under the key "undefined" and the page rendered a single
    // card titled "undefined" instead of one per category.
    skillCategory: string;
    score: number;
    notes?: string;
    previousScore?: number | null;
    improvement?: number | null;
  }>;
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = parseInt(params.id as string, 10);
  const selectedChildId = useAppSelector((state) => state.auth.selectedChildId);
  const children = useAppSelector((state) => state.auth.children);

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedChild = children?.find(child => child.id === selectedChildId);

  useEffect(() => {
    if (selectedChildId && assessmentId) {
      fetchAssessment();
    }
  }, [selectedChildId, assessmentId]);

  const fetchAssessment = async () => {
    if (!selectedChildId || !assessmentId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await parentAPI.getChildAssessment(selectedChildId, assessmentId);
      setAssessment(data);
    } catch (err) {
      console.error("Failed to fetch assessment:", err);
      setError("Failed to load assessment details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const groupSkillsByCategory = (assessment: AssessmentResponse) => {
    if (!assessment.skillScores) return {};

    const grouped: Record<string, typeof assessment.skillScores> = {};
    assessment.skillScores.forEach((skill) => {
      if (!grouped[skill.skillCategory]) {
        grouped[skill.skillCategory] = [];
      }
      grouped[skill.skillCategory].push(skill);
    });
    return grouped;
  };

  const getCategoryAverage = (skills: AssessmentResponse['skillScores']) => {
    if (!skills || skills.length === 0) return "0.0";
    const sum = skills.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skills.length).toFixed(1);
  };

  const getOverallAverage = (assessment: AssessmentResponse) => {
    if (!assessment.skillScores || assessment.skillScores.length === 0) return "0.0";
    const sum = assessment.skillScores.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / assessment.skillScores.length).toFixed(1);
  };

  if (!selectedChildId) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg text-center">
        <UserCircleIcon className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-3">No Child Selected</h3>
        <p className="text-text-secondary text-base">
          Please select a child from the sidebar to view their assessment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-accent-red mb-2">Error Loading Assessment</h3>
        <p className="text-accent-red">{error}</p>
        <button
          onClick={() => router.push("/parent/assessments")}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Back to Assessments
        </button>
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

  if (!assessment) {
    return (
      <div className="text-center text-gray-900">
        <p>Assessment not found</p>
      </div>
    );
  }

  const groupedSkills = groupSkillsByCategory(assessment);

  // Scores are already 1-10 (enforced by skill_scores_score_check), and the
  // radar chart scales them for plotting itself. Dividing here too shrank every
  // axis to a tenth of its real value.
  const radarSkills = assessment.skillScores?.map(skill => ({
    skillName: skill.skillName,
    skillCategory: skill.skillCategory,
    score: skill.score,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <button
          onClick={() => router.push("/parent/assessments")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Assessments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {assessment.period} Assessment
            </h1>
            <p className="text-base sm:text-lg text-gray-700 mb-3">
              {selectedChild?.firstName} {selectedChild?.lastName}
            </p>
            {/* Wraps: on a phone the date and the assessor's name do not fit on one line. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                {new Date(assessment.assessmentDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <UserIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Assessed by {assessment.assessorName}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                assessment.isFinalized
                  ? "bg-green-500/20 text-accent-teal"
                  : "bg-yellow-500/20 text-accent-yellow"
              }`}
            >
              {assessment.isFinalized ? "Finalized" : "Draft"}
            </span>
            {assessment.skillScores && assessment.skillScores.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {getOverallAverage(assessment)}/10
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Radar Chart */}
      {radarSkills.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Overview</h2>
          <SkillRadarChart skills={radarSkills} />
        </div>
      )}

      {/* Skills by Category */}
      {Object.keys(groupedSkills).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div
              key={category}
              className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {getCategoryInfo(category as SkillCategory)?.label ?? category}
                </h3>
                <span className="text-base sm:text-lg font-bold text-blue-600 flex-shrink-0 tabular-nums">
                  Avg: {getCategoryAverage(skills)}/10
                </span>
              </div>

              <div className="space-y-3">
                {skills?.map((skill) => (
                  <div key={skill.skillId}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-sm text-gray-600 min-w-0">{skill.skillName}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        {/* The API already computes score - previousScore. A parent
                            wants the direction of travel, not just today's number. */}
                        {skill.improvement != null && skill.improvement !== 0 && (
                          <span
                            className={`text-xs font-semibold ${
                              skill.improvement > 0 ? "text-accent-teal" : "text-accent-red"
                            }`}
                          >
                            {skill.improvement > 0 ? "↑" : "↓"} {Math.abs(skill.improvement)}
                          </span>
                        )}
                        <span className="text-gray-900 font-semibold tabular-nums">
                          {skill.score}/10
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${getScoreBarColor(skill.score)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${scoreToPercent(skill.score)}%` }}
                      />
                    </div>
                    {skill.notes && (
                      <p className="text-xs text-gray-600 mt-1">{skill.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Section */}
      {(assessment.comments || assessment.coachNotes) && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments</h2>

          {assessment.comments && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">General Comments</h3>
              <p className="text-gray-900">{assessment.comments}</p>
            </div>
          )}

          {assessment.coachNotes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coach Notes</h3>
              <p className="text-gray-900">{assessment.coachNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {(assessment.createdAt || assessment.updatedAt) && (
        <div className="text-center text-sm text-gray-600">
          {assessment.createdAt && (
            <p>Assessment created on {new Date(assessment.createdAt).toLocaleString()}</p>
          )}
          {assessment.updatedAt && assessment.updatedAt !== assessment.createdAt && (
            <p>Last updated on {new Date(assessment.updatedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
