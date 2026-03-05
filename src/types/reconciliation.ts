export interface Reconciliation {
  id: string;
  initiator_id: string;
  counterpart_id: string | null;
  share_token: string;
  date_from: string;
  date_to: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
}

export interface ReconMatch {
  id: string;
  recon_id: string;
  my_tx_id: string | null;
  their_tx_id: string | null;
  match_status: "matched" | "diff" | "missing";
  diff_detail: string | null;
  confirmed: boolean;
}
