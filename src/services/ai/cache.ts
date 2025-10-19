import { supabase } from '../supabase';

// AI Content Cache Service
// Manages content caching with TTL, key generation, and cache statistics

export interface CacheEntry {
  cache_key: string;
  content: any;
  provider_used: string;
  generated_at: string;
  ttl_seconds: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  avgLatencySaved: number;
  topKeys: string[];
  expiredEntries: number;
}

export class ContentCacheService {
  /**
   * Generate cache key from request parameters
   */
  static generateCacheKey(
    grade: string,
    subject: string,
    skill: string,
    difficulty: string,
    type: string,
    language: string = 'en'
  ): string {
    // Create deterministic cache key
    const parts = [grade, subject, skill, difficulty, type, language].map(p => 
      p.toLowerCase().replace(/[^a-z0-9]/g, '_')
    );
    return parts.join('|');
  }

  /**
   * Get content from cache
   */
  static async getFromCache(cacheKey: string): Promise<{
    content: any | null;
    hit: boolean;
    expired: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('content_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single();
        
      if (error || !data) {
        return { content: null, hit: false, expired: false };
      }
      
      // Check if expired
      const generatedAt = new Date(data.generated_at).getTime();
      const now = Date.now();
      const isExpired = (now - generatedAt) / 1000 > data.ttl_seconds;
      
      if (isExpired) {
        // Clean up expired entry
        await this.removeFromCache(cacheKey);
        return { content: null, hit: false, expired: true };
      }
      
      return {
        content: data.content,
        hit: true,
        expired: false
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return { content: null, hit: false, expired: false };
    }
  }

  /**
   * Store content in cache
   */
  static async storeInCache(
    cacheKey: string,
    content: any,
    providerUsed: string,
    ttlSeconds: number = 604800 // 7 days default
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_cache')
        .upsert({
          cache_key: cacheKey,
          content: content,
          provider_used: providerUsed,
          generated_at: new Date().toISOString(),
          ttl_seconds: ttlSeconds
        });
        
      if (error) {
        console.error('Cache store error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Cache store error:', error);
      return false;
    }
  }

  /**
   * Remove content from cache
   */
  static async removeFromCache(cacheKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_cache')
        .delete()
        .eq('cache_key', cacheKey);
        
      if (error) {
        console.error('Cache remove error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(orgId?: string): Promise<CacheStats> {
    try {
      // Get total entries
      let query = supabase.from('content_cache').select('cache_key, generated_at, ttl_seconds');
      
      const { data: entries, error } = await query;
      
      if (error) {
        console.error('Cache stats error:', error);
        return {
          totalEntries: 0,
          hitRate: 0,
          avgLatencySaved: 0,
          topKeys: [],
          expiredEntries: 0
        };
      }
      
      const now = Date.now();
      const expired = entries?.filter(entry => {
        const generatedAt = new Date(entry.generated_at).getTime();
        return (now - generatedAt) / 1000 > entry.ttl_seconds;
      }).length || 0;
      
      // Calculate hit rate (would need request logs for accurate calculation)
      // For now, estimate based on cache entry frequency
      const hitRate = entries ? Math.min(85, entries.length * 2) : 0;
      
      return {
        totalEntries: entries?.length || 0,
        hitRate: hitRate,
        avgLatencySaved: 2500, // Estimated avg latency saved per cache hit
        topKeys: entries?.slice(0, 10).map(e => e.cache_key) || [],
        expiredEntries: expired
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        hitRate: 0,
        avgLatencySaved: 0,
        topKeys: [],
        expiredEntries: 0
      };
    }
  }

  /**
   * Clean up expired entries
   */
  static async cleanupExpired(): Promise<number> {
    try {
      // This would typically be done with a SQL query
      // For now, we'll use a simple approach
      const { data: entries } = await supabase
        .from('content_cache')
        .select('cache_key, generated_at, ttl_seconds');
        
      if (!entries) return 0;
      
      const now = Date.now();
      const expiredKeys = entries
        .filter(entry => {
          const generatedAt = new Date(entry.generated_at).getTime();
          return (now - generatedAt) / 1000 > entry.ttl_seconds;
        })
        .map(entry => entry.cache_key);
      
      if (expiredKeys.length === 0) return 0;
      
      const { error } = await supabase
        .from('content_cache')
        .delete()
        .in('cache_key', expiredKeys);
        
      if (error) {
        console.error('Cache cleanup error:', error);
        return 0;
      }
      
      return expiredKeys.length;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  /**
   * Preload cache for common requests
   */
  static async preloadCache(
    requests: {
      grade: string;
      subject: string;
      skill: string;
      difficulty: string;
      type: string;
      language?: string;
    }[]
  ): Promise<number> {
    let preloadCount = 0;
    
    for (const request of requests) {
      const cacheKey = this.generateCacheKey(
        request.grade,
        request.subject,
        request.skill,
        request.difficulty,
        request.type,
        request.language || 'en'
      );
      
      const { hit } = await this.getFromCache(cacheKey);
      if (!hit) {
        // Would queue this request for background generation
        // For now, just count what needs preloading
        preloadCount++;
      }
    }
    
    return preloadCount;
  }

  /**
   * Get cache utilization by subject/grade
   */
  static async getCacheUtilization(): Promise<{
    bySubject: { subject: string; entries: number }[];
    byGrade: { grade: string; entries: number }[];
    byDifficulty: { difficulty: string; entries: number }[];
  }> {
    try {
      const { data: entries } = await supabase
        .from('content_cache')
        .select('cache_key');
        
      if (!entries) {
        return { bySubject: [], byGrade: [], byDifficulty: [] };
      }
      
      const subjectMap = new Map();
      const gradeMap = new Map();
      const difficultyMap = new Map();
      
      entries.forEach(entry => {
        const parts = entry.cache_key.split('|');
        if (parts.length >= 6) {
          const [grade, subject, , difficulty] = parts;
          
          subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
          gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
          difficultyMap.set(difficulty, (difficultyMap.get(difficulty) || 0) + 1);
        }
      });
      
      return {
        bySubject: Array.from(subjectMap.entries()).map(([subject, entries]) => ({ subject, entries })),
        byGrade: Array.from(gradeMap.entries()).map(([grade, entries]) => ({ grade, entries })),
        byDifficulty: Array.from(difficultyMap.entries()).map(([difficulty, entries]) => ({ difficulty, entries }))
      };
    } catch (error) {
      console.error('Cache utilization error:', error);
      return { bySubject: [], byGrade: [], byDifficulty: [] };
    }
  }
}

export default ContentCacheService;