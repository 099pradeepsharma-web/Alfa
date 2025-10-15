import { StudentQuestion, PerformanceRecord, AIFeedback, Achievement, StudyGoal } from '../types';

const DB_NAME = 'AlfanumrikDB';
const DB_VERSION = 3; // Incremented version to add user stores
let db: IDBDatabase;

// List of "tables" in our database
const STORES = [
    'modules', 
    'reports', 
    'progress', 
    'questions', 
    'performance', 
    'diagrams', 
    'feedback', 
    'cache',
    'videos',
    'conceptMaps',
    'achievements',
    'studyGoals',
    'users',
    'teachers',
    'parents'
];

/**
 * Opens and initializes the IndexedDB database.
 * This function ensures the database is ready for transactions.
 */
const openDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            STORES.forEach(storeName => {
                if (!tempDb.objectStoreNames.contains(storeName)) {
                    // Define key paths and indexes for specific stores
                    switch(storeName) {
                        case 'questions':
                            const questionStore = tempDb.createObjectStore('questions', { keyPath: 'id' });
                            questionStore.createIndex('studentId', 'studentId', { unique: false });
                            break;
                        case 'performance':
                            const perfStore = tempDb.createObjectStore('performance', { autoIncrement: true });
                            perfStore.createIndex('studentId', 'studentId', { unique: false });
                            break;
                        case 'feedback':
                            tempDb.createObjectStore('feedback', { keyPath: 'id' });
                            break;
                        case 'achievements':
                             const achievementStore = tempDb.createObjectStore('achievements', { autoIncrement: true });
                             achievementStore.createIndex('studentId', 'studentId', { unique: false });
                             break;
                        case 'studyGoals':
                            const goalStore = tempDb.createObjectStore('studyGoals', { keyPath: 'id' });
                            goalStore.createIndex('studentId', 'studentId', { unique: false });
                            break;
                        case 'users':
                            const userStore = tempDb.createObjectStore('users', { keyPath: 'id' });
                            userStore.createIndex('email', 'email', { unique: true });
                            break;
                        case 'teachers':
                             // FIX: Added email index for consistency and to prevent duplicate entries.
                             const teacherStore = tempDb.createObjectStore('teachers', { keyPath: 'id' });
                             teacherStore.createIndex('email', 'email', { unique: true });
                             break;
                        case 'parents':
                             // FIX: Added email index for consistency and to prevent duplicate entries.
                             const parentStore = tempDb.createObjectStore('parents', { keyPath: 'id' });
                             parentStore.createIndex('email', 'email', { unique: true });
                             break;
                        default:
                            // For simple key-value stores
                            tempDb.createObjectStore(storeName);
                            break;
                    }
                }
            });
        };
    });
};

// Generic promise-based wrapper for IDB requests to simplify async operations.
const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// --- API Implementation using IndexedDB ---

type ObjectStoreName = typeof STORES[number];

/**
 * Gets a document from a table by its key.
 */
export const getDoc = async <T>(table: ObjectStoreName, key: IDBValidKey): Promise<T | null> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest<T>(store.get(key));
    return result ?? null;
};

/**
 * Sets (creates or overwrites) a document in a table.
 */
export const setDoc = async <T>(table: ObjectStoreName, key: IDBValidKey, data: T): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.put(data, key));
};

/**
 * Adds a document to a collection (table).
 */
export const addDocToCollection = async (table: ObjectStoreName, doc: any): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.add(doc));
};

/**
 * Queries a collection using an index for high performance.
 */
export const queryCollectionByIndex = async <T>(
    table: ObjectStoreName, 
    indexName: string, 
    queryValue: IDBValidKey
): Promise<T[]> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const index = store.index(indexName);
    const result = await promisifyRequest<T[]>(index.getAll(queryValue));
    return result ?? [];
};

/**
 * Updates a document in a collection by its key.
 */
export const updateDocInCollection = async (table: 'questions' | 'studyGoals' | 'users' | 'teachers' | 'parents', key: IDBValidKey, updatedDoc: any): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.put(updatedDoc));
};

/**
 * Deletes a document from a collection by its key.
 */
export const deleteDocInCollection = async (table: ObjectStoreName, key: IDBValidKey): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.delete(key));
};

/**
 * Gets all documents from a table.
 */
export const getAllDocs = async <T>(table: ObjectStoreName): Promise<T[]> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest<T[]>(store.getAll());
    return result ?? [];
};

/**
 * Clears all documents from an object store.
 */
export const clearStore = async (table: ObjectStoreName): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.clear());
};

/**
 * Counts the number of documents in a store.
 */
export const countDocs = async (table: ObjectStoreName): Promise<number> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    return await promisifyRequest(store.count());
};