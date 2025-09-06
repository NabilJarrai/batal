"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DocumentChartBarIcon, CalendarIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface Assessment {
  id: number;
  assessmentDate: string;
  period: string;
  assessorName: string;
  isFinalized: boolean;
  comments?: string;
  skillScores?: Array<{
    skillName: string;
    category: string;
    score: number;
  }>;
}

export default function PlayerAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "finalized" | "draft">("all");

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/players/me/assessments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    if (filter === "all") return true;
    if (filter === "finalized") return assessment.isFinalized;
    if (filter === "draft") return !assessment.isFinalized;
    return true;
  });

  const calculateAverageScore = (skillScores?: Array<{ score: number }>) => {
    if (!skillScores || skillScores.length === 0) return 0;
    const sum = skillScores.reduce((acc, skill) => acc + skill.score, 0);
    return (sum / skillScores.length).toFixed(1);
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
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">My Assessments</h1>
        <p className="text-blue-200">Track your performance evaluations over time</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === "all"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          All ({assessments.length})
        </button>
        <button
          onClick={() => setFilter("finalized")}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === "finalized"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          Finalized ({assessments.filter(a => a.isFinalized).length})
        </button>
        <button
          onClick={() => setFilter("draft")}
          className={`px-4 py-2 rounded-lg transition-all ${
            filter === "draft"
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          Draft ({assessments.filter(a => !a.isFinalized).length})
        </button>
      </div>

      {/* Assessments List */}
      {filteredAssessments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => (
            <Link
              key={assessment.id}
              href={`/player/assessments/${assessment.id}`}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <DocumentChartBarIcon className="h-8 w-8 text-blue-400" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {assessment.period} Assessment
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-blue-200">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </span>
                        <span>By {assessment.assessorName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {assessment.skillScores && assessment.skillScores.length > 0 && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-blue-200">Average Score:</span>
                      <span className="text-2xl font-bold text-white">
                        {calculateAverageScore(assessment.skillScores)}/10
                      </span>
                    </div>
                  )}

                  {assessment.comments && (
                    <p className="text-sm text-blue-200 mt-2 line-clamp-2">
                      {assessment.comments}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assessment.isFinalized
                      ? "bg-green-500/20 text-green-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {assessment.isFinalized ? "Finalized" : "Draft"}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 text-white/50 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
          <DocumentChartBarIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Assessments Found</h3>
          <p className="text-blue-200">
            {filter === "all" 
              ? "You don't have any assessments yet."
              : `You don't have any ${filter} assessments.`}
          </p>
        </div>
      )}
    </div>
  );
}