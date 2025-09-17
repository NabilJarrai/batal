"use client";

import { ProgressChart } from "./ProgressChart";
import { Assessment } from "@/types/assessments";

interface SkillProgressChartProps {
  assessments: Assessment[];
  skillName: string;
  category: string;
}

export function SkillProgressChart({ assessments, skillName, category }: SkillProgressChartProps) {
  // Extract the specific skill's scores across all assessments
  const skillProgressData = assessments
    .filter(assessment => assessment.skillScores && assessment.skillScores.length > 0)
    .map(assessment => {
      const skillScore = assessment.skillScores?.find(
        skill => skill.skillName === skillName && skill.skillCategory === category
      );
      
      return {
        date: assessment.assessmentDate,
        score: skillScore?.score || 0,
        period: assessment.period,
      };
    })
    .filter(data => data.score > 0) // Only include assessments where this skill was evaluated
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (skillProgressData.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-4 text-center">
        <p className="text-blue-200 text-sm">
          No progress data available for {skillName}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {skillName} Progress ({category})
      </h3>
      <ProgressChart 
        assessments={skillProgressData} 
        skillName={skillName}
      />
      
      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-blue-200">Current</p>
          <p className="text-white font-bold text-lg">
            {skillProgressData[skillProgressData.length - 1]?.score.toFixed(1) || "N/A"}/10
          </p>
        </div>
        <div className="text-center">
          <p className="text-blue-200">Best</p>
          <p className="text-white font-bold text-lg">
            {Math.max(...skillProgressData.map(d => d.score)).toFixed(1)}/10
          </p>
        </div>
        <div className="text-center">
          <p className="text-blue-200">Average</p>
          <p className="text-white font-bold text-lg">
            {(skillProgressData.reduce((sum, d) => sum + d.score, 0) / skillProgressData.length).toFixed(1)}/10
          </p>
        </div>
      </div>
    </div>
  );
}