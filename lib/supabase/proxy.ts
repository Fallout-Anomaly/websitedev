import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isStaffAccount } from "@/src/lib/staff-access";
import { safeInternalPath } from "@/src/lib/safe-auth-redirect";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl, hasPublicSupabaseConfig } from "./public-env";

function userFromVerifiedClaims(
  claims:
    | { sub?: string; app_metadata?: User["app_metadata"] }
    | null
    | undefined,
): Pick<User, "id" | "app_metadata"> | null {
  const sub = claims?.sub;
  if (!sub) return null;
  return {
    id: sub,
    app_metadata: claims?.app_metadata ?? {},
  };
}

function redirectPreservingSupabaseCookies(
  url: URL,
  supabaseResponse: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirect;
}

/**
 * Refreshes the Auth session and returns a response that must carry updated cookies.
 * See: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
 *
 * Do not run logic between createServerClient and getClaims() except what Supabase documents;
 * uses getClaims() so the JWT is verified (important for cookie-based sessions).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasPublicSupabaseConfig) {
    return supabaseResponse;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as
    | { sub?: string; app_metadata?: User["app_metadata"] }
    | undefined;
  const userStub = userFromVerifiedClaims(claims);

  const isStaffRoute = request.nextUrl.pathname.startsWith("/staff");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  if (isStaffRoute && !userStub) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return redirectPreservingSupabaseCookies(loginUrl, supabaseResponse);
  }

  if (isStaffRoute && userStub && !(await isStaffAccount(supabase, userStub))) {
    return redirectPreservingSupabaseCookies(
      new URL("/", request.url),
      supabaseResponse,
    );
  }

  if (isLoginRoute && userStub) {
    const nextRaw = request.nextUrl.searchParams.get("next");
    const dest = safeInternalPath(nextRaw, "");
    if (
      dest &&
      (dest.startsWith("/account") || dest.startsWith("/auth/"))
    ) {
      return redirectPreservingSupabaseCookies(
        new URL(dest, request.url),
        supabaseResponse,
      );
    }
    if (await isStaffAccount(supabase, userStub)) {
      return redirectPreservingSupabaseCookies(
        new URL("/staff", request.url),
        supabaseResponse,
      );
    }
    return redirectPreservingSupabaseCookies(
      new URL("/", request.url),
      supabaseResponse,
    );
  }

  return supabaseResponse;
}
