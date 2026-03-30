import { Progress } from "@/components/ui/progress";

function getColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

export function CategoryScore({
  label,
  score,
  icon,
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
        <span className={`ml-auto font-bold ${getColor(score)}`}>
          {Math.round(score)}/100
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}
