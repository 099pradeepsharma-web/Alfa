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
