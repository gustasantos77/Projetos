import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/api/auth/',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)
  const method = request.method

  const rateLimit = checkRateLimit(ip, pathname, method)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
      }
    )
  }

  if (isPublicPath(pathname)) {
    const response = addSecurityHeaders(NextResponse.next())
    applyRateLimitHeaders(response, rateLimit)
    return response
  }

  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (pathname.startsWith('/api/') && pathname !== '/api/auth/session') {
    const certCn = request.headers.get('x-client-cert-cn')
    if (process.env.MTLS_ENABLED === 'true' && !certCn) {
      return NextResponse.json(
        { error: 'Certificado do cliente obrigatório' },
        { status: 403 }
      )
    }
  }

  const response = addSecurityHeaders(NextResponse.next())
  applyRateLimitHeaders(response, rateLimit)
  return response
}

function applyRateLimitHeaders(
  response: NextResponse,
  rateLimit: { remaining: number; resetAt: number }
): void {
  const headers = getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.pluggy.ai; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://api.pluggy.ai https://cdn.pluggy.ai https://connect.pluggy.ai wss://connect.pluggy.ai; " +
    "frame-src 'self' https://cdn.pluggy.ai https://connect.pluggy.ai; " +
    "object-src 'none'; " +
    "base-uri 'self'"
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
