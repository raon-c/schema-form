import type { ValidationResult } from '../types';

/**
 * Cache entry with metadata for advanced cache management
 */
interface CacheEntry {
  result: ValidationResult;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  cleanupInterval: number;
  evictionStrategy: 'lru' | 'lfu' | 'ttl';
}

/**
 * Advanced validation result cache manager with multiple eviction strategies
 */
export class ValidationCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private accessOrder: string[] = []; // For LRU tracking

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      maxAge: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      evictionStrategy: 'lru',
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Get cached validation result
   */
  get(key: string): ValidationResult | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    return entry.result;
  }

  /**
   * Set validation result in cache
   */
  set(
    key: string,
    result: ValidationResult,
    options: {
      priority?: 'low' | 'normal' | 'high';
      tags?: string[];
      ttl?: number;
    } = {}
  ): void {
    const { priority = 'normal', tags = [], ttl } = options;

    // Create cache entry
    const entry: CacheEntry = {
      result: {
        ...result,
        timestamp: ttl ? Date.now() + ttl : result.timestamp,
      },
      accessCount: 1,
      lastAccessed: Date.now(),
      priority,
      tags,
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntries();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Check if a key exists in cache (without updating access metadata)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Clear cache entries by tags
   */
  clearByTags(tags: string[]): number {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hits = entries.filter(entry => entry.accessCount > 1).length;
    
    const timestamps = entries.map(entry => entry.result.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccess > 0 ? hits / totalAccess : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all cache entries (for debugging)
   */
  entries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: { ...entry },
    }));
  }

  /**
   * Manually trigger cache cleanup
   */
  cleanup(): number {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval !== undefined) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }

    // Evict entries if max size decreased
    if (newConfig.maxSize !== undefined && this.cache.size > newConfig.maxSize) {
      this.evictEntries();
    }
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.result.timestamp > this.config.maxAge;
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order tracking
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict cache entries based on configured strategy
   */
  private evictEntries(): void {
    const targetSize = Math.floor(this.config.maxSize * 0.8); // Evict to 80% capacity
    const entriesToEvict = this.cache.size - targetSize;

    if (entriesToEvict <= 0) return;

    let keysToEvict: string[] = [];

    switch (this.config.evictionStrategy) {
      case 'lru':
        keysToEvict = this.getLRUKeys(entriesToEvict);
        break;
      case 'lfu':
        keysToEvict = this.getLFUKeys(entriesToEvict);
        break;
      case 'ttl':
        keysToEvict = this.getTTLKeys(entriesToEvict);
        break;
    }

    keysToEvict.forEach(key => this.delete(key));
  }

  /**
   * Get least recently used keys for eviction
   */
  private getLRUKeys(count: number): string[] {
    return this.accessOrder.slice(0, count);
  }

  /**
   * Get least frequently used keys for eviction
   */
  private getLFUKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => {
      // Sort by access count (ascending), then by priority
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      const priorityOrder = { low: 0, normal: 1, high: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return entries.slice(0, count).map(([key]) => key);
  }

  /**
   * Get keys with shortest time to live for eviction
   */
  private getTTLKeys(count: number): string[] {
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => {
      const aTTL = a.result.timestamp + this.config.maxAge - Date.now();
      const bTTL = b.result.timestamp + this.config.maxAge - Date.now();
      return aTTL - bTTL;
    });

    return entries.slice(0, count).map(([key]) => key);
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation: key size + entry size
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry).length * 2;
    }

    return totalSize;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * Factory function to create ValidationCacheManager instance
 */
export function createValidationCacheManager(
  config?: Partial<CacheConfig>
): ValidationCacheManager {
  return new ValidationCacheManager(config);
}

/**
 * Global validation cache manager instance
 */
let globalValidationCacheManager: ValidationCacheManager | null = null;

/**
 * Get or create global validation cache manager instance
 */
export function getValidationCacheManager(): ValidationCacheManager {
  if (!globalValidationCacheManager) {
    globalValidationCacheManager = new ValidationCacheManager();
  }
  return globalValidationCacheManager;
}

/**
 * Cleanup global validation cache manager
 */
export function cleanupGlobalValidationCacheManager(): void {
  if (globalValidationCacheManager) {
    globalValidationCacheManager.destroy();
    globalValidationCacheManager = null;
  }
}