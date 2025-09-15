import { Grade } from '../types';
import { CURRICULUM as staticCurriculum } from '../data/curriculum';
import * as db from './databaseService';

const CURRICULUM_CACHE_KEY = 'curriculum_data';
const CURRICULUM_VERSION_KEY = 'curriculum_version';
// This version should be incremented if curriculum.ts is ever updated.
const CURRENT_CURRICULUM_VERSION = '1.0';

/**
 * Retrieves the curriculum, using a cached version if available and up-to-date.
 * This improves performance on subsequent loads by avoiding re-parsing the large curriculum object.
 * @returns A Promise that resolves to the curriculum array.
 */
export const getCurriculum = async (): Promise<Grade[]> => {
    try {
        const cachedVersion = await db.getDoc<string>('cache', CURRICULUM_VERSION_KEY);
        
        if (cachedVersion === CURRENT_CURRICULUM_VERSION) {
            const cachedCurriculum = await db.getDoc<Grade[]>('cache', CURRICULUM_CACHE_KEY);
            if (cachedCurriculum) {
                console.log("Loading curriculum from cache.");
                return cachedCurriculum;
            }
        }

        // If cache is old, invalid, or doesn't exist, load from static and update cache.
        console.log("Loading curriculum from static source and caching.");
        await db.setDoc<Grade[]>('cache', CURRICULUM_CACHE_KEY, staticCurriculum);
        await db.setDoc<string>('cache', CURRICULUM_VERSION_KEY, CURRENT_CURRICULUM_VERSION);

        return staticCurriculum;

    } catch (error) {
        console.error("Error managing curriculum cache, falling back to static version:", error);
        // Fallback to static import in case of any storage errors
        return staticCurriculum;
    }
};
