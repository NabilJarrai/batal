"use client";

import { useEffect, useRef } from "react";

interface AssessmentData {
  date: string;
  score: number;
  period: string;
}

interface ProgressChartProps {
  assessments: AssessmentData[];
  skillName?: string;
}

export function ProgressChart({ assessments, skillName = "Overall" }: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !assessments.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const width = 600;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    // Calculate chart dimensions
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Sort assessments by date and add baseline starting point
    const sortedData = [...assessments].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Add baseline starting point (x=0, y=1) at the beginning
    const dataWithBaseline = [
      { date: "", score: 1, period: "Baseline" },
      ...sortedData
    ];

    // Calculate scales - axis shows 0-10 but plotting compresses 1-10 to visible area
    const maxScore = 10;
    const minScore = 0; // Axis shows 0
    const plotMinScore = 1; // But data plotting starts from 1
    const xStep = chartWidth / (dataWithBaseline.length - 1 || 1);
    const yScale = chartHeight / (maxScore - minScore);

    // Function to map score to Y position (compresses 1-10 range to most of chart)
    const getYPosition = (score: number) => {
      // Clamp score to 1-10 range
      const clampedScore = Math.max(plotMinScore, Math.min(maxScore, score));
      // Map 1-10 to 1-10 on axis, but visually compress the 0-1 area
      return padding + (maxScore - clampedScore) * yScale;
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (10 - i) * yScale;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Draw y-axis labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(i.toString(), padding - 10, y);
    }

    // Draw axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
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

    // Draw the progress line
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 3;
    ctx.beginPath();

    dataWithBaseline.forEach((data, index) => {
      const x = padding + index * xStep;
      const y = getYPosition(data.score);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Calculate label positions below points to avoid overlaps
    const labelPositions: { x: number; y: number; text: string; originalY: number }[] = [];

    dataWithBaseline.forEach((data, index) => {
      const x = padding + index * xStep;
      const y = getYPosition(data.score);
      const labelText = data.score.toFixed(1);

      labelPositions.push({
        x,
        y: y + 25, // Position below the point
        text: labelText,
        originalY: y
      });
    });

    // Adjust label positions to avoid overlaps
    const minDistance = 20; // Minimum distance between labels
    for (let i = 1; i < labelPositions.length; i++) {
      const current = labelPositions[i];
      const previous = labelPositions[i - 1];

      // Check if labels are too close horizontally and vertically
      const xDistance = Math.abs(current.x - previous.x);
      const yDistance = Math.abs(current.y - previous.y);

      if (xDistance < 50 && yDistance < minDistance) {
        // Alternate positions below the point: closer and further
        if (i % 2 === 0) {
          current.y = current.originalY + 40; // Further below
        } else {
          current.y = current.originalY + 15; // Closer below
        }
      }
    }

    // Draw data points and labels
    dataWithBaseline.forEach((data, index) => {
      const x = padding + index * xStep;
      const y = getYPosition(data.score);
      const labelPos = labelPositions[index];

      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#3B82F6";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw connection line from point to label if they're far apart
      const labelDistance = Math.abs(labelPos.y - (y + 25));
      if (labelDistance > 10) {
        ctx.beginPath();
        ctx.moveTo(x, y + 8); // Start from bottom of point
        ctx.lineTo(x, labelPos.y - 8); // Connect to top of label
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw x-axis labels (dates) - skip baseline point for date labels
      if (index > 0 && data.date) {
        ctx.save();
        ctx.translate(x, height - padding + 20);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(new Date(data.date).toLocaleDateString(), 0, 0);
        ctx.restore();
      } else if (index === 0) {
        // Label the baseline point
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Start", x, height - padding + 5);
      }

      // Draw score labels with background at adjusted position
      const labelText = labelPos.text;
      const labelY = labelPos.y;

      // Measure text for background
      ctx.font = "12px sans-serif";
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 12;

      // Draw background for the score label
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(
        x - textWidth/2 - 4,
        labelY - textHeight/2 - 2,
        textWidth + 8,
        textHeight + 4
      );

      // Draw white border for the background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x - textWidth/2 - 4,
        labelY - textHeight/2 - 2,
        textWidth + 8,
        textHeight + 4
      );

      // Draw the score text
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, x, labelY);
    });

    // Draw title
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${skillName} Progress`, width / 2, 10);

    // Draw trend indicator
    if (dataWithBaseline.length >= 2) {
      const lastScore = dataWithBaseline[dataWithBaseline.length - 1].score;
      const prevScore = dataWithBaseline[dataWithBaseline.length - 2].score;
      const trend = lastScore - prevScore;
      
      ctx.fillStyle = trend >= 0 ? "#10B981" : "#EF4444";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      const trendText = trend >= 0 ? `↑ +${trend.toFixed(1)}` : `↓ ${trend.toFixed(1)}`;
      ctx.fillText(trendText, width - padding, 10);
    }
  }, [assessments, skillName]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full" style={{ maxWidth: "600px" }} />
    </div>
  );
}