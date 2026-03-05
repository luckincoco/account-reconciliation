"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { reconciliationSchema } from "@/lib/validations";

export default function NewReconciliationPage() {
  const t = useTranslations("reconciliation");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = reconciliationSchema.safeParse({
      date_from: dateFrom,
      date_to: dateTo,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(fieldErrors.date_to === "dateRangeInvalid"
        ? "End date must be after start date"
        : "Please check form fields");
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("new") + " - OK");
        router.push(`/reconciliations/${json.data.id}`);
      } else {
        toast.error(json.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{t("new")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("selectPeriod")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">{t("dateFrom")} *</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setErrors((prev) => { const n = { ...prev }; delete n.date_from; return n; });
                }}
                className={errors.date_from ? "border-red-500" : ""}
              />
              {errors.date_from && (
                <p className="text-xs text-red-500">{errors.date_from}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">{t("dateTo")} *</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setErrors((prev) => { const n = { ...prev }; delete n.date_to; return n; });
                }}
                className={errors.date_to ? "border-red-500" : ""}
              />
              {errors.date_to && (
                <p className="text-xs text-red-500">{errors.date_to}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc("loading") : t("new")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
