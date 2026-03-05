import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Step 1: Refresh Supabase auth session
  await updateSession(request);

  // Step 2: Handle locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - API routes
    // - Next.js internals
    // - Static files
    "/((?!api|_next/static|_next/image|icons|manifest\\.json|sw\\.js|favicon\\.ico).*)",
  ],
};
