import type { CheckResult, Grade, ScanScore } from "./types";

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 3,
  important: 2,
  nice_to_have: 1,
};

const STATUS_MULTIPLIERS: Record<string, number> = {
  passed: 1,
  warning: 0.5,
  failed: 0,
};

function calculateCategoryScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0;

  let earnedWeight = 0;
  let totalWeight = 0;

  for (const check of checks) {
    const weight = SEVERITY_WEIGHTS[check.severity];
    totalWeight += weight;
    earnedWeight += weight * STATUS_MULTIPLIERS[check.status];
  }

  return (earnedWeight / totalWeight) * 100;
}

function gradeFromScore(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export function calculateScore(checks: CheckResult[]): ScanScore {
  const rgpdChecks = checks.filter((c) => c.category === "rgpd");
  const cyberChecks = checks.filter((c) => c.category === "cyber");

  const rgpd = calculateCategoryScore(rgpdChecks);
  const cyber = calculateCategoryScore(cyberChecks);

  let total: number;
  if (rgpdChecks.length === 0 && cyberChecks.length === 0) {
    total = 0;
  } else if (rgpdChecks.length === 0) {
    total = cyber;
  } else if (cyberChecks.length === 0) {
    total = rgpd;
  } else {
    total = (rgpd + cyber) / 2;
  }

  return {
    total: Math.round(total * 100) / 100,
    rgpd: Math.round(rgpd * 100) / 100,
    cyber: Math.round(cyber * 100) / 100,
    grade: gradeFromScore(total),
  };
}
