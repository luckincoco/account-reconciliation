import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: recon, error: reconError } = await supabase
    .from("reconciliations")
    .select("*")
    .eq("id", id)
    .single();

  if (reconError) {
    return NextResponse.json({ error: reconError.message }, { status: 404 });
  }

  if (recon.initiator_id !== user.id && recon.counterpart_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: matches, error: matchError } = await supabase
    .from("recon_matches")
    .select("*")
    .eq("recon_id", id);

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  const summary = {
    matched: matches?.filter((m) => m.match_status === "matched").length ?? 0,
    diff: matches?.filter((m) => m.match_status === "diff").length ?? 0,
    missing: matches?.filter((m) => m.match_status === "missing").length ?? 0,
  };

  return NextResponse.json({
    success: true,
    data: { ...recon, matches, summary },
  });
}
