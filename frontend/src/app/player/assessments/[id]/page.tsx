"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { SkillRadarChart } from "@/components/player/SkillRadarChart";
import { 
  ArrowLeftIcon, 
  DocumentChartBarIcon, 
  CalendarIcon,
  UserIcon 
} from "@heroicons/react/24/outline";
import { AppDispatch, RootState } from "@/store";
import { fetchAssessmentById, selectCurrentAssessment, selectAssessmentLoading, selectAssessmentError } from "@/store/assessmentSlice";
import { Assessment } from "@/types/assessments";

export default function AssessmentDetail() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const assessment = useSelector((state: RootState) => selectCurrentAssessment(state));
  const loading = useSelector((state: RootState) => selectAssessmentLoading(state));
  const error = useSelector((state: RootState) => selectAssessmentError(state));

  useEffect(() => {
    if (params.id) {
      dispatch(fetchAssessmentById(Number(params.id)));
    }
  }, [params.id, dispatch]);

  const groupSkillsByCategory = (assessment: Assessment) => {
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

  const getCategoryAverage = (skills: Assessment['skillScores']) => {
    if (!skills || skills.length === 0) return "0.0";
    const sum = skills.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skills.length).toFixed(1);
  };

  const getOverallAverage = (assessment: Assessment) => {
    if (!assessment.skillScores || assessment.skillScores.length === 0) return "0.0";
    const sum = assessment.skillScores.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / assessment.skillScores.length).toFixed(1);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-accent-red mb-2">Error Loading Assessment</h3>
        <p className="text-accent-red">{error}</p>
        <button 
          onClick={() => router.push("/player/assessments")}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  if (loading) {
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

  const groupedSkills = assessment ? groupSkillsByCategory(assessment) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <button
          onClick={() => router.push("/player/assessments")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Assessments
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {assessment.period} Assessment
            </h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(assessment.assessmentDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                Assessed by {assessment.assessorName}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              assessment.isFinalized
                ? "bg-green-500/20 text-accent-teal"
                : "bg-yellow-500/20 text-accent-yellow"
            }`}>
              {assessment.isFinalized ? "Finalized" : "Draft"}
            </span>
            {assessment.skillScores && assessment.skillScores.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {getOverallAverage(assessment)}/10
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Radar Chart */}
      {assessment.skillScores && assessment.skillScores.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance Overview</h2>
          <SkillRadarChart skills={assessment.skillScores} />
        </div>
      )}

      {/* Skills by Category */}
      {Object.keys(groupedSkills).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div
              key={category}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                <span className="text-lg font-bold text-blue-600">
                  Avg: {getCategoryAverage(skills)}/10
                </span>
              </div>
              
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.skillId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{skill.skillName}</span>
                      <span className="text-gray-900 font-medium">{skill.score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-cyan-300 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${skill.score * 10}%` }}
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
      <div className="text-center text-sm text-gray-600">
        <p>Assessment created on {new Date(assessment.createdAt).toLocaleString()}</p>
        {assessment.updatedAt !== assessment.createdAt && (
          <p>Last updated on {new Date(assessment.updatedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}