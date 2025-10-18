"use client";

import { useState } from "react";
import { useAuth } from "@/store/hooks";
import ChildSelector from "@/components/parent/ChildSelector";
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// Map age to meal plan PDF filename
function getMealPlanPDF(age: number): { filename: string; ageRange: string } {
  if (age >= 4 && age <= 6) {
    return {
      filename: "4-6 years old meal plan-1.pdf",
      ageRange: "4-6 years",
    };
  } else if (age >= 6 && age <= 8) {
    return {
      filename: "6-8 years old meal plan.pdf",
      ageRange: "6-8 years",
    };
  } else if (age >= 8 && age <= 10) {
    return {
      filename: "8-10 years old meal plan.pdf",
      ageRange: "8-10 years",
    };
  } else {
    // For ages 10+ (including Lions group 14-16), use the 10-12 plan as closest match
    return {
      filename: "10-12 years old meal plan.pdf",
      ageRange: "10-12 years",
    };
  }
}

export default function ParentNutritionPage() {
  const { children, selectedChildId } = useAuth();
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  // Get the selected child
  const selectedChild =
    children?.find((child) => child.id === selectedChildId) || children?.[0];

  if (!selectedChild) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-accent-yellow/10 to-accent-yellow/5 rounded-2xl p-12 border border-accent-yellow/20 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-accent-yellow mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            No Child Selected
          </h2>
          <p className="text-text-secondary">
            Please ensure you have children registered to view their meal plans.
          </p>
        </div>
      </div>
    );
  }

  // Calculate age and get appropriate meal plan
  const age = calculateAge(selectedChild.dateOfBirth);
  const mealPlan = getMealPlanPDF(age);
  const pdfPath = `/meal-plan/${encodeURIComponent(mealPlan.filename)}`;

  // Handle PDF download
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfPath;
    link.download = mealPlan.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      {children && children.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <ChildSelector />
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-accent-teal/10 via-white to-accent-yellow/10 rounded-2xl p-8 border border-gray-100 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent-teal/10 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-accent-teal" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Nutrition Meal Plan
                </h1>
                <p className="text-sm text-text-secondary">
                  For {selectedChild.firstName} {selectedChild.lastName} ({age}{" "}
                  years old)
                </p>
              </div>
            </div>

            <p className="text-text-secondary mb-4">
              Personalized nutrition guidance designed to fuel young athletes
              and support their development, energy levels, and performance on
              and off the field.
            </p>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal/10 text-accent-teal rounded-lg text-sm font-medium">
                <SparklesIcon className="w-4 h-4" />
                {mealPlan.ageRange} Age Group
              </span>
              {age > 12 && (
                <span className="text-xs text-text-secondary">
                  Showing closest available meal plan
                </span>
              )}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Loading Indicator */}
        {isPdfLoading && (
          <div className="flex items-center justify-center py-12 bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading meal plan...</p>
            </div>
          </div>
        )}

        {/* PDF Viewer - Using embed for better default zoom */}
        <div className="relative bg-gray-50 rounded-lg">
          <embed
            src={`${pdfPath}#zoom=150`}
            type="application/pdf"
            className={`w-full rounded-lg ${isPdfLoading ? "hidden" : "block"}`}
            style={{
              height: "1400px",
              minHeight: "1200px",
            }}
            onLoad={() => setIsPdfLoading(false)}
          />

          {/* PDF Controls Bar */}
          {!isPdfLoading && (
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
              <div className="text-xs text-gray-600 font-medium">
                Meal Plan - {selectedChild.firstName} {selectedChild.lastName}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="btn-secondary btn-sm flex items-center gap-1 text-xs"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => window.open(pdfPath, "_blank")}
                  className="btn-secondary btn-sm flex items-center gap-1 text-xs"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Full View
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* PDF Viewing Tips */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">
                Better PDF Experience
              </h4>
              <p className="text-sm text-blue-800">
                For the best reading experience, click &quot;Full View&quot; to open in a new tab or &quot;Download&quot; to save the PDF to your device. 
                You can also use your browser&apos;s zoom controls (Ctrl/Cmd + or -) to adjust the size.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Tips Section */}
      <div className="bg-gradient-to-r from-primary/5 to-accent-teal/5 rounded-2xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-primary" />
          Nutrition Tips for Young Athletes
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Pre-Training</h3>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Eat 1-2 hours before training for optimal energy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Focus on complex carbohydrates and moderate protein</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Stay well hydrated throughout the day</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Post-Training</h3>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li className="flex items-start gap-2">
                <span className="text-accent-teal mt-1">•</span>
                <span>Refuel within 30-60 minutes after training</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-teal mt-1">•</span>
                <span>Combine protein and carbs for muscle recovery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-teal mt-1">•</span>
                <span>Rehydrate with water or electrolyte drinks</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Need Personalized Advice?
            </h3>
            <p className="text-sm text-blue-800">
              These meal plans provide general guidance. For specific dietary
              needs, allergies, or personalized nutrition planning, please
              consult with a registered dietitian or your child&apos;s
              healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
