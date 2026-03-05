export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          email: string | null;
          lang: string;
          plan: "free" | "pro";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          counterpart_name: string;
          counterpart_id: string | null;
          type: "in" | "out";
          item_name: string;
          spec: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          amount: number;
          date: string;
          source: "photo" | "voice" | "manual";
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["transactions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["transactions"]["Insert"]
        >;
      };
      reconciliations: {
        Row: {
          id: string;
          initiator_id: string;
          counterpart_id: string | null;
          share_token: string;
          date_from: string;
          date_to: string;
          status: "pending" | "in_progress" | "completed";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["reconciliations"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["reconciliations"]["Insert"]
        >;
      };
      recon_matches: {
        Row: {
          id: string;
          recon_id: string;
          my_tx_id: string | null;
          their_tx_id: string | null;
          match_status: "matched" | "diff" | "missing";
          diff_detail: string | null;
          confirmed: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["recon_matches"]["Row"],
          "id"
        >;
        Update: Partial<
          Database["public"]["Tables"]["recon_matches"]["Insert"]
        >;
      };
    };
  };
}
