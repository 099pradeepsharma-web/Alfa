import { StudentQuestion, PerformanceRecord, AIFeedback, Achievement, StudyGoal } from '../types';

const DB_NAME = 'AlfanumrikDB';
const DB_VERSION = 4; // Incremented for new optimizations
let db: IDBDatabase;
let dbReady = false;

// Enhanced store configuration with optimized indexes
const STORES_CONFIG = {
    'modules': { keyPath: 'id' },
    'reports': { keyPath: 'id' },
    'progress': { keyPath: 'id' },
    'questions': { 
        keyPath: 'id',
        indexes: [
            { name: 'studentId', keyPath: 'studentId' },
            { name: 'subject_chapter', keyPath: ['subject', 'chapter'] },
            { name: 'timestamp', keyPath: 'timestamp' }
        ]
    },
    'performance': {
        autoIncrement: true,
        indexes: [
            { name: 'studentId', keyPath: 'studentId' },
            { name: 'student_subject_date', keyPath: ['studentId', 'subject', 'completedDate'] },
            { name: 'score_date', keyPath: ['score', 'completedDate'] },
            { name: 'subject_score', keyPath: ['subject', 'score'] }
        ]
    },
    'diagrams': { keyPath: 'id' },
    'feedback': { keyPath: 'id' },
    'cache': {
        keyPath: 'key',
        indexes: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'type', keyPath: 'type' }
        ]
    },
    'videos': { keyPath: 'id' },
    'conceptMaps': { keyPath: 'id' },
    'achievements': {
        autoIncrement: true,
        indexes: [
            { name: 'studentId', keyPath: 'studentId' },
            { name: 'timestamp', keyPath: 'timestamp' }
        ]
    },
    'studyGoals': {
        keyPath: 'id',
        indexes: [
            { name: 'studentId', keyPath: 'studentId' },
            { name: 'isCompleted', keyPath: 'isCompleted' },
            { name: 'dueDate', keyPath: 'dueDate' }
        ]
    },
    'users': {
        keyPath: 'id',
        indexes: [
            { name: 'email', keyPath: 'email', unique: true },
            { name: 'grade', keyPath: 'grade' }
        ]
    },
    'teachers': {
        keyPath: 'id',
        indexes: [
            { name: 'email', keyPath: 'email', unique: true }
        ]
    },
    'parents': {
        keyPath: 'id',
        indexes: [
            { name: 'email', keyPath: 'email', unique: true }
        ]
    }
} as const;

type ObjectStoreName = keyof typeof STORES_CONFIG;

// Performance monitoring for database operations
class DatabasePerformanceMonitor {
    private metrics = new Map<string, number[]>();

    startTiming(operation: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(operation, duration);
            
            if (duration > 100) {
                console.warn(`🐌 Slow database operation: ${operation} took ${duration.toFixed(0)}ms`);
            }
        };
    }

    recordMetric(operation: string, duration: number): void {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        const values = this.metrics.get(operation)!;
        values.push(duration);
        
        if (values.length > 50) {
            values.shift();
        }
    }

    getStats() {
        const stats: { [key: string]: { avg: number; count: number; max: number } } = {};
        this.metrics.forEach((values, operation) => {
            if (values.length > 0) {
                stats[operation] = {
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    count: values.length,
                    max: Math.max(...values)
                };
            }
        });
        return stats;
    }
}

const dbPerfMonitor = new DatabasePerformanceMonitor();

/**
 * OPTIMIZED: Opens and initializes IndexedDB with proper error handling and connection pooling
 */
const openDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db && dbReady) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        let timeoutId: NodeJS.Timeout;

        // Add timeout to prevent hanging
        timeoutId = setTimeout(() => {
            console.error('Database connection timeout');
            reject(new Error('Database connection timeout. Please refresh and try again.'));
        }, 10000);

        request.onerror = () => {
            clearTimeout(timeoutId);
            console.error('IndexedDB error:', request.error);
            reject(new Error('Failed to open database. Please check if your browser supports IndexedDB.'));
        };

        request.onsuccess = () => {
            clearTimeout(timeoutId);
            db = request.result;
            dbReady = true;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            clearTimeout(timeoutId);
            const tempDb = (event.target as IDBOpenDBRequest).result;
            
            // Create stores with optimized configuration
            Object.entries(STORES_CONFIG).forEach(([storeName, config]) => {
                if (!tempDb.objectStoreNames.contains(storeName)) {
                    const store = config.autoIncrement 
                        ? tempDb.createObjectStore(storeName, { autoIncrement: true })
                        : tempDb.createObjectStore(storeName, { keyPath: config.keyPath });
                    
                    // Add indexes for better query performance
                    if (config.indexes) {
                        config.indexes.forEach(indexConfig => {
                            store.createIndex(
                                indexConfig.name, 
                                indexConfig.keyPath, 
                                { unique: indexConfig.unique || false }
                            );
                        });
                    }
                }
            });
            
            console.log('✅ Database schema updated with optimized indexes');
        };

        // Handle database blocking (e.g., other tabs with older version)
        request.onblocked = () => {
            console.warn('Database upgrade blocked by other tabs. Please close other Alfanumrik tabs.');
        };
    });
};

