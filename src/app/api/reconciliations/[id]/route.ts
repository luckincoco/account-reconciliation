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

  // Fetch related transactions for match details
  const myTxIds = (matches || []).map((m) => m.my_tx_id).filter(Boolean);
  const theirTxIds = (matches || []).map((m) => m.their_tx_id).filter(Boolean);
  const allTxIds = [...new Set([...myTxIds, ...theirTxIds])];

  const txMap = new Map<string, { item_name: string; amount: number; date: string }>();
  if (allTxIds.length > 0) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, item_name, amount, date")
      .in("id", allTxIds);
    (txs || []).forEach((tx) => txMap.set(tx.id, tx));
  }

  const enrichedMatches = (matches || []).map((m) => ({
    ...m,
    my_tx: m.my_tx_id ? txMap.get(m.my_tx_id) || null : null,
    their_tx: m.their_tx_id ? txMap.get(m.their_tx_id) || null : null,
  }));

  const summary = {
    matched: enrichedMatches.filter((m) => m.match_status === "matched").length,
    diff: enrichedMatches.filter((m) => m.match_status === "diff").length,
    missing: enrichedMatches.filter((m) => m.match_status === "missing").length,
  };

  return NextResponse.json({
    success: true,
    data: { ...recon, matches: enrichedMatches, summary },
  });
}
