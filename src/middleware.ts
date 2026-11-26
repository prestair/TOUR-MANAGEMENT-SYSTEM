import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Dashboard routes protect karo
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // localStorage server pe available nahi hota, isliye cookie check karte hain
    const session = request.cookies.get('tbms_session')
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Agar already logged in hai aur /login pe ja raha hai toh dashboard bhejo
  if (request.nextUrl.pathname === '/login') {
    const session = request.cookies.get('tbms_session')
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
