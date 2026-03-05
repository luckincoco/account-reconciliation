import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const tAuth = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">DuiZhang</h1>
        <p className="mt-4 text-xl text-muted-foreground">{t("title")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/transactions">{t("getStarted")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">{tAuth("login")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
