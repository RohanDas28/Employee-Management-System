import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // SuperAdmin routes
    if (path.startsWith("/admin") && token?.role !== "SuperAdmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // HR routes
    if (path.startsWith("/hr") && token?.role !== "HR" && token?.role !== "SuperAdmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
