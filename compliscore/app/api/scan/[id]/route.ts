import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("scans")
      .select("results")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Scan non trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json(data.results);
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
