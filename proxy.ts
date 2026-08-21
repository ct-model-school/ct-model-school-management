import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const adminLoginPath = "/admin/login";

/**
 * Refreshes the Supabase session for every matched request and performs the
 * lightweight route check recommended for Next.js Proxy. Database access and
 * role checks must still happen next to each protected data operation.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname === adminLoginPath;

  if (!isAdminPath || isLoginPath) {
    return response;
  }

  if (user) {
    return response;
  }

  const loginUrl = new URL(adminLoginPath, request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
