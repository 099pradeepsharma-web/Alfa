/**
 * Content Preloader for Alfanumrik
 * Intelligently preloads components and data based on user behavior
 */

import { ComponentType, lazy } from 'react';
import { getChapterContent, generateQuiz } from '../services/geminiService';
import { getCachedData, setCachedData } from '../services/optimizedDatabaseService';
import { Grade, Subject, Chapter, Student, Concept } from '../types';

interface PreloadableComponent {
    name: string;
    loader: () => Promise<{ default: ComponentType<any> }>;
    loaded: boolean;
    loading: boolean;
}

class ContentPreloader {
    private components = new Map<string, PreloadableComponent>();
    private contentCache = new Map<string, any>();
    private preloadQueue: string[] = [];
    private isProcessingQueue = false;

    constructor() {
        this.initializeComponents();
        this.startQueueProcessor();
    }

    private initializeComponents() {
        const componentMap = {
            'StudentDashboard': () => import('../screens/StudentDashboard'),
            'ChapterView': () => import('../components/ChapterView').then(m => ({ default: m.ChapterView })),
            'TutorSessionScreen': () => import('../screens/TutorSessionScreen').then(m => ({ default: m.TutorSessionScreen })),
            'QuizComponent': () => import('../components/QuizComponent'),
            'SubjectSelector': () => import('../components/SubjectSelector'),
            'GradeSelector': () => import('../components/GradeSelector'),
            'PersonalizedPathScreen': () => import('../screens/PersonalizedPathScreen'),
            'CompetitionScreen': () => import('../screens/CompetitionScreen'),
            'CareerGuidanceScreen': () => import('../screens/CareerGuidanceScreen'),
            'ExamPrepScreen': () => import('../screens/ExamPrepScreen'),
            'CognitiveTwinScreen': () => import('../screens/CognitiveTwinScreen')
        };

        Object.entries(componentMap).forEach(([name, loader]) => {
            this.components.set(name, {
                name,
                loader,
                loaded: false,
                loading: false
            });
        });
    }

    /**
     * Preload a component based on name
     */
    preloadComponent(componentName: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
        const component = this.components.get(componentName);
        if (!component || component.loaded || component.loading) {
            return Promise.resolve();
        }

        component.loading = true;
        
        const preloadPromise = component.loader()
            .then(() => {
                component.loaded = true;
                console.log(`✅ Preloaded component: ${componentName}`);
            })
            .catch(error => {
                console.warn(`Failed to preload component ${componentName}:`, error);
            })
            .finally(() => {
                component.loading = false;
            });

        return preloadPromise;
    }

    /**
     * Preload content data (chapter content, quizzes, etc.)
     */
    async preloadChapterContent(
        grade: string, 
        subject: string, 
        chapter: Chapter, 
        studentName: string, 
        language: string
    ): Promise<void> {
        const cacheKey = `chapter_${grade}_${subject}_${chapter.title}_${language}`;
        
        // Check if already cached
        const cached = await getCachedData(cacheKey);
        if (cached) {
            console.log(`✅ Chapter content already cached: ${chapter.title}`);
            return;
        }

        try {
            console.log(`🖼️ Preloading chapter content: ${chapter.title}`);
            const content = await getChapterContent(grade, subject, chapter, studentName, language);
            await setCachedData(cacheKey, content, 10 * 60 * 1000, 'chapter_content');
            console.log(`✅ Cached chapter content: ${chapter.title}`);
        } catch (error) {
            console.warn(`Failed to preload chapter content for ${chapter.title}:`, error);
        }
    }

    /**
     * Smart preloading based on current user context
     */
    preloadForUserContext(currentScreen: string, student: Student, currentGrade?: Grade, currentSubject?: Subject): void {
        const preloadStrategies: { [key: string]: () => void } = {
            'dashboard': () => {
                // Most likely next screens from dashboard
                this.queuePreload('SubjectSelector', 'high');
                this.queuePreload('PersonalizedPathScreen', 'normal');
                this.queuePreload('ChapterView', 'normal');
            },
            'browse': () => {
                // When browsing, likely to start learning
                this.queuePreload('ChapterView', 'high');
                this.queuePreload('TutorSessionScreen', 'normal');
                this.queuePreload('QuizComponent', 'normal');
            },
            'chapter': () => {
                // When viewing chapter, likely to take quiz or get tutor help
                this.queuePreload('QuizComponent', 'high');
                this.queuePreload('TutorSessionScreen', 'high');
            },
            'quiz': () => {
                // After quiz, might want tutor or go back to dashboard
                this.queuePreload('TutorSessionScreen', 'normal');
                this.queuePreload('StudentDashboard', 'low');
            },
            'tutor': () => {
                // From tutor, might take quiz or return to chapter
                this.queuePreload('QuizComponent', 'normal');
                this.queuePreload('ChapterView', 'low');
            }
        };

        const strategy = preloadStrategies[currentScreen];
        if (strategy) {
            // Delay preloading to not interfere with current page load
            setTimeout(strategy, 1500);
        }

        // Grade-specific preloading
        if (student.grade === 'Class 10' || student.grade === 'Class 12') {
            // Board exam students likely to use exam prep
            this.queuePreload('ExamPrepScreen', 'low');
        }
        
        if (parseInt(student.grade.replace('Class ', '')) >= 8) {
            // Older students likely to use career guidance
            this.queuePreload('CareerGuidanceScreen', 'low');
            this.queuePreload('CompetitionScreen', 'low');
        }
    }

