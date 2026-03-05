"use client";

// TODO: Implement transactions data fetching hook
export function useTransactions() {
  return {
    transactions: [],
    isLoading: false,
    error: null,
  };
}
