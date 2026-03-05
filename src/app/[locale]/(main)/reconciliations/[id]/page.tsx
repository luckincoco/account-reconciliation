"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Reconciliation, ReconMatch } from "@/types/reconciliation";

export default function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const t = useTranslations("reconciliation");
  const tc = useTranslations("common");
  const [id, setId] = useState("");
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [matches, setMatches] = useState<ReconMatch[]>([]);
  const [summary, setSummary] = useState({ matched: 0, diff: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/reconciliations/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRecon(json.data);
          setMatches(json.data.matches || []);
          setSummary(json.data.summary || { matched: 0, diff: 0, missing: 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleMatch() {
    setMatching(true);
    try {
      const res = await fetch(`/api/reconciliations/${id}/match`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          `Matched: ${json.data.matched}, Diff: ${json.data.diff}, Missing: ${json.data.missing}`
        );
        fetchData();
      } else {
        toast.error(json.error || "Matching failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setMatching(false);
    }
  }

  function handleCopyLink() {
    if (!recon) return;
    const url = `${window.location.origin}/recon/${recon.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t("copyLink") + " - OK");
    });
  }

  function handleExport() {
    window.open(`/api/export/pdf?recon_id=${id}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  if (!recon) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Not found</p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    pending: { label: t("statusPending"), variant: "outline" },
    in_progress: { label: t("statusInProgress"), variant: "secondary" },
    completed: { label: t("statusCompleted"), variant: "default" },
  };
  const status = statusMap[recon.status] || statusMap.pending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {recon.date_from} ~ {recon.date_to}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t("matched")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{summary.matched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t("diff")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{summary.diff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t("missing")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{summary.missing}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleMatch} disabled={matching}>
          {matching ? tc("loading") : "AI Match"}
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          {t("shareLink")}
        </Button>
        <Button variant="outline" onClick={handleExport}>
          {t("exportPdf")}
        </Button>
      </div>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("resultSummary", {
                matched: String(summary.matched),
                diff: String(summary.diff),
                missing: String(summary.missing),
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Badge
                    variant={
                      m.match_status === "matched"
                        ? "default"
                        : m.match_status === "diff"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {m.match_status === "matched"
                      ? t("matched")
                      : m.match_status === "diff"
                      ? t("diff")
                      : t("missing")}
                  </Badge>
                  <span className="flex-1 text-muted-foreground truncate">
                    {m.diff_detail || (m.match_status === "matched" ? "OK" : "-")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
