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
      className="block bg-background-modal rounded-lg p-4 border border-border hover:bg-secondary-50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentChartBarIcon className="h-10 w-10 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {assessment.period} Assessment
            </h3>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {new Date(assessment.assessmentDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {assessment.overallScore && (
            <p className="text-2xl font-bold text-text-primary mb-1">
              {assessment.overallScore}/10
            </p>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            assessment.isFinalized
              ? "bg-accent-teal/20 text-accent-teal"
              : "bg-accent-yellow/20 text-accent-yellow"
          }`}>
            {assessment.isFinalized ? "Finalized" : "Draft"}
          </span>
        </div>
      </div>
    </Link>
  );
}