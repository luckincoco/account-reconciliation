"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Reconciliation } from "@/types/reconciliation";
import { generateReconPdf } from "@/lib/export-pdf";
import { ReconMatchTable } from "@/components/business/recon-match-table";

interface EnrichedMatch {
  id: string;
  match_status: "matched" | "diff" | "missing";
  diff_detail: string | null;
  confirmed: boolean;
  my_tx: { item_name: string; amount: number; date: string } | null;
  their_tx: { item_name: string; amount: number; date: string } | null;
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
      </div>
      <div className="h-4 w-48 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-16 rounded bg-muted mb-2" />
              <div className="h-8 w-12 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const t = useTranslations("reconciliation");
  const tc = useTranslations("common");
  const [id, setId] = useState("");
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
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
    navigator.clipboard.writeText(url).then(
      () => toast.success(t("copyLink") + " - OK"),
      () => {
        // Fallback for older browsers / non-HTTPS
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        toast.success(t("copyLink") + " - OK");
      }
    );
  }

  function handleExport() {
    if (!recon) return;
    generateReconPdf({
      id,
      date_from: recon.date_from,
      date_to: recon.date_to,
      status: recon.status,
      summary,
      matches: matches.map((m) => ({
        match_status: m.match_status,
        diff_detail: m.diff_detail,
        my_tx: m.my_tx || null,
        their_tx: m.their_tx || null,
      })),
    });
    toast.success(t("exportPdf") + " - OK");
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!recon) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Not found</p>
      </div>
    );
  }

  const statusMap: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" }
  > = {
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

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t("matched")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {summary.matched}
            </p>
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
            <p className="text-2xl font-bold text-red-600">
              {summary.missing}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleMatch} disabled={matching}>
          {matching ? tc("loading") : "AI Match"}
        </Button>
        <Button variant="outline" onClick={handleCopyLink}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {t("copyLink")}
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t("exportPdf")}
        </Button>
      </div>

      {/* Share link display */}
      {recon.share_token && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-xs">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/recon/${recon.share_token}`
                  : `/recon/${recon.share_token}`}
              </code>
              <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                {t("copyLink")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed match table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {matches.length > 0
            ? t("resultSummary", {
                matched: String(summary.matched),
                diff: String(summary.diff),
                missing: String(summary.missing),
              })
            : "Match Details"}
        </h2>
        <ReconMatchTable matches={matches} />
      </div>
    </div>
  );
}
