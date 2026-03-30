import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";
import type { CheckResult } from "./types";

function makeCheck(
  overrides: Partial<CheckResult> & Pick<CheckResult, "category" | "severity" | "status">,
): CheckResult {
  return {
    id: "test",
    name: "Test Check",
    description: "A test check",
    ...overrides,
  };
}

describe("calculateScore", () => {
  it("returns score 100 and grade A when all checks passed", () => {
    const checks: CheckResult[] = [
      makeCheck({ category: "rgpd", severity: "critical", status: "passed" }),
      makeCheck({ category: "rgpd", severity: "important", status: "passed" }),
      makeCheck({ category: "cyber", severity: "critical", status: "passed" }),
      makeCheck({ category: "cyber", severity: "nice_to_have", status: "passed" }),
    ];
    const score = calculateScore(checks);
    expect(score.total).toBe(100);
    expect(score.rgpd).toBe(100);
    expect(score.cyber).toBe(100);
    expect(score.grade).toBe("A");
  });

  it("returns score 0 and grade F when all checks failed", () => {
    const checks: CheckResult[] = [
      makeCheck({ category: "rgpd", severity: "critical", status: "failed" }),
      makeCheck({ category: "rgpd", severity: "important", status: "failed" }),
      makeCheck({ category: "cyber", severity: "critical", status: "failed" }),
      makeCheck({ category: "cyber", severity: "nice_to_have", status: "failed" }),
    ];
    const score = calculateScore(checks);
    expect(score.total).toBe(0);
    expect(score.rgpd).toBe(0);
    expect(score.cyber).toBe(0);
    expect(score.grade).toBe("F");
  });

  it("weights critical failures more than nice_to_have passes", () => {
    // critical(3) failed=0, nice_to_have(1) passed=1 => earned=1, total=4 => 25%
    const checks: CheckResult[] = [
      makeCheck({ category: "rgpd", severity: "critical", status: "failed" }),
      makeCheck({ category: "rgpd", severity: "nice_to_have", status: "passed" }),
    ];
    const score = calculateScore(checks);
    expect(score.rgpd).toBe(25);
  });

  it("counts warning checks as 0.5", () => {
    // One critical(3) warning => earned=1.5, total=3 => 50%
    const checks: CheckResult[] = [
      makeCheck({ category: "cyber", severity: "critical", status: "warning" }),
    ];
    const score = calculateScore(checks);
    expect(score.cyber).toBe(50);
  });

  it("calculates category scores independently", () => {
    const checks: CheckResult[] = [
      makeCheck({ category: "rgpd", severity: "critical", status: "passed" }),
      makeCheck({ category: "cyber", severity: "critical", status: "failed" }),
    ];
    const score = calculateScore(checks);
    expect(score.rgpd).toBe(100);
    expect(score.cyber).toBe(0);
    expect(score.total).toBe(50);
  });

  describe("grade boundaries", () => {
    // Use a single critical check per category with warning (50%) or passed (100%)
    // to hit specific scores. For precise boundary testing we use mixed weights.

    it("score 89 gives grade B", () => {
      // rgpd: critical(3) passed + important(2) passed + nice_to_have(1) failed => 5/6*100=83.33
      // cyber: critical(3) passed + important(2) warning + nice_to_have(1) passed => (3+1+1)/6*100=83.33
      // We need exactly 89. Let's use a single-category approach.
      // nice_to_have(1) passed=1, important(2) passed=2, critical(3) warning=1.5 => 4.5/6=75 (not 89)
      // Better: use multiple checks to get close to 89.
      // 8 critical passed + 1 critical failed => 24/27*100=88.89 ~ 88.89
      const checks: CheckResult[] = Array.from({ length: 8 }, () =>
        makeCheck({ category: "rgpd", severity: "critical", status: "passed" }),
      ).concat(
        makeCheck({ category: "rgpd", severity: "critical", status: "failed" }),
      );
      const score = calculateScore(checks);
      expect(score.total).toBeCloseTo(88.89, 1);
      expect(score.grade).toBe("B");
    });

    it("score 90 gives grade A", () => {
      // 9 critical passed + 1 critical failed => 27/30*100=90
      const checks: CheckResult[] = Array.from({ length: 9 }, () =>
        makeCheck({ category: "rgpd", severity: "critical", status: "passed" }),
      ).concat(
        makeCheck({ category: "rgpd", severity: "critical", status: "failed" }),
      );
      const score = calculateScore(checks);
      expect(score.total).toBe(90);
      expect(score.grade).toBe("A");
    });

    it("score 69 gives grade C", () => {
      // We need total ~69. Use single category.
      // critical(3)*2 passed=6, critical(3)*1 failed=0 => 6/9=66.67 (not 69)
      // 69/100 = x. Let's try: important(2)*4 passed=8, important(2)*1 failed=0, nice_to_have(1)*1 warning=0.5
      // => 8.5 / (8+2+1) = 8.5/11 = 77.27 (no)
      // Exact: we need earned/total = 0.69. With weight=100: 69 nice_to_have passed + 31 failed
      // earned=69, total=100, score=69
      const checks: CheckResult[] = [
        ...Array.from({ length: 69 }, () =>
          makeCheck({ category: "cyber", severity: "nice_to_have", status: "passed" }),
        ),
        ...Array.from({ length: 31 }, () =>
          makeCheck({ category: "cyber", severity: "nice_to_have", status: "failed" }),
        ),
      ];
      const score = calculateScore(checks);
      expect(score.total).toBe(69);
      expect(score.grade).toBe("C");
    });

    it("score 70 gives grade B", () => {
      const checks: CheckResult[] = [
        ...Array.from({ length: 7 }, () =>
          makeCheck({ category: "rgpd", severity: "nice_to_have", status: "passed" }),
        ),
        ...Array.from({ length: 3 }, () =>
          makeCheck({ category: "rgpd", severity: "nice_to_have", status: "failed" }),
        ),
      ];
      const score = calculateScore(checks);
      expect(score.total).toBe(70);
      expect(score.grade).toBe("B");
    });

    it("score 29 gives grade F", () => {
      const checks: CheckResult[] = [
        ...Array.from({ length: 29 }, () =>
          makeCheck({ category: "rgpd", severity: "nice_to_have", status: "passed" }),
        ),
        ...Array.from({ length: 71 }, () =>
          makeCheck({ category: "rgpd", severity: "nice_to_have", status: "failed" }),
        ),
      ];
      const score = calculateScore(checks);
      expect(score.total).toBe(29);
      expect(score.grade).toBe("F");
    });

    it("score 30 gives grade D", () => {
      const checks: CheckResult[] = [
        ...Array.from({ length: 3 }, () =>
          makeCheck({ category: "cyber", severity: "nice_to_have", status: "passed" }),
        ),
        ...Array.from({ length: 7 }, () =>
          makeCheck({ category: "cyber", severity: "nice_to_have", status: "failed" }),
        ),
      ];
      const score = calculateScore(checks);
      expect(score.total).toBe(30);
      expect(score.grade).toBe("D");
    });
  });

  it("returns score 0 and grade F for empty checks", () => {
    const score = calculateScore([]);
    expect(score.total).toBe(0);
    expect(score.rgpd).toBe(0);
    expect(score.cyber).toBe(0);
    expect(score.grade).toBe("F");
  });

  it("sets total to single category score when only one category present", () => {
    const checks: CheckResult[] = [
      makeCheck({ category: "rgpd", severity: "critical", status: "passed" }),
      makeCheck({ category: "rgpd", severity: "important", status: "warning" }),
    ];
    const score = calculateScore(checks);
    // critical(3)*1 + important(2)*0.5 = 4, total weight = 5, score = 80
    expect(score.rgpd).toBe(80);
    expect(score.cyber).toBe(0);
    expect(score.total).toBe(80);
  });
});
