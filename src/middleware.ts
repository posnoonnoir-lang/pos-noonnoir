import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Auth route checks. Protect /pos and /dashboard 
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/pos") || pathname === "/") {
        // Read auth cookie directly
        const authCookie = request.cookies.get("pos_auth")

        if (!authCookie || authCookie.value !== "true") {
            // Unauthenticated -> redirect to login
            const loginUrl = new URL("/login", request.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    // Redirect root to /pos if authenticated
    if (pathname === "/") {
        const posUrl = new URL("/pos", request.url)
        return NextResponse.redirect(posUrl)
    }

    return NextResponse.next()
}

// Ensure middleware ONLY runs on non-static assets and API pages
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
