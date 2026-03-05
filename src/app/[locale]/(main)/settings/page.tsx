"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
      }
    });
    // Fetch user profile for plan
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("plan")
          .eq("id", user.id)
          .single();
        if (data) setPlan(data.plan);
      }
    });
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{email || "-"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("plan")}</span>
            <span>{plan === "pro" ? t("planPro") : t("planFree")}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            {ta("logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
