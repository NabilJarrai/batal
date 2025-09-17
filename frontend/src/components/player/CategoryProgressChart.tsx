"use client";

import { useEffect, useRef } from "react";
import { Assessment } from "@/types/assessments";

interface CategoryProgressData {
  date: string;
  period: string;
  categories: {
    [category: string]: number;
  };
}

interface CategoryProgressChartProps {
  assessments: Assessment[];
}

export function CategoryProgressChart({ assessments }: CategoryProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process assessments to get category averages over time
  const assessmentData: CategoryProgressData[] = assessments
    .filter(assessment => assessment.skillScores && assessment.skillScores.length > 0)
    .map(assessment => {
      const categories: { [category: string]: { sum: number; count: number } } = {};

      assessment.skillScores?.forEach(skill => {
        if (!categories[skill.skillCategory]) {
          categories[skill.skillCategory] = { sum: 0, count: 0 };
        }
        categories[skill.skillCategory].sum += skill.score;
        categories[skill.skillCategory].count++;
      });

      const categoryAverages: { [category: string]: number } = {};
      Object.entries(categories).forEach(([category, data]) => {
        categoryAverages[category] = data.sum / data.count;
      });

      return {
        date: assessment.assessmentDate,
        period: assessment.period,
        categories: categoryAverages,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get all unique categories from assessments to create baseline
  const allCategories = Array.from(
    new Set(assessmentData.flatMap(d => Object.keys(d.categories)))
  );

  // Create baseline point with all categories starting at 1
  const baselineCategories: { [category: string]: number } = {};
  allCategories.forEach(category => {
    baselineCategories[category] = 1;
  });

  // Add baseline starting point (x=0, all categories=1) at the beginning
  const progressData: CategoryProgressData[] = [
    {
      date: "",
      period: "Baseline",
      categories: baselineCategories,
    },
    ...assessmentData
  ];

  useEffect(() => {
    if (!canvasRef.current || progressData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Categories are already defined above, but keep this for the drawing logic

    // Color palette for categories
    const colors = [
      "#3B82F6", // Blue - Athletic
      "#10B981", // Green - Technical  
      "#F59E0B", // Yellow - Mentality
      "#EF4444", // Red - Personality
      "#8B5CF6", // Purple - Additional
      "#06B6D4", // Cyan - Additional
    ];

    const categoryColors: { [key: string]: string } = {};
    allCategories.forEach((category, index) => {
      categoryColors[category] = colors[index % colors.length];
    });

    // Calculate scales - axis shows 0-10 but plotting emphasizes 1-10 range
    const maxScore = 10;
    const minScore = 0; // Axis shows 0
    const plotMinScore = 1; // But data plotting starts from 1
    const xStep = chartWidth / (progressData.length - 1 || 1);
    const yScale = chartHeight / (maxScore - minScore);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (10 - i) * yScale;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(i.toString(), padding - 10, y);
    }

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw lines for each category
    allCategories.forEach(category => {
      const categoryData = progressData
        .filter(d => d.categories[category] !== undefined)
        .map((d, index) => ({
          x: padding + (progressData.indexOf(d)) * xStep,
          y: padding + (maxScore - Math.max(plotMinScore, d.categories[category])) * yScale,
          score: d.categories[category],
        }));

      if (categoryData.length < 2) return;

      // Draw line
      ctx.strokeStyle = categoryColors[category];
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      categoryData.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw points
      categoryData.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = categoryColors[category];
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Draw x-axis labels (dates)
    progressData.forEach((data, index) => {
      const x = padding + index * xStep;

      if (index === 0) {
        // Label the baseline point
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Start", x, height - padding + 5);
      } else if (data.date) {
        ctx.save();
        ctx.translate(x, height - padding + 25);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(new Date(data.date).toLocaleDateString(), 0, 0);
        ctx.restore();
      }
    });

    // Draw title
    ctx.fillStyle = "white";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Skills Progress by Category", width / 2, 15);

  }, [progressData]);

  if (progressData.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
        <p className="text-blue-200">
          No progress data available. Complete more assessments to see your progress over time.
        </p>
      </div>
    );
  }

  // Use the allCategories already defined above for legend

  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Progress by Category</h3>
        <p className="text-blue-200 text-sm">
          Track your improvement across all skill categories over time
        </p>
      </div>

      <canvas ref={canvasRef} className="w-full mb-4" style={{ maxWidth: "800px" }} />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {allCategories.map((category, index) => (
          <div key={category} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-white text-sm font-medium">{category}</span>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      {progressData.length > 1 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allCategories.map((category, index) => {
            const categoryScores = progressData
              .filter(d => d.categories[category] !== undefined)
              .map(d => d.categories[category]);

            if (categoryScores.length === 0) return null;

            const current = categoryScores[categoryScores.length - 1];
            // Skip baseline (index 0) when calculating previous for trend
            const previous = categoryScores.length > 2 ? categoryScores[categoryScores.length - 2] : (categoryScores.length > 1 ? categoryScores[0] : current);
            const change = current - previous;

            return (
              <div key={category} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-blue-200 text-sm font-medium">{category}</span>
                </div>
                <div className="text-white font-bold text-lg">
                  {current.toFixed(1)}/10
                </div>
                {change !== 0 && (
                  <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}