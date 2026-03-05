"use client";

// TODO: Implement reconciliation data fetching hook
export function useReconciliation() {
  return {
    reconciliations: [],
    isLoading: false,
    error: null,
  };
}
