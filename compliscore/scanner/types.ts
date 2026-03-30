export type CheckStatus = "passed" | "warning" | "failed";
export type CheckSeverity = "critical" | "important" | "nice_to_have";
export type CheckCategory = "rgpd" | "cyber";

export interface CheckResult {
  id: string;
  name: string;
  description: string;
  category: CheckCategory;
  severity: CheckSeverity;
  status: CheckStatus;
  details?: string;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ScanScore {
  total: number;
  rgpd: number;
  cyber: number;
  grade: Grade;
}

export interface ScanResult {
  id: string;
  domain: string;
  checks: CheckResult[];
  score: ScanScore;
  scannedAt: string;
}
