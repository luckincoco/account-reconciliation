"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Reconciliation } from "@/types/reconciliation";

export default function ReconciliationsPage() {
  const t = useTranslations("reconciliation");
  const tc = useTranslations("common");
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reconciliations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRecons(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    pending: { label: t("statusPending"), variant: "outline" },
    in_progress: { label: t("statusInProgress"), variant: "secondary" },
    completed: { label: t("statusCompleted"), variant: "default" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/reconciliations/new">{t("new")}</Link>
        </Button>
      </div>

      {recons.length === 0 ? (
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
          {recons.map((r) => {
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
