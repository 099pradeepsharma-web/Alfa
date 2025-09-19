// This service acts as a data access layer for student-specific information,
// persisting data to the local browser storage (IndexedDB).
// The name 'pineconeService' is a legacy name.
import { LearningModule, ChapterProgress, StudentQuestion, PerformanceRecord, AIFeedback, LearningStreak } from '../types';
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

// --- New Learning Streak Logic ---
const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

const getYesterdayDateString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Retrieves the learning streak for a student.
 * @param userId The ID of the student.
 * @returns A promise that resolves to the LearningStreak object or null.
 */
export const getLearningStreak = async (userId: number): Promise<LearningStreak | null> => {
    const streakKey = `streak-${userId}`;
    const streakData = await db.getDoc<LearningStreak>('cache', streakKey);

    // If streak is from before yesterday, it's broken.
    if (streakData && streakData.lastDate < getYesterdayDateString()) {
        return { count: 0, lastDate: streakData.lastDate };
    }
    return streakData;
}


/**
 * Saves a new performance record and updates the learning streak.
 * @param userId The ID of the student.
 * @param newRecord The PerformanceRecord object to save.
 */
export const savePerformanceRecord = async (userId: number, newRecord: PerformanceRecord): Promise<void> => {
    const streakKey = `streak-${userId}`;
    const todayStr = getTodayDateString();

    const currentStreak = await db.getDoc<LearningStreak>('cache', streakKey);

    if (!currentStreak || currentStreak.lastDate < getYesterdayDateString()) {
        // Start a new streak or reset a broken one
        await db.setDoc<LearningStreak>('cache', streakKey, { count: 1, lastDate: todayStr });
    } else if (currentStreak.lastDate === getYesterdayDateString()) {
        // Continue the streak
        await db.setDoc<LearningStreak>('cache', streakKey, { count: currentStreak.count + 1, lastDate: todayStr });
    }
    // If lastDate is today, do nothing.

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
 * Retrieves a cached video Blob from the database.
 * @param key The unique key for the video.
 * @returns A Promise that resolves to the video Blob or null.
 */
export const getVideo = async (key: string): Promise<Blob | null> => {
  return db.getDoc<Blob>('videos', key);
};

/**
 * Saves a generated video Blob to the database.
 * @param key The unique key for the video.
 * @param blob The video Blob to save.
 */
export const saveVideo = async (key: string, blob: Blob): Promise<void> => {
  await db.setDoc<Blob>('videos', key, blob);
};

/**
 * Retrieves a cached concept map URL from the database.
 * @param key The unique key for the concept map.
 * @returns A Promise that resolves to the concept map's data URL string or null.
 */
export const getConceptMap = async (key: string): Promise<string | null> => {
  return db.getDoc<string>('conceptMaps', key);
};

/**
 * Saves a generated concept map's data URL to the database.
 * @param key The unique key for the concept map.
 * @param dataUrl The base64 data URL of the concept map to save.
 */
export const saveConceptMap = async (key: string, dataUrl: string): Promise<void> => {
  await db.setDoc<string>('conceptMaps', key, dataUrl);
};


/**
 * Saves AI content feedback to the database.
 * @param feedback The AIFeedback object to save.
 */
export const saveAIFeedback = async (feedback: AIFeedback): Promise<void> => {
    await db.addDocToCollection('feedback', feedback);
};

/**
 * Checks if the well-being module has been assigned to a student.
 * @param studentId The ID of the student.
 * @returns A promise that resolves to true if assigned, false otherwise.
 */
export const getWellbeingModuleStatus = async (studentId: number): Promise<boolean> => {
    const key = `wellbeing-assigned-${studentId}`;
    const status = await db.getDoc<boolean>('cache', key);
    return status === true;
};

/**
 * Sets the assignment status of the well-being module for a student.
 * @param studentId The ID of the student.
 * @param isAssigned The assignment status.
 */
export const setWellbeingModuleStatus = async (studentId: number, isAssigned: boolean): Promise<void> => {
    const key = `wellbeing-assigned-${studentId}`;
    await db.setDoc('cache', key, isAssigned);
};