// Enhanced promise wrapper with better error messages
const promisifyRequest = <T>(request: IDBRequest<T>, operation: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Database operation failed: ${operation}`, request.error);
            reject(new Error(`Database operation '${operation}' failed. Please try again.`));
        };
    });
};

// PERFORMANCE: Batch operations for better efficiency
export const batchWrite = async (
    operations: Array<{
        table: ObjectStoreName;
        operation: 'put' | 'add' | 'delete';
        key?: IDBValidKey;
        data?: any;
    }>
): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('batchWrite');
    const database = await openDb();
    
    // Group operations by store for efficiency
    const operationsByStore = new Map<ObjectStoreName, typeof operations>();
    operations.forEach(op => {
        if (!operationsByStore.has(op.table)) {
            operationsByStore.set(op.table, []);
        }
        operationsByStore.get(op.table)!.push(op);
    });

    const promises: Promise<any>[] = [];
    
    operationsByStore.forEach((ops, storeName) => {
        const tx = database.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        ops.forEach(op => {
            let request: IDBRequest;
            switch (op.operation) {
                case 'put':
                    request = op.key ? store.put(op.data, op.key) : store.put(op.data);
                    break;
                case 'add':
                    request = store.add(op.data);
                    break;
                case 'delete':
                    request = store.delete(op.key!);
                    break;
                default:
                    throw new Error(`Unknown operation: ${op.operation}`);
            }
            promises.push(promisifyRequest(request, `batch-${op.operation}`));
        });
    });
    
    await Promise.all(promises);
    endTiming();
};

// OPTIMIZED: Enhanced getDoc with caching
export const getDoc = async <T>(table: ObjectStoreName, key: IDBValidKey): Promise<T | null> => {
    const endTiming = dbPerfMonitor.startTiming('getDoc');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const result = await promisifyRequest<T>(store.get(key), `get-${table}`);
        endTiming();
        return result ?? null;
    } catch (error) {
        endTiming();
        throw error;
    }
};

// OPTIMIZED: Enhanced setDoc with validation
export const setDoc = async <T>(table: ObjectStoreName, key: IDBValidKey, data: T): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('setDoc');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await promisifyRequest(store.put(data, key), `set-${table}`);
        endTiming();
    } catch (error) {
        endTiming();
        throw error;
    }
};

// NEW: High-performance query with pagination
export const queryWithPagination = async <T>(
    table: ObjectStoreName,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    options: {
        limit?: number;
        offset?: number;
        direction?: 'next' | 'prev';
    } = {}
): Promise<{ data: T[]; hasMore: boolean; total?: number }> => {
    const { limit = 10, offset = 0, direction = 'next' } = options;
    const endTiming = dbPerfMonitor.startTiming('queryWithPagination');
    
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const index = store.index(indexName);
        
        const results: T[] = [];
        let currentOffset = 0;
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(query, direction);
            
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                
                if (!cursor) {
                    endTiming();
                    resolve({ 
                        data: results, 
                        hasMore: false,
                        total: currentOffset + results.length
                    });
                    return;
                }
                
                if (currentOffset >= offset) {
                    if (results.length < limit) {
                        results.push(cursor.value as T);
                    } else {
                        endTiming();
                        resolve({ 
                            data: results, 
                            hasMore: true
                        });
                        return;
                    }
                }
                
                currentOffset++;
                cursor.continue();
            };
            
            request.onerror = () => {
                endTiming();
                reject(new Error(`Pagination query failed for ${table}.${indexName}`));
            };
        });
    } catch (error) {
        endTiming();
        throw error;
    }
};

// OPTIMIZED: Performance-focused query functions
export const getStudentPerformanceBySubject = async (
    studentId: string,
    subject?: string,
    limit = 20
): Promise<PerformanceRecord[]> => {
    const database = await openDb();
    const tx = database.transaction('performance', 'readonly');
    const store = tx.objectStore('performance');
    const index = store.index('student_subject_date');
    
    const query = subject 
        ? IDBKeyRange.bound([studentId, subject], [studentId, subject, '\uffff'])
        : IDBKeyRange.bound([studentId], [studentId, '\uffff']);
    
    const results: PerformanceRecord[] = [];
    
    return new Promise((resolve, reject) => {
        const request = index.openCursor(query, 'prev'); // Most recent first
        
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && results.length < limit) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        
        request.onerror = () => reject(request.error);
    });
};

export const getStudentWeakAreas = async (studentId: string): Promise<{ subject: string; avgScore: number; count: number }[]> => {
    const performance = await getStudentPerformanceBySubject(studentId);
    const subjectStats = new Map<string, { totalScore: number; count: number }>();
    
    performance.forEach(record => {
        const subject = record.subject;
        const current = subjectStats.get(subject) || { totalScore: 0, count: 0 };
        subjectStats.set(subject, {
            totalScore: current.totalScore + record.score,
            count: current.count + 1
        });
    });
    
    return Array.from(subjectStats.entries())
        .map(([subject, stats]) => ({
            subject,
            avgScore: stats.totalScore / stats.count,
            count: stats.count
        }))
        .filter(item => item.avgScore < 75) // Below 75% considered weak
        .sort((a, b) => a.avgScore - b.avgScore); // Weakest first
};

// CACHE: Implement cache management for better performance
export const setCachedData = async (
    key: string, 
    data: any, 
    ttl = 5 * 60 * 1000, // 5 minutes default
    type = 'general'
): Promise<void> => {
    const cacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        type
    };
    
    await setDoc('cache', key, cacheEntry);
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
    try {
        const cacheEntry = await getDoc<any>('cache', key);
        
        if (!cacheEntry) return null;
        
        // Check if cache has expired
        if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
            // Remove expired cache entry
            await deleteDocInCollection('cache', key);
            return null;
        }
        
        return cacheEntry.data as T;
    } catch (error) {
        console.warn('Cache read failed:', error);
        return null;
    }
};

// MAINTENANCE: Cache cleanup utility
export const cleanupExpiredCache = async (): Promise<number> => {
    const database = await openDb();
    const tx = database.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('timestamp');
    
    let deletedCount = 0;
    const now = Date.now();
    
    return new Promise((resolve) => {
        const request = index.openCursor();
        
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const entry = cursor.value;
                if (now - entry.timestamp > entry.ttl) {
                    cursor.delete();
                    deletedCount++;
                }
                cursor.continue();
            } else {
                resolve(deletedCount);
            }
        };
    });
};

// Keep existing API but with performance improvements
export const addDocToCollection = async (table: ObjectStoreName, doc: any): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('addDoc');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await promisifyRequest(store.add(doc), `add-${table}`);
        endTiming();
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const queryCollectionByIndex = async <T>(
    table: ObjectStoreName, 
    indexName: string, 
    queryValue: IDBValidKey
): Promise<T[]> => {
    const endTiming = dbPerfMonitor.startTiming('queryByIndex');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const index = store.index(indexName);
        const result = await promisifyRequest<T[]>(index.getAll(queryValue), `query-${table}-${indexName}`);
        endTiming();
        return result ?? [];
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const updateDocInCollection = async (
    table: 'questions' | 'studyGoals' | 'users' | 'teachers' | 'parents', 
    key: IDBValidKey, 
    updatedDoc: any
): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('updateDoc');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await promisifyRequest(store.put(updatedDoc), `update-${table}`);
        endTiming();
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const deleteDocInCollection = async (table: ObjectStoreName, key: IDBValidKey): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('deleteDoc');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await promisifyRequest(store.delete(key), `delete-${table}`);
        endTiming();
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const getAllDocs = async <T>(table: ObjectStoreName): Promise<T[]> => {
    const endTiming = dbPerfMonitor.startTiming('getAllDocs');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const result = await promisifyRequest<T[]>(store.getAll(), `getAll-${table}`);
        endTiming();
        return result ?? [];
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const clearStore = async (table: ObjectStoreName): Promise<void> => {
    const endTiming = dbPerfMonitor.startTiming('clearStore');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await promisifyRequest(store.clear(), `clear-${table}`);
        endTiming();
    } catch (error) {
        endTiming();
        throw error;
    }
};

export const countDocs = async (table: ObjectStoreName): Promise<number> => {
    const endTiming = dbPerfMonitor.startTiming('countDocs');
    try {
        const database = await openDb();
        const tx = database.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const result = await promisifyRequest(store.count(), `count-${table}`);
        endTiming();
        return result;
    } catch (error) {
        endTiming();
        throw error;
    }
};

// NEW: Database health check for pilot readiness
export const getDatabaseHealth = async (): Promise<{
    isConnected: boolean;
    version: number;
    stores: string[];
    totalRecords: number;
    performanceStats: any;
    cacheStats: { size: number; expired: number };
}> => {
    try {
        const database = await openDb();
        const stores = Array.from(database.objectStoreNames);
        
        // Count total records across all stores
        let totalRecords = 0;
        for (const store of stores) {
            try {
                totalRecords += await countDocs(store as ObjectStoreName);
            } catch {
                // Skip stores that might have issues
            }
        }
        
        // Check cache health
        const cacheSize = await countDocs('cache');
        const expiredCacheCount = await cleanupExpiredCache();
        
        return {
            isConnected: true,
            version: database.version,
            stores,
            totalRecords,
            performanceStats: dbPerfMonitor.getStats(),
            cacheStats: {
                size: cacheSize - expiredCacheCount,
                expired: expiredCacheCount
            }
        };
    } catch (error) {
        return {
            isConnected: false,
            version: 0,
            stores: [],
            totalRecords: 0,
            performanceStats: {},
            cacheStats: { size: 0, expired: 0 }
        };
    }
};

// UTILITY: Database performance diagnostics
export const logDatabasePerformance = () => {
    if (process.env.NODE_ENV === 'development') {
        console.group('🗄️ Database Performance Report');
        const stats = dbPerfMonitor.getStats();
        Object.entries(stats).forEach(([operation, data]) => {
            console.log(`${operation}: ${data.avg.toFixed(1)}ms avg (${data.count} ops, max: ${data.max.toFixed(1)}ms)`);
        });
        console.groupEnd();
    }
};

// AUTO: Run cache cleanup periodically
if (typeof window !== 'undefined') {
    // Run cleanup every 10 minutes
    setInterval(() => {
        cleanupExpiredCache().then(count => {
            if (count > 0) {
                console.log(`🧹 Cleaned up ${count} expired cache entries`);
            }
        }).catch(error => {
            console.warn('Cache cleanup failed:', error);
        });
    }, 10 * 60 * 1000);
    
    // Log performance stats every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
        setInterval(logDatabasePerformance, 5 * 60 * 1000);
    }
}