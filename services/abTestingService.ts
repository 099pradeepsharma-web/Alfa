/**
 * This service handles the assignment of users to A/B test variants.
 * It ensures that a user is deterministically and persistently assigned to a variant.
 */

type Variant = 'A' | 'B';
const EXPERIMENT_STORAGE_PREFIX = 'alfanumrik-experiment-';

/**
 * A simple hashing function to convert a string to a number.
 * Used for deterministic assignment.
 */
const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

/**
 * Assigns a user to a variant for a given experiment.
 * First, it checks localStorage for a previously assigned variant.
 * If not found, it deterministically assigns one based on a hash of the user ID
 * and stores it in localStorage for future sessions.
 * 
 * @param userId The unique ID of the user.
 * @param experimentId The unique ID for the experiment.
 * @returns 'A' or 'B' for the assigned variant.
 */
export const assignVariant = (userId: string, experimentId: string): Variant => {
    const storageKey = `${EXPERIMENT_STORAGE_PREFIX}${experimentId}-${userId}`;

    // 1. Check for a stored variant first
    try {
        const storedVariant = localStorage.getItem(storageKey);
        if (storedVariant === 'A' || storedVariant === 'B') {
            return storedVariant;
        }
    } catch (e) {
        console.error("Could not access localStorage for A/B testing.", e);
        // Fallback to non-persistent assignment if localStorage is unavailable
        const hash = simpleHash(userId + experimentId);
        return hash % 2 === 0 ? 'A' : 'B';
    }


    // 2. If not stored, assign deterministically
    const hashValue = simpleHash(userId + experimentId);
    const assignedVariant: Variant = hashValue % 2 === 0 ? 'A' : 'B'; // 50/50 split

    // 3. Store the new assignment
    try {
        localStorage.setItem(storageKey, assignedVariant);
    } catch (e) {
        console.error("Failed to save experiment variant to localStorage", e);
    }

    return assignedVariant;
};
