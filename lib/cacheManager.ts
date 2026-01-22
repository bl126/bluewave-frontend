// [CODE: FRONTEND_CACHE_MANAGER]
// lib/cacheManager.ts
// Simple localStorage-based caching with TTL support

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class CacheManager {
  private prefix = "bw_cache_";

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.error("Cache read error:", e);
      return null;
    }
  }

  /**
   * Set cached data with TTL (in milliseconds)
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    if (typeof window === "undefined") return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      console.error("Cache write error:", e);
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all Bluewave cache entries
   */
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Cache clear error:", e);
    }
  }
}

export const cacheManager = new CacheManager();

// =========================================
// CACHE TTL CONSTANTS (in milliseconds)
// =========================================
export const CACHE_TTL = {
  COUNTRIES: 24 * 60 * 60 * 1000, // 24 hours
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 60 * 1000, // 1 minute
  MISSIONS: 5 * 60 * 1000, // 5 minutes
} as const;
