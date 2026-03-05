"use client";

import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold md:hidden">
          DuiZhang
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
