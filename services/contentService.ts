

import { LearningModule, Student } from '../types';
import * as geminiService from './geminiService';
import * as pineconeService from './pineconeService';

// This is a placeholder for a real pre-generated content store (e.g., JSON files in a CDN)
// It also serves as a simple in-memory cache for the current session to reduce localStorage reads.
const IN_MEMORY_STORE: { [key: string]: LearningModule } = {};

const generateDbKey = (grade: string, subject: string, chapter: string, language: string) => 
    `module-${grade}-${subject}-${chapter}-${language}`;

/**
 * Production-ready content fetching service.
 * Implements a multi-layer caching strategy to optimize for scale and reduce API calls:
 * 1. In-memory session cache (fastest)
 * 2. Persistent local storage cache (via pineconeService)
 * 3. Dynamic generation (via geminiService) with a robust fallback.
 *
 * @returns An object containing the content and a boolean indicating if it was from a cache.
 */
export const getChapterContent = async (
    grade: string, 
    subject: string, 
    chapter: string, 
    student: Student, 
    language: string
): Promise<{content: LearningModule, fromCache: boolean}> => {
    const dbKey = generateDbKey(grade, subject, chapter, language);

    // Layer 1: Check in-memory session cache
    if (IN_MEMORY_STORE[dbKey]) {
        return { content: IN_MEMORY_STORE[dbKey], fromCache: true };
    }

    // Layer 2: Check persistent local storage cache
    const cachedContent = await pineconeService.getLearningModule(dbKey, language);
    if (cachedContent) {
        IN_MEMORY_STORE[dbKey] = cachedContent; // Populate in-memory cache for subsequent requests in the same session
        return { content: cachedContent, fromCache: true };
    }

    // Layer 3: Dynamic generation with fallback for production readiness
    try {
        const generatedContent = await geminiService.getChapterContent(grade, subject, chapter, student.name, language);
        // Save to both caches for future requests
        await pineconeService.saveLearningModule(dbKey, generatedContent, language);
        IN_MEMORY_STORE[dbKey] = generatedContent;
        return { content: generatedContent, fromCache: false };
    } catch (error) {
        console.error(`Critical error: AI content generation failed for ${dbKey}.`, error);
        
        // Fallback to a minimal, offline-friendly content structure to ensure app doesn't crash
        const fallbackContent: LearningModule = {
            chapterTitle: chapter,
            introduction: "We're having trouble connecting to our AI to generate this lesson. Please check your internet connection and try again. The app will continue to work in offline mode if you have viewed this content before.",
            learningObjectives: ["Understand the key terms of this chapter.", "Practice related questions when online."],
            keyConcepts: [{
                conceptTitle: "Core Concept",
                explanation: "Content is temporarily unavailable. This may be due to a connection issue or high demand on our AI services. Please try again in a few moments.",
                realWorldExample: "N/A",
                diagramDescription: "N/A"
            }],
            summary: "Content is temporarily unavailable."
        };
        return { content: fallbackContent, fromCache: false };
    }
};


/**
 * Updates a chapter's content in both the in-memory and persistent cache.
 * Used after lazily loading a new section.
 */
export const updateChapterContent = async (
    grade: string, 
    subject: string, 
    chapter: string, 
    language: string,
    updatedModule: LearningModule
): Promise<void> => {
    const dbKey = generateDbKey(grade, subject, chapter, language);
    IN_MEMORY_STORE[dbKey] = updatedModule;
    await pineconeService.saveLearningModule(dbKey, updatedModule, language);
};