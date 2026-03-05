export interface Transaction {
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
}

export interface CreateTransactionInput {
  counterpart_name: string;
  type: "in" | "out";
  item_name: string;
  spec?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  date: string;
  source: "photo" | "voice" | "manual";
  image_url?: string;
}
