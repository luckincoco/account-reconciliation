"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReconciliations } from "@/hooks/use-reconciliation";

function ReconSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function ReconciliationsPage() {
  const t = useTranslations("reconciliation");
  const { reconciliations, isLoading } = useReconciliations();

  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
    pending: { label: t("statusPending"), variant: "outline" },
    in_progress: { label: t("statusInProgress"), variant: "secondary" },
    completed: { label: t("statusCompleted"), variant: "default" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/reconciliations/new">{t("new")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReconSkeleton key={i} />
          ))}
        </div>
      ) : reconciliations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">{t("empty")}</p>
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link href="/reconciliations/new">{t("new")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reconciliations.map((r) => {
            const status = statusMap[r.status] || statusMap.pending;
            return (
              <Link key={r.id} href={`/reconciliations/${r.id}`}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div>
                      <div className="font-medium">
                        {r.date_from} ~ {r.date_to}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
