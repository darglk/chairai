/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting for API endpoints to prevent abuse.
 * Tracks requests per user/IP and enforces limits.
 */

// Configuration for rate limiting
const RATE_LIMIT_CONFIG = {
  // Maximum requests per window per user for image generation
  IMAGE_GENERATION_LIMIT: 5,
  // Time window in seconds
  WINDOW_SIZE_SECONDS: 300, // 5 minutes
  // Storage for tracking request counts (in production, use Redis)
  requestCounts: new Map<string, { count: number; resetTime: number }>(),
};

/**
 * Get a unique identifier for rate limiting
 * Uses userId if available, otherwise uses IP address
 *
 * @param userId Optional user ID from authentication
 * @param clientIp IP address from request headers
 * @returns Unique rate limit key
 */
export function getRateLimitKey(userId: string | undefined, clientIp: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${clientIp}`;
}

/**
 * Check if a request is within rate limit
 *
 * @param key Rate limit key
 * @param limit Maximum requests allowed
 * @param windowSize Time window in seconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowSize: number): boolean {
  const now = Date.now();
  const bucket = RATE_LIMIT_CONFIG.requestCounts.get(key);

  if (!bucket || now > bucket.resetTime) {
    // New bucket or expired bucket
    RATE_LIMIT_CONFIG.requestCounts.set(key, {
      count: 1,
      resetTime: now + windowSize * 1000,
    });
    return true;
  }

  if (bucket.count < limit) {
    bucket.count++;
    return true;
  }

  return false;
}

/**
 * Get remaining requests in current window
 *
 * @param key Rate limit key
 * @param limit Maximum requests allowed
 * @returns Number of remaining requests
 */
export function getRemainingRequests(key: string, limit: number): number {
  const bucket = RATE_LIMIT_CONFIG.requestCounts.get(key);

  if (!bucket) {
    return limit;
  }

  if (Date.now() > bucket.resetTime) {
    return limit;
  }

  return Math.max(0, limit - bucket.count);
}

/**
 * Get reset time for rate limit window
 *
 * @param key Rate limit key
 * @returns Unix timestamp in milliseconds when limit resets
 */
export function getResetTime(key: string): number {
  const bucket = RATE_LIMIT_CONFIG.requestCounts.get(key);

  if (!bucket) {
    return Date.now() + RATE_LIMIT_CONFIG.WINDOW_SIZE_SECONDS * 1000;
  }

  return bucket.resetTime;
}

/**
 * Check rate limit for image generation endpoint
 *
 * @param userId Optional user ID
 * @param clientIp Client IP address
 * @returns Object with allowed status and remaining requests
 */
export function checkImageGenerationRateLimit(
  userId: string | undefined,
  clientIp: string
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const key = getRateLimitKey(userId, clientIp);
  const allowed = checkRateLimit(key, RATE_LIMIT_CONFIG.IMAGE_GENERATION_LIMIT, RATE_LIMIT_CONFIG.WINDOW_SIZE_SECONDS);
  const remaining = getRemainingRequests(key, RATE_LIMIT_CONFIG.IMAGE_GENERATION_LIMIT);
  const resetTime = getResetTime(key);

  return {
    allowed,
    remaining,
    resetTime,
  };
}

/**
 * Reset rate limit for specific key
 * Useful for testing or manual intervention
 *
 * @param key Rate limit key
 */
export function resetRateLimit(key: string): void {
  RATE_LIMIT_CONFIG.requestCounts.delete(key);
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  RATE_LIMIT_CONFIG.requestCounts.clear();
}
