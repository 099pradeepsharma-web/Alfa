import React, { useState, useEffect, useMemo } from 'react';
import { Student, PerformanceRecord, AdaptiveAction, AdaptiveActionType, LearningStreak } from '../types';
import { getPerformanceRecords, getLearningModule, saveLearningModule, getDiagram, saveDiagram, getLearningStreak, getWellbeingModuleStatus } from '../services/pineconeService';
import { getAdaptiveNextStep, getChapterContent, generateDiagram } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, RocketLaunchIcon, PuzzlePieceIcon, HeartIcon, TrophyIcon, MagnifyingGlassIcon, FireIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import FittoAvatar from '../components/FittoAvatar';
import { CURRICULUM } from '../data/curriculum';

const LearningStreakCard: React.FC<{ streak: number }> = ({ streak }) => {
    const { t } = useLanguage();
    if (streak < 2) return null;

    return (
        <div className="dashboard-highlight-card streak-card-gradient p-6 rounded-2xl shadow-lg flex items-center gap-4">
            <FireIcon className="h-12 w-12 text-amber-900 dark:text-amber-100 opacity-80" />
            <div>
                 <h3 className="text-2xl font-bold text-streak-text dark:text-streak-text">{t('learningStreakText', { count: streak })}</h3>
                 <p className="font-semibold text-streak-text/80 dark:text-streak-text/80">Keep the fire burning!</p>
            </div>
        </div>
    );
};


interface StudentDashboardProps {
  onStartMission: () => void;
  onBrowse: () => void;
  onStartWellbeing: () => void;
}

