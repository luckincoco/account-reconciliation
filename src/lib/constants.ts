export const APP_NAME = "DuiZhang";

export const TRANSACTION_TYPES = {
  IN: "in",
  OUT: "out",
} as const;

export const TRANSACTION_SOURCES = {
  PHOTO: "photo",
  VOICE: "voice",
  MANUAL: "manual",
} as const;

export const RECON_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const MATCH_STATUS = {
  MATCHED: "matched",
  DIFF: "diff",
  MISSING: "missing",
} as const;

export const PLANS = {
  FREE: "free",
  PRO: "pro",
} as const;
