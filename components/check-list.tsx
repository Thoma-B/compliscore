import type { CheckResult, CheckCategory } from "@/scanner/types";
import { CheckItem } from "@/components/check-item";

export function CheckList({
  checks,
  category,
  title,
}: {
  checks: CheckResult[];
  category: CheckCategory;
  title: string;
}) {
  const filtered = checks
    .filter((c) => c.category === category)
    .sort((a, b) => {
      const statusOrder = { failed: 0, warning: 1, passed: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  if (filtered.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {filtered.map((check) => (
          <CheckItem key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}
