import { LearningModule, ChapterProgress, StudentQuestion, PerformanceRecord, AIFeedback } from '../types';
import * as db from './databaseService';

/**
 * Retrieves a learning module from the database.
 * @param key - The base identifier for the content.
 * @param language - The language of the content to retrieve.
 * @returns A Promise that resolves to the LearningModule or null.
 */
export const getLearningModule = async (key: string, language: string): Promise<LearningModule | null> => {
  const langKey = `${key}-${language}`;
  return db.getDoc<LearningModule>('modules', langKey);
};

/**
 * Saves a learning module to the database.
 * @param key - The base identifier for the content.
 * @param data - The LearningModule object to save.
 * @param language - The language of the content.
 */
export const saveLearningModule = async (key: string, data: LearningModule, language: string): Promise<void> => {
  const langKey = `${key}-${language}`;
  await db.setDoc<LearningModule>('modules', langKey, data);
};

/**
 * Retrieves a generated report from the database.
 * @param studentId The ID of the student.
 * @param userRole The role of the user requesting the report ('teacher' or 'parent').
 * @param language The language of the report.
 * @returns A Promise that resolves to the report string or null.
 */
export const getReport = async (studentId: number, userRole: 'teacher' | 'parent', language: string): Promise<string | null> => {
    const key = `report-${userRole}-${studentId}-${language}`;
    return db.getDoc<string>('reports', key);
}

/**
 * Saves a generated report to the database.
 * @param studentId The ID of the student.
 * @param userRole The role of the user for whom the report was generated.
 * @param reportText The text of the report to save.
 * @param language The language of the report.
 */
export const saveReport = async (studentId: number, userRole: 'teacher' | 'parent', reportText: string, language: string): Promise<void> => {
    const key = `report-${userRole}-${studentId}-${language}`;
    await db.setDoc<string>('reports', key, reportText);
}

/**
 * Retrieves performance records for a student from the database.
 * @param userId The ID of the student.
 * @returns A promise that resolves to an array of performance records.
 */
export const getPerformanceRecords = async (userId: number): Promise<PerformanceRecord[]> => {
    type StoredPerformanceRecord = PerformanceRecord & { studentId: number };
    return await db.queryCollection<StoredPerformanceRecord>('performance', (record) => record.studentId === userId);
};

/**
 * Saves a new performance record to the database for a specific student.
 * @param userId The ID of the student.
 * @param newRecord The PerformanceRecord object to save.
 */
export const savePerformanceRecord = async (userId: number, newRecord: PerformanceRecord): Promise<void> => {
    const recordToSave = { ...newRecord, studentId: userId };
    await db.addDocToCollection('performance', recordToSave);
};

/**
 * Retrieves chapter progress data from the database.
 * @param key The unique key for the chapter progress.
 * @param language The language context for the progress.
 * @returns A Promise that resolves to the ChapterProgress object or null.
 */
export const getChapterProgress = async (key: string, language: string): Promise<ChapterProgress | null> => {
    const langKey = `${key}-${language}`;
    return db.getDoc<ChapterProgress>('progress', langKey);
};

/**
 * Saves chapter progress data to the database.
 * @param key The unique key for the chapter progress.
 * @param progress The ChapterProgress object to save.
 * @param language The language context for the progress.
 */
export const saveChapterProgress = async (key: string, progress: ChapterProgress, language: string): Promise<void> => {
    const langKey = `${key}-${language}`;
    await db.setDoc<ChapterProgress>('progress', langKey, progress);
};

// --- New Functions for Student Q&A ---

/**
 * Retrieves all questions for a specific student from the database.
 * @param userId The ID of the student whose questions to retrieve.
 * @param language The language of the questions (currently unused in this implementation but kept for API consistency).
 * @returns A promise that resolves to an array of questions for that student.
 */
export const getStudentQuestions = async (userId: number, language: string): Promise<StudentQuestion[]> => {
    // language is not needed for querying the central collection, but kept for API consistency.
    return await db.queryCollection<StudentQuestion>('questions', (q) => q.studentId === userId);
};

/**
 * Saves a new student question to the database.
 * @param question The StudentQuestion object to save.
 * @param language The language of the question (currently unused in this implementation but kept for API consistency).
 */
export const saveStudentQuestion = async (question: StudentQuestion, language: string): Promise<void> => {
    // language is not needed for saving to the central collection.
    await db.addDocToCollection('questions', question);
};

/**
 * Updates a student question in the database (e.g., to add Fitto's response).
 * @param updatedQuestion The full, updated StudentQuestion object.
 * @param language The language of the question (currently unused in this implementation but kept for API consistency).
 */
export const updateStudentQuestion = async (updatedQuestion: StudentQuestion, language: string): Promise<void> => {
    // language is not needed for updating in the central collection.
    await db.updateDocInCollection('questions', updatedQuestion.id, updatedQuestion);
};


/**
 * Retrieves a cached diagram URL from the database.
 * @param key The unique key for the diagram.
 * @returns A Promise that resolves to the diagram's data URL string or null.
 */
export const getDiagram = async (key: string): Promise<string | null> => {
  return db.getDoc<string>('diagrams', key);
};

/**
 * Saves a generated diagram's data URL to the database.
 * @param key The unique key for the diagram.
 * @param dataUrl The base64 data URL of the diagram to save.
 */
export const saveDiagram = async (key: string, dataUrl: string): Promise<void> => {
  await db.setDoc<string>('diagrams', key, dataUrl);
};

/**
 * Saves AI content feedback to the database.
 * @param feedback The AIFeedback object to save.
 */
export const saveAIFeedback = async (feedback: AIFeedback): Promise<void> => {
    await db.addDocToCollection('feedback', feedback);
};