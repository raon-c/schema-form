import { ValidationCacheManager, createValidationCacheManager } from '../ValidationCacheManager';
import type { ValidationResult } from '../../types';

describe('ValidationCacheManager', () => {
  let cacheManager: ValidationCacheManager;
  let mockResult: ValidationResult;

  beforeEach(() => {
    cacheManager = createValidationCacheManager({
      maxSize: 5,
      maxAge: 1000, // 1 second for testing
      cleanupInterval: 0, // Disable automatic cleanup for tests
    });

    mockResult = {
      isValid: true,
      timestamp: Date.now(),
    };
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve cache entries', () => {
      cacheManager.set('test-key', mockResult);
      
      const retrieved = cacheManager.get('test-key');
      expect(retrieved).toEqual(mockResult);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cacheManager.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      cacheManager.set('test-key', mockResult);
      
      expect(cacheManager.has('test-key')).toBe(true);
      expect(cacheManager.has('non-existent')).toBe(false);
    });

    it('should delete cache entries', () => {
      cacheManager.set('test-key', mockResult);
      
      const deleted = cacheManager.delete('test-key');
      expect(deleted).toBe(true);
      expect(cacheManager.has('test-key')).toBe(false);
    });

    it('should clear all cache entries', () => {
      cacheManager.set('key1', mockResult);
      cacheManager.set('key2', mockResult);
      
      cacheManager.clear();
      
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
    });
  });

  describe('cache expiration', () => {
    it('should expire old entries', async () => {
      const expiredResult = {
        ...mockResult,
        timestamp: Date.now() - 2000, // 2 seconds ago
      };
      
      cacheManager.set('expired-key', expiredResult);
      
      // Should return undefined for expired entry
      const retrieved = cacheManager.get('expired-key');
      expect(retrieved).toBeUndefined();
    });

    it('should cleanup expired entries', () => {
      const expiredResult = {
        ...mockResult,
        timestamp: Date.now() - 2000,
      };
      
      cacheManager.set('expired-key', expiredResult);
      cacheManager.set('valid-key', mockResult);
      
      const deletedCount = cacheManager.cleanup();
      
      expect(deletedCount).toBe(1);
      expect(cacheManager.has('expired-key')).toBe(false);
      expect(cacheManager.has('valid-key')).toBe(true);
    });
  });

  describe('cache eviction', () => {
    it('should evict entries when max size is reached', () => {
      // Fill cache to max size
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key${i}`, mockResult);
      }
      
      // Add one more entry to trigger eviction
      cacheManager.set('key5', mockResult);
      
      const stats = cacheManager.getStats();
      expect(stats.size).toBeLessThanOrEqual(5);
    });

    it('should respect LRU eviction strategy', () => {
      const lruCache = createValidationCacheManager({
        maxSize: 3,
        evictionStrategy: 'lru',
        cleanupInterval: 0,
      });

      // Fill cache
      lruCache.set('key1', mockResult);
      lruCache.set('key2', mockResult);
      lruCache.set('key3', mockResult);

      // Access key1 to make it recently used
      lruCache.get('key1');

      // Add new entry to trigger eviction
      lruCache.set('key4', mockResult);

      // key2 should be evicted (least recently used)
      expect(lruCache.has('key1')).toBe(true);
      expect(lruCache.has('key2')).toBe(false);
      expect(lruCache.has('key3')).toBe(true);
      expect(lruCache.has('key4')).toBe(true);

      lruCache.destroy();
    });
  });

  describe('cache with tags', () => {
    it('should store entries with tags', () => {
      cacheManager.set('key1', mockResult, { tags: ['form1', 'field1'] });
      cacheManager.set('key2', mockResult, { tags: ['form1', 'field2'] });
      cacheManager.set('key3', mockResult, { tags: ['form2', 'field1'] });

      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('key2')).toBe(true);
      expect(cacheManager.has('key3')).toBe(true);
    });

    it('should clear entries by tags', () => {
      cacheManager.set('key1', mockResult, { tags: ['form1', 'field1'] });
      cacheManager.set('key2', mockResult, { tags: ['form1', 'field2'] });
      cacheManager.set('key3', mockResult, { tags: ['form2', 'field1'] });

      const deletedCount = cacheManager.clearByTags(['form1']);

      expect(deletedCount).toBe(2);
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(true);
    });
  });

  describe('cache priorities', () => {
    it('should store entries with different priorities', () => {
      cacheManager.set('low', mockResult, { priority: 'low' });
      cacheManager.set('normal', mockResult, { priority: 'normal' });
      cacheManager.set('high', mockResult, { priority: 'high' });

      expect(cacheManager.has('low')).toBe(true);
      expect(cacheManager.has('normal')).toBe(true);
      expect(cacheManager.has('high')).toBe(true);
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', () => {
      cacheManager.set('key1', mockResult);
      cacheManager.set('key2', mockResult);
      
      // Access key1 to increase hit count
      cacheManager.get('key1');

      const stats = cacheManager.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeGreaterThan(0);
      expect(stats.newestEntry).toBeGreaterThan(0);
    });

    it('should track cache keys', () => {
      cacheManager.set('key1', mockResult);
      cacheManager.set('key2', mockResult);

      const keys = cacheManager.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should provide cache entries for debugging', () => {
      cacheManager.set('key1', mockResult, { tags: ['test'] });

      const entries = cacheManager.entries();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.key).toBe('key1');
      expect(entries[0]?.entry.result).toEqual(mockResult);
      expect(entries[0]?.entry.tags).toEqual(['test']);
    });
  });

  describe('cache configuration', () => {
    it('should update cache configuration', () => {
      cacheManager.updateConfig({ maxSize: 10 });

      const stats = cacheManager.getStats();
      expect(stats.maxSize).toBe(10);
    });

    it('should evict entries when max size is reduced', () => {
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key${i}`, mockResult);
      }

      // Reduce max size
      cacheManager.updateConfig({ maxSize: 3 });

      const stats = cacheManager.getStats();
      expect(stats.size).toBeLessThanOrEqual(3);
    });
  });

  describe('TTL support', () => {
    it('should support custom TTL for entries', () => {
      const shortTTL = 100; // 100ms
      cacheManager.set('short-ttl', mockResult, { ttl: shortTTL });

      // Should be available immediately
      expect(cacheManager.has('short-ttl')).toBe(true);

      // Should expire after TTL
      setTimeout(() => {
        expect(cacheManager.has('short-ttl')).toBe(false);
      }, shortTTL + 50);
    });
  });
});