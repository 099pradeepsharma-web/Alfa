import { StudentQuestion, PerformanceRecord, AIFeedback, Achievement, StudyGoal } from '../types';

const DB_NAME = 'AlfanumrikDB';
const DB_VERSION = 4; // Incremented version to add new indexes
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
 * Throws an AbortError if the signal is aborted.
 */
const checkAborted = (signal?: AbortSignal) => {
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }
};

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
            const transaction = (event.target as IDBOpenDBRequest).transaction;

            // Handle creation of stores if they don't exist
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
                             const teacherStore = tempDb.createObjectStore('teachers', { keyPath: 'id' });
                             teacherStore.createIndex('email', 'email', { unique: true });
                             break;
                        case 'parents':
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
            
            // Handle index upgrades for version 4
            if (event.oldVersion < 4 && transaction) {
                try {
                    const performanceStore = transaction.objectStore('performance');
                    if (!performanceStore.indexNames.contains('student_subject_date')) {
                        performanceStore.createIndex('student_subject_date', ['studentId', 'subject', 'completedDate']);
                    }
                    if (!performanceStore.indexNames.contains('score_date')) {
                        performanceStore.createIndex('score_date', ['score', 'completedDate']);
                    }

                    const questionsStore = transaction.objectStore('questions');
                    if (!questionsStore.indexNames.contains('student_concept')) {
                        questionsStore.createIndex('student_concept', ['studentId', 'concept']);
                    }
                    if (!questionsStore.indexNames.contains('subject_chapter')) {
                        questionsStore.createIndex('subject_chapter', ['subject', 'chapter']);
                    }
                } catch (e) {
                    console.error("Error creating indexes for v4:", e);
                }
            }
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
export const getDoc = async <T>(table: ObjectStoreName, key: IDBValidKey, signal?: AbortSignal): Promise<T | null> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest<T>(store.get(key));
    checkAborted(signal);
    return result ?? null;
};

/**
 * Sets (creates or overwrites) a document in a table.
 */
export const setDoc = async <T>(table: ObjectStoreName, key: IDBValidKey, data: T, signal?: AbortSignal): Promise<void> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.put(data, key));
    checkAborted(signal);
};

/**
 * Adds a document to a collection (table).
 */
export const addDocToCollection = async (table: ObjectStoreName, doc: any, signal?: AbortSignal): Promise<void> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.add(doc));
    checkAborted(signal);
};

/**
 * Queries a collection using an index for high performance.
 */
export const queryCollectionByIndex = async <T>(
    table: ObjectStoreName, 
    indexName: string, 
    queryValue: IDBValidKey,
    signal?: AbortSignal
): Promise<T[]> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const index = store.index(indexName);
    const result = await promisifyRequest<T[]>(index.getAll(queryValue));
    checkAborted(signal);
    return result ?? [];
};

/**
 * Updates a document in a collection by its key.
 */
export const updateDocInCollection = async (table: 'questions' | 'studyGoals' | 'users' | 'teachers' | 'parents', key: IDBValidKey, updatedDoc: any, signal?: AbortSignal): Promise<void> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.put(updatedDoc));
    checkAborted(signal);
};

/**
 * Deletes a document from a collection by its key.
 */
export const deleteDocInCollection = async (table: ObjectStoreName, key: IDBValidKey, signal?: AbortSignal): Promise<void> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.delete(key));
    checkAborted(signal);
};

/**
 * Gets all documents from a table.
 */
export const getAllDocs = async <T>(table: ObjectStoreName, signal?: AbortSignal): Promise<T[]> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest<T[]>(store.getAll());
    checkAborted(signal);
    return result ?? [];
};

/**
 * Clears all documents from an object store.
 */
export const clearStore = async (table: ObjectStoreName, signal?: AbortSignal): Promise<void> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.clear());
    checkAborted(signal);
};

/**
 * Counts the number of documents in a store.
 */
export const countDocs = async (table: ObjectStoreName, signal?: AbortSignal): Promise<number> => {
    checkAborted(signal);
    const db = await openDb();
    checkAborted(signal);
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest(store.count());
    checkAborted(signal);
    return result;
};

export const getPerformanceBySubject = async (
  studentId: string, 
  subject: string, 
  limit = 10
): Promise<PerformanceRecord[]> => {
  const db = await openDb();
  const tx = db.transaction('performance', 'readonly');
  const store = tx.objectStore('performance');
  const index = store.index('student_subject_date');
  
  // Use cursor for better memory efficiency
  const results: PerformanceRecord[] = [];
  const request = index.openCursor(IDBKeyRange.bound([studentId, subject], [studentId, subject, '\uffff']));
  
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
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