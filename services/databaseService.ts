import { User, StudentQuestion, PerformanceRecord, AIFeedback } from '../types';

const DB_NAME = 'AlfanumrikDB';
const DB_VERSION = 1;
let db: IDBDatabase;

// List of "tables" in our database
const STORES = [
    'users', 
    'modules', 
    'reports', 
    'progress', 
    'questions', 
    'performance', 
    'diagrams', 
    'feedback', 
    'cache',
    'videos',
    'conceptMaps'
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
                        case 'users':
                            const userStore = tempDb.createObjectStore('users', { keyPath: 'id' });
                            userStore.createIndex('email', 'email', { unique: true });
                            break;
                        case 'questions':
                            const questionStore = tempDb.createObjectStore('questions', { keyPath: 'id' });
                            questionStore.createIndex('studentId', 'studentId', { unique: false });
                            break;
                        case 'performance':
                            // Using autoIncrement as PerformanceRecord has no unique ID
                            const perfStore = tempDb.createObjectStore('performance', { autoIncrement: true });
                            perfStore.createIndex('studentId', 'studentId', { unique: false });
                            break;
                        case 'feedback':
                            tempDb.createObjectStore('feedback', { keyPath: 'id' });
                            break;
                        default:
                            // For simple key-value stores like modules, reports, etc.
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

type ObjectTables = 'modules' | 'reports' | 'progress' | 'diagrams' | 'cache' | 'videos' | 'conceptMaps';
type ArrayTables = 'users' | 'questions' | 'performance' | 'feedback';

/**
 * Gets a document from an object-based table by its ID.
 */
export const getDoc = async <T>(table: ObjectTables | 'users', id: string | number): Promise<T | null> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const result = await promisifyRequest<T>(store.get(id as any)); // `any` for key flexibility
    return result ?? null;
};

/**
 * Sets (creates or overwrites) a document in an object-based table.
 */
export const setDoc = async <T>(table: ObjectTables, id: string, data: T): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.put(data, id));
};

/**
 * Adds a document to a collection (array-based table).
 */
export const addDocToCollection = async (table: ArrayTables, doc: any): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await promisifyRequest(store.add(doc));
};

/**
 * Queries a collection (array-based table) for documents matching a predicate.
 * This performs a full table scan and filters in memory, similar to the old implementation,
 * but is much more efficient as it doesn't parse the entire DB string.
 */
export const queryCollection = async <T>(table: ArrayTables, predicate: (item: T) => boolean): Promise<T[]> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    const allItems = await promisifyRequest<T[]>(store.getAll());
    return allItems.filter(predicate);
};

/**
 * Updates a document in the 'questions' collection by finding it via ID and replacing it.
 */
export const updateDocInCollection = async (table: 'questions', id: string, updatedDoc: StudentQuestion): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    // put() will update if key exists, which is ideal here.
    await promisifyRequest(store.put(updatedDoc));
};

// --- User specific helpers, now optimized with indexes ---
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const db = await openDb();
    const tx = db.transaction('users', 'readonly');
    const store = tx.objectStore('users');
    const index = store.index('email');
    const result = await promisifyRequest<User>(index.get(email.toLowerCase()));
    return result ?? null;
};

export const findUserById = async (id: number): Promise<User | null> => {
    return getDoc<User>('users', id);
};


export const addUser = async (user: User): Promise<void> => {
    await addDocToCollection('users', user);
};