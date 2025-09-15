import React, { useState, useEffect, useMemo } from 'react';
import { Student, PerformanceRecord, AdaptiveAction, AdaptiveActionType, LearningStreak } from '../types';
import { getPerformanceRecords, getLearningModule, saveLearningModule, getDiagram, saveDiagram, getLearningStreak } from '../services/pineconeService';
import { getAdaptiveNextStep, getChapterContent, generateDiagram } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, RocketLaunchIcon, PuzzlePieceIcon, HeartIcon, TrophyIcon, MagnifyingGlassIcon, FireIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import FittoAvatar from '../components/FittoAvatar';
import { CURRICULUM } from '../data/curriculum';

const LearningStreakDisplay: React.FC<{ streak: number }> = ({ streak }) => {
    const { t } = useLanguage();
    if (streak < 2) return null;

    return (
        <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-4 py-1.5 rounded-full animate-fade-in">
            <FireIcon className="h-6 w-6 text-amber-500" />
            <span>{t('learningStreakText', { count: streak })}</span>
        </div>
    );
};


interface StudentDashboardProps {
  onStartMission: () => void;
  onBrowse: () => void;
}

const ActivityCard: React.FC<{ record: PerformanceRecord }> = React.memo(({ record }) => {
    const { t, tCurriculum } = useLanguage();
    
    let title = '';
    let icon = <BookOpenIcon className="h-8 w-8 text-slate-500" />;

    if (record.type === 'iq') {
        title = t('iqChallengeCompleted');
        icon = <PuzzlePieceIcon className="h-8 w-8 text-sky-500" />;
    } else if (record.type === 'eq') {
        title = t('eqChallengeCompleted');
        icon = <HeartIcon className="h-8 w-8 text-rose-500" />;
    } else {
        title = t('academicChapter', { chapter: tCurriculum(record.chapter), subject: tCurriculum(record.subject) });
        icon = <BookOpenIcon className="h-8 w-8 text-indigo-500" />;
    }

    const getBadge = (score: number) => {
        if (score > 85) return { text: t('badgeMastery'), color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' };
        if (score > 70) return { text: t('badgeProficient'), color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' };
        return { text: t('badgeImproving'), color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' };
    };

    const badge = getBadge(record.score);
    const progressBarLabel = `${title} progress: ${record.score}%`;

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{record.context ? `${t('skill')}: ${record.context}`: new Date(record.completedDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                    <TrophyIcon className="h-3.5 w-3.5" />
                    {badge.text}
                </div>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{record.score}%</span>
                </div>
                <div 
                    role="progressbar" 
                    aria-label={progressBarLabel}
                    aria-valuenow={record.score} 
                    aria-valuemin={0} 
                    aria-valuemax={100} 
                    className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"
                >
                  <div className="h-2.5 rounded-full progress-bar-gradient" style={{ width: `${record.score}%` }}></div>
              </div>
            </div>
        </div>
    );
});


const MissionCard: React.FC<{ onStartMission: () => void, student: Student }> = ({ onStartMission, student }) => {
    const { t, language } = useLanguage();
    const [action, setAction] = useState<AdaptiveAction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAction = async () => {
            setIsLoading(true);
            try {
                const adaptiveAction = await getAdaptiveNextStep(student, language);
                setAction(adaptiveAction);
            } catch (error) {
                console.error("Failed to fetch adaptive action:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAction();
    }, [student, language]);

    const getDifficulty = (type: AdaptiveActionType | undefined) => {
        switch (type) {
            case 'ACADEMIC_REVIEW': return { label: t('easy'), color: 'rgb(var(--c-success))', dots: 1 };
            case 'ACADEMIC_PRACTICE': return { label: t('medium'), color: '#FBBF24', dots: 2 };
            case 'ACADEMIC_NEW': return { label: t('hard'), color: 'rgb(var(--c-error))', dots: 3 };
            default: return { label: t('medium'), color: '#FBBF24', dots: 2 };
        }
    };
    
    const difficulty = getDifficulty(action?.type);
    const confidence = action?.details.confidence || 0;
    
    let confidenceColor = 'rgb(var(--c-error))';
    if (confidence > 0.9) confidenceColor = 'rgb(var(--c-success))';
    else if (confidence > 0.7) confidenceColor = '#FBBF24';

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 min-h-[170px] flex items-center justify-center">
                 <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <LoadingSpinner />
                    <span className="font-semibold">{t('craftingYourPath')}</span>
                 </div>
            </div>
        );
    }
    
    if (!action) {
        return null; // Or show an error state
    }

    return (
        <div className="smart-card bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mission-card-gradient">
            <div 
                className="smart-card-confidence-bar"
                style={{
                    '--confidence': `${confidence * 100}%`,
                    '--confidence-color': confidenceColor,
                } as React.CSSProperties}
                title={`AI Confidence: ${Math.round(confidence * 100)}%`}
            ></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="ai-generated-tag mb-2">
                            <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
                            AI-Personalized
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('todaysMission')}</h2>
                    </div>
                    <div className="text-right">
                         <div className="difficulty-dots" aria-label={`Difficulty: ${difficulty.label}`}>
                           {Array.from({ length: 3 }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="difficulty-dot"
                                    style={{ backgroundColor: i < difficulty.dots ? difficulty.color : 'rgb(var(--c-border))' }}
                                ></div>
                           ))}
                         </div>
                         <span className="text-xs font-bold mt-1.5 inline-block" style={{ color: difficulty.color }}>
                            {difficulty.label}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6 mt-4">
                    <div className="bg-primary-light p-4 rounded-full self-center md:self-auto" style={{ backgroundColor: 'rgb(var(--c-primary-light))' }}>
                        <RocketLaunchIcon className="h-10 w-10 text-primary-dark" style={{ color: 'rgb(var(--c-primary-dark))' }} />
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <div className="personalization-tags">
                            <div className="personalization-tag" style={{backgroundColor: 'rgb(var(--c-bg-accent))', color: 'rgb(var(--c-text-accent))'}}>
                                For You
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 italic mt-1">"{action.details.reasoning}"</p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={onStartMission}
                            className="flex items-center justify-center w-full md:w-auto px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient"
                        >
                            <span>{t('launchMission')}</span>
                            <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FittoMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="flex items-start gap-3 animate-fade-in">
            <div className="flex-shrink-0 mt-1">
                <FittoAvatar state={'speaking'} size={56} />
            </div>
            <div className="relative">
                <div className="chat-bubble fitto-bubble text-base">
                    <p className="text-slate-700 dark:text-slate-200">{message}</p>
                </div>
            </div>
        </div>
    );
};


const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartMission, onBrowse }) => {
    const { t, tCurriculum, language } = useLanguage();
    const { currentUser: student } = useAuth();
    const [activities, setActivities] = useState<PerformanceRecord[]>([]);
    const [learningStreak, setLearningStreak] = useState(0);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (student) {
                // Fetch activities
                const storedRecords = await getPerformanceRecords(student.id);
                storedRecords.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
                setActivities(storedRecords);

                // Fetch learning streak
                const streakData = await getLearningStreak(student.id);
                setLearningStreak(streakData?.count || 0);
            }
        };

        fetchDashboardData();
    }, [student]);

    // Enhanced predictive loading for production scaling
    useEffect(() => {
        const prefetchContent = async () => {
            if (!student) return;

            console.log("Alfanumrik: Starting predictive content pre-fetch...");
            try {
                // 1. Determine which chapter to pre-fetch based on AI recommendation
                const action = await getAdaptiveNextStep(student, language);

                if (!action.type.startsWith('ACADEMIC') || !action.details.subject || !action.details.chapter) {
                    console.log("Alfanumrik: No academic chapter recommended for predictive loading.");
                    return;
                }
                
                const { subject: subjectName, chapter: chapterTitle } = action.details;
                
                // 2. Find the subject and the starting chapter index from the curriculum
                const subjectData = CURRICULUM.find(g => g.level === student.grade)?.subjects.find(s => s.name === subjectName);
                if (!subjectData) {
                    console.log(`Alfanumrik: Could not find subject data for '${subjectName}' for pre-fetching.`);
                    return;
                }
                const chapterIndex = subjectData.chapters.findIndex(c => c.title === chapterTitle);
                if (chapterIndex === -1) {
                    console.log(`Alfanumrik: Could not find chapter index for '${chapterTitle}' for pre-fetching.`);
                    return;
                }

                // 3. Create a list of up to 3 chapters to pre-fetch (the recommended one + next 2)
                const chaptersToPrefetch = subjectData.chapters.slice(chapterIndex, chapterIndex + 3);
                console.log(`Alfanumrik: Identified ${chaptersToPrefetch.length} chapters for predictive loading in ${subjectName}.`);
                
                // 4. Pre-fetch each chapter and its diagrams in parallel
                const prefetchPromises = chaptersToPrefetch.map(async (chapterToPrefetch) => {
                    const dbKey = `module-${student.grade}-${subjectName}-${chapterToPrefetch.title}`;
                    
                    const isModuleCached = await getLearningModule(dbKey, language);
                    if (isModuleCached) {
                        console.log(`Alfanumrik: Module for "${chapterToPrefetch.title}" is already cached. Skipping.`);
                        return;
                    }

                    console.log(`Alfanumrik: Pre-fetching module for "${chapterToPrefetch.title}"...`);
                    const content = await getChapterContent(student.grade, subjectName, chapterToPrefetch.title, student.name, language);
                    await saveLearningModule(dbKey, content, language);
                    console.log(`Alfanumrik: Successfully cached module for "${chapterToPrefetch.title}".`);
                    
                    // 5. Also pre-fetch diagrams for the newly cached content
                    content.keyConcepts.forEach(async (concept) => {
                         const diagramDbKey = `diagram-${student.grade}-${subjectName}-${chapterToPrefetch.title}-${concept.conceptTitle}`;
                         const isDiagramCached = await getDiagram(diagramDbKey);
                         if (!isDiagramCached && concept.diagramDescription && concept.diagramDescription.trim().length > 10) {
                             try {
                                 console.log(`Alfanumrik: Pre-fetching diagram for concept "${concept.conceptTitle}"...`);
                                 const diagramUrl = await generateDiagram(concept.diagramDescription, subjectName);
                                 await saveDiagram(diagramDbKey, diagramUrl);
                             } catch (e) {
                                  console.error(`Alfanumrik: Failed to pre-fetch diagram for "${concept.conceptTitle}".`, e);
                             }
                         }
                    });
                });

                await Promise.allSettled(prefetchPromises);
                console.log("Alfanumrik: Predictive loading sequence complete.");

            } catch (error) {
                console.error("Alfanumrik: Background pre-fetch failed:", error);
                // Fail silently as this is a background optimization.
            }
        };

        const timer = setTimeout(prefetchContent, 3000); // Start after a delay
        
        return () => clearTimeout(timer); // Cleanup on unmount

    }, [student, language]);


    const recommendations = useMemo(() => {
        if (!student || activities.length === 0) {
            return [t('rec_welcome'), t('rec_general_tip')];
        }

        const recommendations = [];
        const sortedByScore = [...activities].sort((a, b) => a.score - b.score);
        const weakest = sortedByScore[0];
        const strongest = sortedByScore[sortedByScore.length - 1];

        if (strongest && strongest.score > 85 && strongest.type !== 'iq' && strongest.type !== 'eq') {
             recommendations.push(t('rec_strength', {
                context: tCurriculum(strongest.chapter),
                score: strongest.score,
                subject: tCurriculum(strongest.subject)
            }));
        }
        
        if (weakest && weakest.score < 70) {
             recommendations.push(t('rec_weakness', {
                context: tCurriculum(weakest.chapter),
                score: weakest.score,
                subject: tCurriculum(weakest.subject)
            }));
        }

        recommendations.push(t('rec_general_tip'));
        
        return recommendations;
    }, [activities, t, tCurriculum, student]);
    
    const recentActivities = activities.slice(0, 3);
    
    if (!student) return null; // Should be handled by App router

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                        {t('welcomeBack', { name: student.name.split(' ')[0] })} 👋
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('dashboardSubtitle')}</p>
                </div>
                <LearningStreakDisplay streak={learningStreak} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Start Learning & Recommendations */}
                <div className="lg:col-span-2 space-y-8">
                    <MissionCard onStartMission={onStartMission} student={student} />
                    
                    <button onClick={onBrowse} className="btn-secondary-outline w-full flex items-center justify-center">
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        {t('exploreAllTopics')}
                    </button>
                     
                     {/* Fitto's Recommendations */}
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                            {t('fittoRecommendations')}
                        </h2>
                        {recommendations[0] && <FittoMessage message={recommendations[0]} />}
                    </div>
                </div>

                {/* Side Panel: Recent Activity */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                        {t('recentActivity')}
                    </h2>
                    <div className="space-y-4">
                        {recentActivities.length > 0 ? recentActivities.map((record, index) => (
                           <ActivityCard key={index} record={record} />
                       )) : <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('noPerformanceData')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(StudentDashboard);