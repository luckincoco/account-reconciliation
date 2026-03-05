"use client";

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { transactionSchema } from "@/lib/validations";

interface ExtractedData {
  counterpart_name: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  date: string;
}

export function PhotoCapture() {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "form">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
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

  function resetState() {
    setStep("upload");
    setImageFile(null);
    setImagePreview("");
    setExtracting(false);
    setSaving(false);
    setErrors({});
    setForm({
      type: "in",
      counterpart_name: "",
      item_name: "",
      spec: "",
      quantity: "",
      unit: "",
      unit_price: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });
  }

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setStep("preview");

      // Auto-extract via OCR
      setExtracting(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (json.success && json.data.extracted) {
          const ext: ExtractedData = json.data.extracted;
          setForm((prev) => ({
            ...prev,
            counterpart_name: ext.counterpart_name || prev.counterpart_name,
            item_name: ext.item_name || prev.item_name,
            quantity: ext.quantity ? String(ext.quantity) : prev.quantity,
            unit: ext.unit || prev.unit,
            unit_price: ext.unit_price ? String(ext.unit_price) : prev.unit_price,
            amount: ext.amount ? String(ext.amount) : prev.amount,
            date: ext.date || prev.date,
          }));
          toast.success("AI extracted data from image");
        } else {
          toast.info("Could not extract data. Please fill in manually.");
        }
      } catch {
        toast.info("OCR unavailable. Please fill in manually.");
      } finally {
        setExtracting(false);
        setStep("form");
      }
    },
    []
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function updateField(field: string, value: string) {
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantity" || field === "unit_price") {
        const qty = field === "quantity" ? Number(value) : Number(prev.quantity);
        const price =
          field === "unit_price" ? Number(value) : Number(prev.unit_price);
        if (qty && price) {
          next.amount = (qty * price).toFixed(2);
        }
      }
      return next;
    });
  }

  async function handleSave() {
    const result = transactionSchema.safeParse({
      ...form,
      quantity: Number(form.quantity) || 0,
      unit_price: Number(form.unit_price) || 0,
      amount: Number(form.amount) || 0,
      source: "photo",
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please check form fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("new") + " - OK");
        setOpen(false);
        resetState();
        router.push("/transactions");
      } else {
        toast.error(json.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          {t("sourcePhoto")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("sourcePhoto")}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span className="text-xs">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-xs">Upload Image</span>
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleInputChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Captured"
                className="w-full rounded-lg border max-h-64 object-contain"
              />
            )}
            {extracting && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">
                  AI is extracting data...
                </span>
              </div>
            )}
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Captured"
                className="w-full rounded-lg border max-h-40 object-contain"
              />
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Verify extracted data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t("typeIn")}/{t("typeOut")}
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => updateField("type", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">{t("typeIn")}</SelectItem>
                      <SelectItem value="out">{t("typeOut")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("counterpart")} *</Label>
                  <Input
                    className={`h-8 text-sm ${errors.counterpart_name ? "border-red-500" : ""}`}
                    value={form.counterpart_name}
                    onChange={(e) =>
                      updateField("counterpart_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("itemName")} *</Label>
                  <Input
                    className={`h-8 text-sm ${errors.item_name ? "border-red-500" : ""}`}
                    value={form.item_name}
                    onChange={(e) => updateField("item_name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("quantity")}</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      step="any"
                      value={form.quantity}
                      onChange={(e) => updateField("quantity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("unit")}</Label>
                    <Input
                      className="h-8 text-sm"
                      value={form.unit}
                      onChange={(e) => updateField("unit", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("unitPrice")}</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      step="any"
                      value={form.unit_price}
                      onChange={(e) => updateField("unit_price", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("amount")} *</Label>
                    <Input
                      className={`h-8 text-sm ${errors.amount ? "border-red-500" : ""}`}
                      type="number"
                      step="any"
                      value={form.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("date")} *</Label>
                  <Input
                    className={`h-8 text-sm ${errors.date ? "border-red-500" : ""}`}
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetState}
              >
                Retake
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? tc("loading") : tc("save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
