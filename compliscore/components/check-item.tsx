import type { CheckResult } from "@/scanner/types";

const statusConfig = {
  passed: {
    icon: (
      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  warning: {
    icon: (
      <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  failed: {
    icon: (
      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export function CheckItem({ check }: { check: CheckResult }) {
  const config = statusConfig[check.status];

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${config.bg} ${config.border}`}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{check.name}</span>
          {check.severity === "critical" && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Critique</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
        {check.details && (
          <p className="text-xs text-muted-foreground mt-1 italic">{check.details}</p>
        )}
      </div>
    </div>
  );
}
