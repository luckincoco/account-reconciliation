import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PUBLIC endpoint - no auth required
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const admin = createAdminClient();

  // Look up reconciliation by share_token
  const { data: recon, error: reconError } = await admin
    .from("reconciliations")
    .select("*")
    .eq("share_token", token)
    .single();

  if (reconError || !recon) {
    return NextResponse.json(
      { error: "Reconciliation not found" },
      { status: 404 }
    );
  }

  // Get initiator info
  const { data: initiator } = await admin
    .from("users")
    .select("name, email")
    .eq("id", recon.initiator_id)
    .single();

  // Get initiator's transactions for the date range
  const { data: transactions } = await admin
    .from("transactions")
    .select("id, counterpart_name, type, item_name, spec, quantity, unit, unit_price, amount, date")
    .eq("user_id", recon.initiator_id)
    .gte("date", recon.date_from)
    .lte("date", recon.date_to)
    .order("date", { ascending: true });

  // Get match results if any
  const { data: matches } = await admin
    .from("recon_matches")
    .select("*")
    .eq("recon_id", recon.id);

  return NextResponse.json({
    success: true,
    data: {
      recon_id: recon.id,
      share_token: token,
      initiator_name: initiator?.name || initiator?.email || "Unknown",
      date_from: recon.date_from,
      date_to: recon.date_to,
      status: recon.status,
      transactions: transactions || [],
      matches: matches || [],
    },
  });
}
