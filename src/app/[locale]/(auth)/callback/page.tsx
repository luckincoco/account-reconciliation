"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Check if user is now authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/transactions");
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Processing authentication...</p>
    </div>
  );
}
