"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ShareData {
  recon_id: string;
  share_token: string;
  initiator_name: string;
  date_from: string;
  date_to: string;
  status: string;
  transactions: Array<{
    id: string;
    counterpart_name: string;
    type: string;
    item_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
    date: string;
  }>;
  matches: Array<{
    id: string;
    match_status: string;
    diff_detail: string | null;
    confirmed: boolean;
  }>;
}

export default function ShareReconPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const t = useTranslations("share");
  const tc = useTranslations("common");
  const tt = useTranslations("transactions");
  const [token, setToken] = useState("");
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Not found");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{tc("loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("from", { name: data.initiator_name })}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.date_from} ~ {data.date_to}
          </p>
        </div>

        {data.transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">{tc("noData")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={tx.type === "in" ? "default" : "secondary"}>
                        {tx.type === "in" ? tt("typeIn") : tt("typeOut")}
                      </Badge>
                      <span className="font-medium truncate">{tx.item_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tx.quantity} {tx.unit} &times; &yen;{tx.unit_price} &middot; {tx.date}
                    </div>
                  </div>
                  <span className="font-semibold ml-3">
                    &yen;{Number(tx.amount).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => toast.success(t("confirmAll") + " - OK")}
              >
                {t("confirmAll")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => toast.info(t("markDiff"))}
              >
                {t("markDiff")}
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => toast.info(t("uploadYours"))}
            >
              {t("uploadYours")}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t("registerPrompt")}
        </p>
      </div>
    </div>
  );
}
