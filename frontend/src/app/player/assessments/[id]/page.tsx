"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SkillRadarChart } from "@/components/player/SkillRadarChart";
import { 
  ArrowLeftIcon, 
  DocumentChartBarIcon, 
  CalendarIcon,
  UserIcon 
} from "@heroicons/react/24/outline";

interface SkillScore {
  skillId: number;
  skillName: string;
  category: string;
  score: number;
  notes?: string;
}

interface Assessment {
  id: number;
  assessmentDate: string;
  period: string;
  assessorName: string;
  isFinalized: boolean;
  comments?: string;
  coachNotes?: string;
  skillScores?: SkillScore[];
  createdAt: string;
  updatedAt: string;
}

export default function AssessmentDetail() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAssessment(params.id as string);
    }
  }, [params.id]);

  const fetchAssessment = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/me/assessments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      } else if (response.status === 404) {
        router.push("/player/assessments");
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupSkillsByCategory = (skills: SkillScore[]) => {
    const grouped: Record<string, SkillScore[]> = {};
    skills.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    });
    return grouped;
  };

  const getCategoryAverage = (skills: SkillScore[]) => {
    const sum = skills.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skills.length).toFixed(1);
  };

  const getOverallAverage = (skills: SkillScore[]) => {
    if (!skills || skills.length === 0) return "0.0";
    const sum = skills.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skills.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center text-white">
        <p>Assessment not found</p>
      </div>
    );
  }

  const groupedSkills = assessment.skillScores ? groupSkillsByCategory(assessment.skillScores) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <button
          onClick={() => router.push("/player/assessments")}
          className="flex items-center gap-2 text-blue-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Assessments
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {assessment.period} Assessment
            </h1>
            <div className="flex items-center gap-6 text-sm text-blue-200">
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
                ? "bg-green-500/20 text-green-300"
                : "bg-yellow-500/20 text-yellow-300"
            }`}>
              {assessment.isFinalized ? "Finalized" : "Draft"}
            </span>
            {assessment.skillScores && assessment.skillScores.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-blue-200">Overall Score</p>
                <p className="text-3xl font-bold text-white">
                  {getOverallAverage(assessment.skillScores)}/10
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Radar Chart */}
      {assessment.skillScores && assessment.skillScores.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Performance Overview</h2>
          <SkillRadarChart skills={assessment.skillScores} />
        </div>
      )}

      {/* Skills by Category */}
      {Object.keys(groupedSkills).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div
              key={category}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{category}</h3>
                <span className="text-lg font-bold text-blue-300">
                  Avg: {getCategoryAverage(skills)}/10
                </span>
              </div>
              
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.skillId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-blue-200">{skill.skillName}</span>
                      <span className="text-white font-medium">{skill.score}/10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-cyan-300 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${skill.score * 10}%` }}
                      />
                    </div>
                    {skill.notes && (
                      <p className="text-xs text-blue-200 mt-1">{skill.notes}</p>
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
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Comments</h2>
          
          {assessment.comments && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">General Comments</h3>
              <p className="text-white">{assessment.comments}</p>
            </div>
          )}
          
          {assessment.coachNotes && (
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Coach Notes</h3>
              <p className="text-white">{assessment.coachNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-blue-200">
        <p>Assessment created on {new Date(assessment.createdAt).toLocaleString()}</p>
        {assessment.updatedAt !== assessment.createdAt && (
          <p>Last updated on {new Date(assessment.updatedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}