    /**
     * Preload next likely chapters based on curriculum progression
     */
    preloadNextChapters(
        currentChapter: Chapter, 
        currentSubject: Subject, 
        student: Student, 
        language: string
    ): void {
        const currentIndex = currentSubject.chapters.findIndex(c => c.title === currentChapter.title);
        
        // Preload next 2 chapters in the same subject
        for (let i = 1; i <= 2; i++) {
            const nextChapter = currentSubject.chapters[currentIndex + i];
            if (nextChapter) {
                setTimeout(() => {
                    this.preloadChapterContent(
                        student.grade, 
                        currentSubject.name, 
                        nextChapter, 
                        student.name, 
                        language
                    );
                }, i * 3000); // Stagger preloading
            }
        }
    }

    /**
     * Queue-based preloading to prevent overwhelming the browser
     */
    private queuePreload(componentName: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
        if (priority === 'high') {
            this.preloadQueue.unshift(componentName);
        } else {
            this.preloadQueue.push(componentName);
        }
        
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.preloadQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.preloadQueue.length > 0) {
            const componentName = this.preloadQueue.shift()!;
            
            try {
                await this.preloadComponent(componentName);
                // Small delay between preloads to prevent blocking
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.warn(`Failed to preload ${componentName}:`, error);
            }
        }

        this.isProcessingQueue = false;
    }

    private startQueueProcessor(): void {
        // Process queue periodically
        setInterval(() => {
            this.processQueue();
        }, 2000);
    }

    /**
     * Preload critical components for immediate app startup
     */
    preloadCriticalComponents(): Promise<void[]> {
        const criticalComponents = [
            'StudentDashboard',
            'SubjectSelector', 
            'GradeSelector'
        ];

        console.log('🚀 Preloading critical components...');
        
        return Promise.all(
            criticalComponents.map(name => this.preloadComponent(name))
        );
    }

    /**
     * Get preload status for diagnostics
     */
    getPreloadStatus(): { [componentName: string]: boolean } {
        const status: { [componentName: string]: boolean } = {};
        this.components.forEach((component, name) => {
            status[name] = component.loaded;
        });
        return status;
    }

    /**
     * Clear all preloaded content (e.g., on language change)
     */
    clearPreloadedContent(): void {
        this.contentCache.clear();
        this.components.forEach(component => {
            component.loaded = false;
            component.loading = false;
        });
        console.log('🧹 Cleared all preloaded content');
    }

    /**
     * Preload quiz data for common concepts
     */
    async preloadCommonQuizzes(student: Student, language: string): Promise<void> {
        const commonConcepts = [
            'Basic Mathematics',
            'Science Fundamentals',
            'English Grammar',
            'General Knowledge'
        ];

        for (const concept of commonConcepts) {
            const cacheKey = `quiz_${concept}_${language}`;
            const cached = await getCachedData(cacheKey);
            
            if (!cached) {
                setTimeout(async () => {
                    try {
                        const quiz = await generateQuiz([concept], language, 5);
                        await setCachedData(cacheKey, quiz, 15 * 60 * 1000, 'quiz');
                        console.log(`✅ Preloaded quiz: ${concept}`);
                    } catch (error) {
                        console.warn(`Failed to preload quiz for ${concept}:`, error);
                    }
                }, Math.random() * 5000); // Random delay to spread load
            }
        }
    }

    /**
     * Initialize preloading based on app startup
     */
    initializeForApp(student: Student, language: string): void {
        console.log('🚀 Initializing content preloader...');
        
        // Immediate critical preloading
        this.preloadCriticalComponents();
        
        // Delayed secondary preloading
        setTimeout(() => {
            this.preloadForUserContext('dashboard', student);
            this.preloadCommonQuizzes(student, language);
        }, 3000);
    }
}

// Singleton instance
export const contentPreloader = new ContentPreloader();

// Hook for using preloader in React components
import { useEffect } from 'react';

export const useContentPreloader = (
    currentScreen: string,
    student: Student,
    grade?: Grade,
    subject?: Subject,
    chapter?: Chapter,
    language = 'en'
) => {
    useEffect(() => {
        contentPreloader.preloadForUserContext(currentScreen, student, grade, subject);
        
        // Preload next chapters if viewing current chapter
        if (chapter && subject) {
            contentPreloader.preloadNextChapters(chapter, subject, student, language);
        }
    }, [currentScreen, student.id, grade?.level, subject?.name, chapter?.title, language]);

    return {
        preloadStatus: contentPreloader.getPreloadStatus(),
        clearCache: () => contentPreloader.clearPreloadedContent()
    };
};

export default contentPreloader;