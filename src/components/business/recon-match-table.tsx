"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatchRow {
  id: string;
  match_status: "matched" | "diff" | "missing";
  diff_detail: string | null;
  confirmed: boolean;
  my_tx: {
    item_name: string;
    amount: number;
    date: string;
  } | null;
  their_tx: {
    item_name: string;
    amount: number;
    date: string;
  } | null;
}

const statusConfig = {
  matched: { variant: "default" as const, className: "bg-green-100 text-green-800 hover:bg-green-100" },
  diff: { variant: "default" as const, className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  missing: { variant: "default" as const, className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export function ReconMatchTable({ matches }: { matches: MatchRow[] }) {
  const t = useTranslations("reconciliation");

  if (!matches || matches.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No match data available. Trigger AI matching first.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead>My Record</TableHead>
            <TableHead>Their Record</TableHead>
            <TableHead className="w-[160px]">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((m) => {
            const cfg = statusConfig[m.match_status];
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <Badge variant={cfg.variant} className={cfg.className}>
                    {t(m.match_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.my_tx ? (
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm">{m.my_tx.item_name}</div>
                      <div className="text-xs text-muted-foreground">
                        &yen;{Number(m.my_tx.amount).toFixed(2)} &middot; {m.my_tx.date}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  {m.their_tx ? (
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm">{m.their_tx.item_name}</div>
                      <div className="text-xs text-muted-foreground">
                        &yen;{Number(m.their_tx.amount).toFixed(2)} &middot; {m.their_tx.date}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  {m.diff_detail ? (
                    <span className="text-xs text-muted-foreground">{m.diff_detail}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
