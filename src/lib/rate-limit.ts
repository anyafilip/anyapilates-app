import { headers } from 'next/headers'

// In-memory store for rate limiting. 
// Note: In serverless environments (like Vercel), this state resets on cold starts.
// For enterprise apps, you'd replace this Map with a Redis check (e.g. Upstash).
const store = new Map<string, { count: number; resetTime: number }>()

/**
 * Checks if the current IP has exceeded the rate limit for a specific action.
 * @param action - The name of the action (e.g. 'register', 'forgot-password')
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(action: string, limit: number, windowMs: number): Promise<boolean> {
  const headersList = await headers()
  // Extract IP. Next.js running on Vercel/proxies uses x-forwarded-for
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown_ip'
  const key = `${action}:${ip}`

  const now = Date.now()
  const record = store.get(key)

  // Clean up expired records occasionally to prevent memory leaks in long-running processes
  if (Math.random() < 0.05) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetTime) {
        store.delete(k)
      }
    }
  }

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false // Rate limit exceeded
  }

  record.count += 1
  return true
}
