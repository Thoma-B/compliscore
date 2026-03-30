import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScoreGauge } from "@/components/score-gauge";
import { GradeBadge } from "@/components/grade-badge";
import { CategoryScore } from "@/components/category-score";
import { CheckList } from "@/components/check-list";
import { ShareButton } from "@/components/share-button";
import type { ScanResult } from "@/scanner/types";
import { createServerClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getScan(id: string): Promise<ScanResult | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("scans")
      .select("results")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data.results as ScanResult;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) return { title: "Scan non trouvé — CompliScore" };

  return {
    title: `${scan.domain} — Score ${scan.score.grade} (${scan.score.total}/100) — CompliScore`,
    description: `Résultat d'audit RGPD & cybersécurité pour ${scan.domain}. Score: ${scan.score.total}/100 (${scan.score.grade}).`,
    openGraph: {
      title: `${scan.domain} — Score ${scan.score.grade} (${scan.score.total}/100)`,
      description: `Audit RGPD & cybersécurité: ${scan.score.total}/100`,
      type: "website",
      locale: "fr_FR",
    },
  };
}

export default async function ScanResultPage({ params }: PageProps) {
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) notFound();

  const scannedDate = new Date(scan.scannedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          {/* Domain + date */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{scan.domain}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scanné le {scannedDate}
            </p>
          </div>

          {/* Score + Grade */}
          <div className="flex flex-col items-center gap-6 mb-10 sm:flex-row sm:justify-center">
            <ScoreGauge score={scan.score.total} />
            <GradeBadge grade={scan.score.grade} />
          </div>

          {/* Category scores */}
          <div className="grid gap-4 sm:grid-cols-2 mb-10">
            <CategoryScore
              label="RGPD"
              score={scan.score.rgpd}
              icon={
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
            <CategoryScore
              label="Cybersécurité"
              score={scan.score.cyber}
              icon={
                <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          </div>

          {/* Check lists */}
          <div className="space-y-8">
            <CheckList
              checks={scan.checks}
              category="rgpd"
              title="Conformité RGPD"
            />
            <CheckList
              checks={scan.checks}
              category="cyber"
              title="Cybersécurité"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4 mt-10 pt-8 border-t border-border">
            <ShareButton />
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Ce score est indicatif et ne constitue pas un audit légal.
              Pour un audit complet, consultez un professionnel qualifié.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
