"use client";

import { useEffect, useState, useCallback } from "react";
import type { Transaction } from "@/types/transaction";

interface UseTransactionsOptions {
  counterpart?: string;
  type?: "in" | "out";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { counterpart, type, dateFrom, dateTo, page = 1, limit = 50 } = options;

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (counterpart) params.set("counterpart", counterpart);
      if (type) params.set("type", type);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data || []);
        setTotal(json.total || 0);
      } else {
        setError(json.error || "Failed to fetch");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [counterpart, type, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, isLoading, error, refetch: fetchTransactions, setTransactions };
}
