import { LearningModule, ChapterProgress, StudentQuestion, PerformanceRecord, AIFeedback, User } from '../types';

const DB_KEY = 'alfanumrik_db';

// Internal types for storage, as collections need identifiers to query
type StoredPerformanceRecord = PerformanceRecord & { studentId: number };
type StoredStudentQuestion = StudentQuestion;
type StoredAIFeedback = AIFeedback;


interface DbSchema {
    users: User[];
    modules: { [key: string]: LearningModule };
    reports: { [key: string]: string };
    progress: { [key: string]: ChapterProgress };
    questions: StoredStudentQuestion[];
    performance: StoredPerformanceRecord[];
    diagrams: { [key: string]: string };
    feedback: StoredAIFeedback[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initDb = () => {
    if (!localStorage.getItem(DB_KEY)) {
        const initialDb: DbSchema = {
            users: [],
            modules: {},
            reports: {},
            progress: {},
            questions: [],
            performance: [],
            diagrams: {},
            feedback: [],
        };
        localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    }
};

const readDb = async (): Promise<DbSchema> => {
    await delay(50); // Simulate async read
    const dbString = localStorage.getItem(DB_KEY);
    // This should ideally not happen after init, but it's a good safeguard.
    if (!dbString) {
        initDb();
        return JSON.parse(localStorage.getItem(DB_KEY)!);
    }
    const db = JSON.parse(dbString);
    // Patch for users with an older DB schema
    if (!db.users) db.users = [];
    if (!db.feedback) db.feedback = [];
    
    return db;
};

const writeDb = async (db: DbSchema): Promise<void> => {
    await delay(50); // Simulate async write
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Initialize DB on script load to ensure it exists
initDb();

// --- API ---

type ObjectTables = 'modules' | 'reports' | 'progress' | 'diagrams';
type ArrayTables = 'users' | 'questions' | 'performance' | 'feedback';

/**
 * Gets a document from an object-based table by its ID.
 */
export const getDoc = async <T>(table: ObjectTables, id: string): Promise<T | null> => {
    const db = await readDb();
    const tableData = db[table] as { [key: string]: T };
    return tableData?.[id] || null;
};

/**
 * Sets (creates or overwrites) a document in an object-based table.
 */
export const setDoc = async <T>(table: ObjectTables, id: string, data: T): Promise<void> => {
    const db = await readDb();
    const tableData = db[table] as { [key:string]: T };
    tableData[id] = data;
    await writeDb(db);
};

/**
 * Adds a document to a collection (array-based table).
 */
export const addDocToCollection = async (table: ArrayTables, doc: any): Promise<void> => {
    const db = await readDb();
    (db[table] as any[]).push(doc);
    await writeDb(db);
};

/**
 * Queries a collection (array-based table) for documents matching a predicate.
 */
export const queryCollection = async <T>(table: ArrayTables, predicate: (item: T) => boolean): Promise<T[]> => {
    const db = await readDb();
    const collection = db[table] as T[];
    return collection.filter(predicate);
};

/**
 * Updates a document in the 'questions' collection by finding it via ID and replacing it.
 */
export const updateDocInCollection = async (table: 'questions', id: string, updatedDoc: StoredStudentQuestion): Promise<void> => {
    const db = await readDb();
    const collection = db[table] as StoredStudentQuestion[];
    const docIndex = collection.findIndex(doc => doc.id === id);
    if (docIndex !== -1) {
        collection[docIndex] = updatedDoc;
        await writeDb(db);
    }
};

// --- User specific helpers ---
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const db = await readDb();
    return db.users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
    const db = await readDb();
    return db.users.find(user => user.id === id) || null;
};


export const addUser = async (user: User): Promise<void> => {
    await addDocToCollection('users', user);
};