"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations";

export default function NewTransactionPage() {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    type: "in" as "in" | "out",
    counterpart_name: "",
    item_name: "",
    spec: "",
    quantity: "",
    unit: "",
    unit_price: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  function updateField(field: string, value: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantity" || field === "unit_price") {
        const qty = field === "quantity" ? Number(value) : Number(prev.quantity);
        const price = field === "unit_price" ? Number(value) : Number(prev.unit_price);
        if (qty && price) {
          next.amount = (qty * price).toFixed(2);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = transactionSchema.safeParse({
      ...form,
      quantity: Number(form.quantity) || 0,
      unit_price: Number(form.unit_price) || 0,
      amount: Number(form.amount) || 0,
      source: "manual",
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(t("validationError") || "Please check form fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("new") + " - OK");
        router.push("/transactions");
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
          <CardTitle>{t("sourceManual")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("typeIn")}/{t("typeOut")}</Label>
              <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t("typeIn")}</SelectItem>
                  <SelectItem value="out">{t("typeOut")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterpart">{t("counterpart")} *</Label>
              <Input
                id="counterpart"
                placeholder={t("counterpart")}
                value={form.counterpart_name}
                onChange={(e) => updateField("counterpart_name", e.target.value)}
                className={errors.counterpart_name ? "border-red-500" : ""}
              />
              {errors.counterpart_name && (
                <p className="text-xs text-red-500">{errors.counterpart_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">{t("itemName")} *</Label>
              <Input
                id="itemName"
                placeholder={t("itemName")}
                value={form.item_name}
                onChange={(e) => updateField("item_name", e.target.value)}
                className={errors.item_name ? "border-red-500" : ""}
              />
              {errors.item_name && (
                <p className="text-xs text-red-500">{errors.item_name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">{t("quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t("unit")}</Label>
                <Input
                  id="unit"
                  placeholder={t("unit")}
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">{t("unitPrice")}</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.unit_price}
                  onChange={(e) => updateField("unit_price", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t("amount")} *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">{errors.amount}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t("date")} *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tc("loading") : tc("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
