"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-yellow-500";
  if (score >= 50) return "text-orange-500";
  return "text-red-500";
}

function getStrokeColor(score: number): string {
  if (score >= 90) return "stroke-emerald-500";
  if (score >= 70) return "stroke-yellow-500";
  if (score >= 50) return "stroke-orange-500";
  return "stroke-red-500";
}

export function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/50"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getStrokeColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
          {animatedScore}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
