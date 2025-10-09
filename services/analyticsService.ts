import { Student } from '../types';

/**
 * This service simulates a real analytics pipeline (like Segment, Amplitude, or a custom one).
 * For this implementation, it logs structured event data to the console for easy inspection.
 * This demonstrates the instrumentation required for the A/B test analysis.
 */

interface EventAttributes {
  user_id: string;
  timestamp: string;
  experiment_id: string;
  variant: 'A' | 'B';
  [key: string]: any; // For additional event-specific properties
}

export const logEvent = (eventName: string, student: Student, experimentId: string, variant: 'A' | 'B', additionalAttributes: Record<string, any> = {}) => {
    
    const eventData: EventAttributes = {
        user_id: student.id,
        timestamp: new Date().toISOString(),
        experiment_id: experimentId,
        variant: variant,
        grade: student.grade,
        ...additionalAttributes,
    };

    console.log(`[ANALYTICS EVENT: ${eventName}]`, eventData);
};
