import type { Grade } from "@/scanner/types";

const gradeConfig: Record<Grade, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Excellent" },
  B: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Bon" },
  C: { bg: "bg-orange-100", text: "text-orange-700", label: "Risques" },
  D: { bg: "bg-red-100", text: "text-red-700", label: "Non conforme" },
  F: { bg: "bg-red-200", text: "text-red-800", label: "Critique" },
};

export function GradeBadge({ grade }: { grade: Grade }) {
  const config = gradeConfig[grade];
  return (
    <div className={`inline-flex flex-col items-center rounded-xl px-6 py-4 ${config.bg}`}>
      <span className={`text-4xl font-bold ${config.text}`}>{grade}</span>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}
