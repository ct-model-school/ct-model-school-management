import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const adminLoginPath = "/admin/login";

export async function proxy(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname === adminLoginPath;

  if (isAdminPath && !isLoginPath) {
    request.headers.set("x-admin-pathname", request.nextUrl.pathname);
  }

  const { response, user } = await updateSupabaseSession(request);

  if (!isAdminPath || isLoginPath) return response;
  if (user) return response;

  const loginUrl = new URL(adminLoginPath, request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
