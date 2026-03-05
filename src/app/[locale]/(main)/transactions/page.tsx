"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/transaction";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTransactions(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(id: string) {
    if (!confirm(tc("delete") + "?")) return;
    fetch(`/api/transactions/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        }
      });
  }

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
          <Link href="/transactions/new">{t("new")}</Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">{t("empty")}</p>
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link href="/transactions/new">{t("new")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={tx.type === "in" ? "default" : "secondary"}>
                      {tx.type === "in" ? t("typeIn") : t("typeOut")}
                    </Badge>
                    <span className="font-medium truncate">{tx.item_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tx.counterpart_name} &middot; {tx.date}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="font-semibold whitespace-nowrap">
                    &yen;{Number(tx.amount).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-7 px-2"
                    onClick={() => handleDelete(tx.id)}
                  >
                    {tc("delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
