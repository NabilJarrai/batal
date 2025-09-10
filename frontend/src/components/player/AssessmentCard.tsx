import Link from "next/link";
import { DocumentChartBarIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface AssessmentCardProps {
  assessment: {
    id: number;
    assessmentDate: string;
    period: string;
    overallScore?: number;
    isFinalized: boolean;
  };
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  return (
    <Link
      href={`/player/assessments/${assessment.id}`}
      className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentChartBarIcon className="h-10 w-10 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {assessment.period} Assessment
            </h3>
            <p className="text-sm text-blue-200 flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {new Date(assessment.assessmentDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {assessment.overallScore && (
            <p className="text-2xl font-bold text-white mb-1">
              {assessment.overallScore}/10
            </p>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            assessment.isFinalized
              ? "bg-green-500/20 text-green-300"
              : "bg-yellow-500/20 text-yellow-300"
          }`}>
            {assessment.isFinalized ? "Finalized" : "Draft"}
          </span>
        </div>
      </div>
    </Link>
  );
}