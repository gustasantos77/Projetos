type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)

const LIMITS = {
  default: { maxRequests: 100, windowMs: 60_000 },
  auth: { maxRequests: 20, windowMs: 60_000 },
  sync: { maxRequests: 10, windowMs: 60_000 },
  write: { maxRequests: 30, windowMs: 60_000 },
} as const

type LimitType = keyof typeof LIMITS

export function checkRateLimit(
  ip: string,
  path: string,
  method: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const limitType = getLimitType(path, method)
  const config = LIMITS[limitType]
  const key = `${ip}:${limitType}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

function getLimitType(path: string, method: string): LimitType {
  if (path.startsWith('/api/auth/')) return 'auth'
  if (path.includes('/sync') && method === 'POST') return 'sync'
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') return 'write'
  return 'default'
}

export function getRateLimitHeaders(
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
  }
}
