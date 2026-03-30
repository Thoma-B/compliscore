import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { validateDomain } from "@/lib/domain-validator";
import { runScan } from "@/scanner";
import { createServerClient } from "@/lib/supabase/server";

const MAX_SCANS_PER_DAY = 3;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

async function checkRateLimit(
  supabase: ReturnType<typeof createServerClient>,
  ipHash: string
): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneDayAgo);

  if (error) return false;
  return (count ?? 0) >= MAX_SCANS_PER_DAY;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain: rawDomain } = body;

    if (!rawDomain || typeof rawDomain !== "string") {
      return NextResponse.json(
        { error: "Veuillez entrer un nom de domaine." },
        { status: 400 }
      );
    }

    const validation = validateDomain(rawDomain);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const ipHash = hashIp(ip);

    const supabase = createServerClient();

    const rateLimited = await checkRateLimit(supabase, ipHash);
    if (rateLimited) {
      return NextResponse.json(
        { error: "Limite atteinte (3 scans/jour). Revenez demain ou passez au plan Pro." },
        { status: 429 }
      );
    }

    const result = await runScan(validation.domain);

    const { error: insertError } = await supabase.from("scans").insert({
      id: result.id,
      domain: result.domain,
      results: result,
      score: Math.round(result.score.total),
      grade: result.score.grade,
      ip_hash: ipHash,
    });

    if (insertError) {
      console.error("Failed to store scan:", JSON.stringify(insertError, null, 2));
      console.error("Insert payload:", JSON.stringify({ id: result.id, domain: result.domain, score: result.score.total, grade: result.score.grade, ip_hash: ipHash }, null, 2));
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde du scan." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: result.id,
      score: result.score.total,
      grade: result.score.grade,
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse." },
      { status: 500 }
    );
  }
}
