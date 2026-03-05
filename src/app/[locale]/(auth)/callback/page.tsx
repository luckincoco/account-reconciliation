"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Handle hash-based callback (email confirmation / magic link)
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/transactions");
      }
    });

    // Fallback: check session after a brief delay
    const timer = setTimeout(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          router.push("/transactions");
        } else {
          router.push("/login");
        }
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Processing authentication...</p>
      </div>
    </div>
  );
}
