import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
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

  // Fetch reconciliation
  const { data: recon, error: reconError } = await supabase
    .from("reconciliations")
    .select("*")
    .eq("id", id)
    .single();

  if (reconError || !recon) {
    return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
  }

  if (recon.initiator_id !== user.id) {
    return NextResponse.json({ error: "Only initiator can trigger matching" }, { status: 403 });
  }

  // Fetch initiator's transactions in date range
  const { data: myTxs } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", recon.initiator_id)
    .gte("date", recon.date_from)
    .lte("date", recon.date_to)
    .order("date", { ascending: true });

  // Fetch counterpart's transactions if counterpart exists
  let theirTxs: typeof myTxs = [];
  if (recon.counterpart_id) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", recon.counterpart_id)
      .gte("date", recon.date_from)
      .lte("date", recon.date_to)
      .order("date", { ascending: true });
    theirTxs = data || [];
  }

  const admin = createAdminClient();

  // Clear existing matches
  await admin.from("recon_matches").delete().eq("recon_id", id);

  const matches: Array<{
    recon_id: string;
    my_tx_id: string | null;
    their_tx_id: string | null;
    match_status: "matched" | "diff" | "missing";
    diff_detail: string | null;
  }> = [];

  const matchedTheirIds = new Set<string>();

  // Step 1: Exact match - same date + item_name + amount
  for (const myTx of myTxs || []) {
    let found = false;
    for (const theirTx of theirTxs || []) {
      if (matchedTheirIds.has(theirTx.id)) continue;

      if (
        myTx.date === theirTx.date &&
        myTx.item_name === theirTx.item_name &&
        Number(myTx.amount) === Number(theirTx.amount)
      ) {
        matches.push({
          recon_id: id,
          my_tx_id: myTx.id,
          their_tx_id: theirTx.id,
          match_status: "matched",
          diff_detail: null,
        });
        matchedTheirIds.add(theirTx.id);
        found = true;
        break;
      }
    }

    if (!found) {
      // Step 2: Fuzzy match - date +-3 days, amount +-1%, similar item name
      let fuzzyFound = false;
      for (const theirTx of theirTxs || []) {
        if (matchedTheirIds.has(theirTx.id)) continue;

        const dayDiff = Math.abs(
          new Date(myTx.date).getTime() - new Date(theirTx.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        const amountDiff = Math.abs(Number(myTx.amount) - Number(theirTx.amount));
        const amountThreshold = Math.abs(Number(myTx.amount)) * 0.01;

        const nameSimilar =
          myTx.item_name === theirTx.item_name ||
          myTx.item_name.includes(theirTx.item_name) ||
          theirTx.item_name.includes(myTx.item_name);

        if (dayDiff <= 3 && amountDiff <= amountThreshold && nameSimilar) {
          const diffs: string[] = [];
          if (myTx.date !== theirTx.date) diffs.push(`date: ${myTx.date} vs ${theirTx.date}`);
          if (Number(myTx.amount) !== Number(theirTx.amount))
            diffs.push(`amount: ${myTx.amount} vs ${theirTx.amount}`);

          matches.push({
            recon_id: id,
            my_tx_id: myTx.id,
            their_tx_id: theirTx.id,
            match_status: "diff",
            diff_detail: diffs.join("; "),
          });
          matchedTheirIds.add(theirTx.id);
          fuzzyFound = true;
          break;
        }
      }

      // Step 3: Mark as missing
      if (!fuzzyFound) {
        matches.push({
          recon_id: id,
          my_tx_id: myTx.id,
          their_tx_id: null,
          match_status: "missing",
          diff_detail: "No matching transaction found from counterpart",
        });
      }
    }
  }

  // Mark unmatched counterpart transactions as missing
  for (const theirTx of theirTxs || []) {
    if (!matchedTheirIds.has(theirTx.id)) {
      matches.push({
        recon_id: id,
        my_tx_id: null,
        their_tx_id: theirTx.id,
        match_status: "missing",
        diff_detail: "No matching transaction found from initiator",
      });
    }
  }

  // Insert matches
  if (matches.length > 0) {
    const { error: insertError } = await admin
      .from("recon_matches")
      .insert(matches);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Update reconciliation status
  await admin
    .from("reconciliations")
    .update({ status: "in_progress" })
    .eq("id", id);

  const summary = {
    matched: matches.filter((m) => m.match_status === "matched").length,
    diff: matches.filter((m) => m.match_status === "diff").length,
    missing: matches.filter((m) => m.match_status === "missing").length,
  };

  return NextResponse.json({
    success: true,
    data: { recon_id: id, ...summary, total_matches: matches.length },
  });
}
