import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication
const protectedPaths = ["/transactions", "/reconciliations", "/settings"];
// Routes that should redirect to app if already authenticated
const authPaths = ["/login"];

function getPathWithoutLocale(pathname: string): string {
  const locales = routing.locales;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  // Step 1: Refresh Supabase auth session
  const { supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const cleanPath = getPathWithoutLocale(pathname);

  // Step 2: Route protection
  const isProtected = protectedPaths.some(
    (p) => cleanPath.startsWith(p)
  );
  const isAuthRoute = authPaths.some(
    (p) => cleanPath.startsWith(p)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/transactions", request.url));
  }

  // Step 3: Handle locale routing
  const intlResponse = intlMiddleware(request);

  // Merge supabase cookies into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest\\.json|sw\\.js|favicon\\.ico).*)",
  ],
};
