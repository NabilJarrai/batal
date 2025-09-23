"use client";

import { useEffect, useRef } from "react";

interface SkillScore {
  skillName: string;
  skillCategory: string;
  score: number;
}

interface SkillRadarChartProps {
  skills: SkillScore[];
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !skills.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size - increased to accommodate labels
    const size = 500;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 4; // Reduced radius to leave more room for labels

    // Group skills by category and calculate averages
    const categoryAverages: Record<string, { sum: number; count: number }> = {};
    skills.forEach((skill) => {
      if (!categoryAverages[skill.skillCategory]) {
        categoryAverages[skill.skillCategory] = { sum: 0, count: 0 };
      }
      categoryAverages[skill.skillCategory].sum += skill.score;
      categoryAverages[skill.skillCategory].count++;
    });

    const categories = Object.keys(categoryAverages);
    // Normalize values to 0-1 scale for radar chart plotting (0-10 scale but emphasizing 1-10)
    const values = categories.map(
      (cat) => {
        const score = categoryAverages[cat].sum / categoryAverages[cat].count;
        // For radar chart, we still use the full 0-10 scale but data will naturally be in 1-10 range
        return score / 10;
      }
    );

    const angleStep = (Math.PI * 2) / categories.length;

    // Clear canvas and set light gray background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, size, size);

    // Draw grid circles (representing scores 2, 4, 6, 8, 10)
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1;
      
      for (let j = 0; j <= categories.length; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius * (i / 5);
        const y = centerY + Math.sin(angle) * radius * (i / 5);
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    categories.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.stroke();
    });

    // Draw data polygon
    ctx.beginPath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 2;

    values.forEach((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points
    values.forEach((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#3B82F6";
      ctx.fill();
      ctx.strokeStyle = "#1F2937";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#1F2937";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    categories.forEach((category, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 50; // Increased spacing from chart
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Adjust text alignment based on position
      if (Math.abs(x - centerX) < 10) {
        ctx.textAlign = "center";
      } else if (x > centerX) {
        ctx.textAlign = "left";
      } else {
        ctx.textAlign = "right";
      }

      ctx.fillText(category, x, y);
    });
  }, [skills]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="w-full max-w-md" />
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {Object.entries(
          skills.reduce((acc, skill) => {
            if (!acc[skill.skillCategory]) {
              acc[skill.skillCategory] = { sum: 0, count: 0 };
            }
            acc[skill.skillCategory].sum += skill.score;
            acc[skill.skillCategory].count++;
            return acc;
          }, {} as Record<string, { sum: number; count: number }>)
        ).map(([category, data]) => (
          <div key={category} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-text-secondary">{category}:</span>
            <span className="text-text-primary font-medium">
              {(data.sum / data.count).toFixed(1)}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}