const ActivityCard: React.FC<{ record: PerformanceRecord }> = React.memo(({ record }) => {
    const { t, tCurriculum } = useLanguage();
    
    let title = '';
    let icon = <BookOpenIcon className="h-6 w-6" />;
    let iconBgClass = 'activity-icon-bg-academic';

    if (record.type === 'iq') {
        title = t('iqChallengeCompleted');
        icon = <PuzzlePieceIcon className="h-6 w-6" />;
        iconBgClass = 'activity-icon-bg-iq';
    } else if (record.type === 'eq') {
        title = t('eqChallengeCompleted');
        icon = <HeartIcon className="h-6 w-6" />;
        iconBgClass = 'activity-icon-bg-eq';
    } else {
        title = t('academicChapter', { chapter: tCurriculum(record.chapter), subject: tCurriculum(record.subject) });
        icon = <BookOpenIcon className="h-6 w-6" />;
    }
    
    const getScoreStyle = (score: number) => {
        if (score > 85) return { class: 'activity-score-high', text: t('badgeMastery') };
        if (score > 70) return { class: 'activity-score-medium', text: t('badgeProficient') };
        return { class: 'activity-score-low', text: t('badgeImproving') };
    };
    const scoreStyle = getScoreStyle(record.score);

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
             <div className={`flex-shrink-0 activity-icon-bg ${iconBgClass}`}>
                {icon}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{record.context ? `${t('skill')}: ${record.context}`: new Date(record.completedDate).toLocaleDateString()}</p>
            </div>
             <div className="text-right flex-shrink-0 ml-2">
                <div className={`activity-score ${scoreStyle.class}`}>
                    {record.score}%
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center mt-1">{scoreStyle.text}</p>
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 min-h-[220px] flex items-center justify-center">
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
        <div className="dashboard-highlight-card mission-card-gradient rounded-2xl">
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
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('todaysMission')}</h2>
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
                
                <div className="mt-6 bg-primary-light/50 dark:bg-slate-900/40 p-4 rounded-lg border border-primary/20 dark:border-slate-700" style={{borderColor: 'rgba(var(--c-primary), 0.2)'}}>
                    <p className="font-semibold text-sm text-primary-dark dark:text-primary-light mb-1" style={{color: 'rgb(var(--c-primary-dark))'}}>AI Recommendation</p>
                    <p className="text-slate-600 dark:text-slate-300 italic">"{action.details.reasoning}"</p>
                </div>

                <div className="mt-6">
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


const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartMission, onBrowse, onStartWellbeing }) => {
    const { t, tCurriculum, language } = useLanguage();
    const { currentUser: student } = useAuth();
    const [activities, setActivities] = useState<PerformanceRecord[]>([]);
    const [learningStreak, setLearningStreak] = useState(0);
    const [isWellbeingModuleAssigned, setIsWellbeingModuleAssigned] = useState(false);
    const [isLoadingWellbeingStatus, setIsLoadingWellbeingStatus] = useState(true);
    
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

                // Fetch wellbeing module status
                setIsLoadingWellbeingStatus(true);
                const wellbeingStatus = await getWellbeingModuleStatus(student.id);
                setIsWellbeingModuleAssigned(wellbeingStatus);
                setIsLoadingWellbeingStatus(false);
            }
        };

        fetchDashboardData();
    }, [student]);

    // Enhanced predictive loading for production scaling
    useEffect(() => {
        const prefetchContent = async () => {
            if (!student) return;
            try {
                const action = await getAdaptiveNextStep(student, language);
                if (!action.type.startsWith('ACADEMIC') || !action.details.subject || !action.details.chapter) return;
                const { subject: subjectName, chapter: chapterTitle } = action.details;
                const subjectData = CURRICULUM.find(g => g.level === student.grade)?.subjects.find(s => s.name === subjectName);
                if (!subjectData) return;
                const chapterIndex = subjectData.chapters.findIndex(c => c.title === chapterTitle);
                if (chapterIndex === -1) return;
                const chaptersToPrefetch = subjectData.chapters.slice(chapterIndex, chapterIndex + 3);
                
                const prefetchPromises = chaptersToPrefetch.map(async (chapterToPrefetch) => {
                    const dbKey = `module-${student.grade}-${subjectName}-${chapterToPrefetch.title}`;
                    const isModuleCached = await getLearningModule(dbKey, language);
                    if (isModuleCached) return;

                    const content = await getChapterContent(student.grade, subjectName, chapterToPrefetch.title, student.name, language);
                    await saveLearningModule(dbKey, content, language);
                    
                    content.keyConcepts.forEach(async (concept) => {
                         const diagramDbKey = `diagram-${student.grade}-${subjectName}-${chapterToPrefetch.title}-${concept.conceptTitle}`;
                         const isDiagramCached = await getDiagram(diagramDbKey);
                         if (!isDiagramCached && concept.diagramDescription && concept.diagramDescription.trim().length > 10) {
                             try {
                                 const diagramUrl = await generateDiagram(concept.diagramDescription, subjectName);
                                 await saveDiagram(diagramDbKey, diagramUrl);
                             } catch (e) {
                                  console.error(`Alfanumrik: Failed to pre-fetch diagram for "${concept.conceptTitle}".`, e);
                             }
                         }
                    });
                });
                await Promise.allSettled(prefetchPromises);
            } catch (error) {
                console.error("Alfanumrik: Background pre-fetch failed:", error);
            }
        };
        const timer = setTimeout(prefetchContent, 3000);
        return () => clearTimeout(timer);
    }, [student, language]);


    const recommendations = useMemo(() => {
        if (!student || activities.length === 0) return [t('rec_welcome'), t('rec_general_tip')];
        const recs = [];
        const sorted = [...activities].sort((a, b) => a.score - b.score);
        const weakest = sorted[0];
        const strongest = sorted[sorted.length - 1];
        if (strongest?.score > 85 && strongest.type !== 'iq' && strongest.type !== 'eq') recs.push(t('rec_strength', { context: tCurriculum(strongest.chapter), score: strongest.score, subject: tCurriculum(strongest.subject) }));
        if (weakest?.score < 70) recs.push(t('rec_weakness', { context: tCurriculum(weakest.chapter), score: weakest.score, subject: tCurriculum(weakest.subject) }));
        recs.push(t('rec_general_tip'));
        return recs;
    }, [activities, t, tCurriculum, student]);
    
    const recentActivities = activities.slice(0, 5);
    
    if (!student) return null;

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                    {t('welcomeBack', { name: student.name.split(' ')[0] })} 👋
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('dashboardSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    <MissionCard onStartMission={onStartMission} student={student} />
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                            {t('fittoRecommendations')}
                        </h2>
                        {recommendations[0] && <FittoMessage message={recommendations[0]} />}
                    </div>
                </div>

                {/* Side Panel */}
                <div className="lg:col-span-2 space-y-8">
                     <LearningStreakCard streak={learningStreak} />

                    {isLoadingWellbeingStatus ? (
                        <div className="dashboard-highlight-card p-6 rounded-2xl flex items-center justify-center min-h-[150px]">
                            <LoadingSpinner />
                        </div>
                    ) : isWellbeingModuleAssigned && (
                        <div className="dashboard-highlight-card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-full">
                                    <HeartIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">A Special Module</h3>
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned by your parent</p>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">Explore the "Great Transformation" module to learn about personal growth and well-being.</p>
                            <button
                                onClick={onStartWellbeing}
                                className="flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition"
                            >
                                <span>Explore Module</span>
                                <ArrowRightIcon className="h-4 w-4 ml-2" />
                            </button>
                        </div>
                    )}

                    <button onClick={onBrowse} className="dashboard-highlight-card w-full p-6 rounded-2xl flex items-center gap-4 text-left">
                       <div className="p-3 bg-primary-light rounded-full" style={{backgroundColor: 'rgb(var(--c-primary-light))'}}>
                           <MagnifyingGlassIcon className="h-8 w-8 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}} />
                       </div>
                       <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('exploreAllTopics')}</h3>
                            <p className="text-slate-500 dark:text-slate-400">{t('exploreAllTopicsDesc')}</p>
                       </div>
                    </button>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
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
        </div>
    );
};

export default React.memo(StudentDashboard);