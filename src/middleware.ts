import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Admin routes — hanya ADMIN
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Pengawas routes — hanya PENGAWAS
    if (pathname.startsWith("/pengawas") && role !== "PENGAWAS") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Panitia routes — hanya PANITIA
    if (pathname.startsWith("/panitia") && role !== "PANITIA") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Peserta routes — hanya PESERTA
    const pesertaRoutes = ["/dashboard", "/profile", "/exams", "/results", "/certificates", "/courses"];
    const isPesertaRoute = pesertaRoutes.some((route) => pathname.startsWith(route));
    if (isPesertaRoute && role !== "PESERTA") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/pengawas/:path*",
    "/panitia/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/exams/:path*",
    "/results/:path*",
    "/certificates/:path*",
    "/courses/:path*",
  ],
};
