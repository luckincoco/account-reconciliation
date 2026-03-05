"use client";

import { useEffect, useState, useCallback } from "react";
import type { Reconciliation } from "@/types/reconciliation";

export function useReconciliations(statusFilter?: string) {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReconciliations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/reconciliations?${params}`);
      const json = await res.json();
      if (json.success) {
        setReconciliations(json.data || []);
      } else {
        setError(json.error || "Failed to fetch");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  return { reconciliations, isLoading, error, refetch: fetchReconciliations };
}
