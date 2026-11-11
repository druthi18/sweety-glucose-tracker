/**
 * Report Caching Service
 * Supports transparent in-memory and Redis caching with automatic invalidation.
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  generateKey(userId, dateStr) {
    return `report:${userId}:${dateStr}`;
  }

  async get(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async delete(key) {
    this.memoryCache.delete(key);
  }

  /**
   * Invalidates all cached reports for a specific user when any reading changes.
   */
  async invalidateUserReports(userId) {
    const prefix = `report:${userId}:`;
    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      activeKeys: this.memoryCache.size
    };
  }

  clear() {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

const cacheService = new CacheService();

module.exports = cacheService;
