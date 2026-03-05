import { Badge } from "@/components/ui/badge";

type MatchStatus = "matched" | "diff" | "missing";

const statusConfig: Record<MatchStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  matched: { label: "Matched", variant: "default" },
  diff: { label: "Difference", variant: "secondary" },
  missing: { label: "Missing", variant: "destructive" },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
