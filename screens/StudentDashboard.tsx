import React, { useState, useEffect, useMemo } from 'react';
import { Student, PerformanceRecord } from '../types';
import { getPerformanceRecords, getLearningModule, saveLearningModule, getDiagram, saveDiagram } from '../services/pineconeService';
import { getAdaptiveNextStep, getChapterContent, generateDiagram } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, RocketLaunchIcon, PuzzlePieceIcon, HeartIcon, TrophyIcon } from '@heroicons/react/24/solid';

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


const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartMission, onBrowse }) => {
    const { t, tCurriculum, language } = useLanguage();
    const { currentUser: student } = useAuth();
    const [activities, setActivities] = useState<PerformanceRecord[]>([]);
    
    useEffect(() => {
        const fetchActivities = async () => {
            if (student) {
                const storedRecords = await getPerformanceRecords(student.id);
                storedRecords.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
                setActivities(storedRecords);
            }
        };

        fetchActivities();
    }, [student]);

    // Pre-fetching logic for offline curriculum storage
    useEffect(() => {
        const prefetchContent = async () => {
            if (!student) return;

            console.log("Alfanumrik: Starting background content pre-fetch...");
            try {
                // 1. Determine which chapter to pre-fetch based on AI recommendation
                const action = await getAdaptiveNextStep(student, language);

                if (!action.type.startsWith('ACADEMIC') || !action.details.subject || !action.details.chapter) {
                    console.log("Alfanumrik: No academic chapter recommended for pre-fetching.");
                    return;
                }
                
                const { subject: subjectName, chapter: chapterTitle } = action.details;
                
                // 2. Check if the chapter content is already cached
                const dbKey = `module-${student.grade}-${subjectName}-${chapterTitle}`;
                const cachedContent = await getLearningModule(dbKey, language);

                if (cachedContent) {
                    console.log(`Alfanumrik: Content for "${chapterTitle}" is already cached. Pre-fetch not needed.`);
                    return;
                }

                console.log(`Alfanumrik: Pre-fetching content for "${chapterTitle}" in ${subjectName}...`);

                // 3. Fetch and cache the chapter content
                const content = await getChapterContent(student.grade, subjectName, chapterTitle, language);
                await saveLearningModule(dbKey, content, language);
                
                console.log(`Alfanumrik: Successfully pre-fetched and cached module for "${chapterTitle}".`);
                
                // 4. Fetch and cache diagrams for the chapter, checking cache first
                for (const concept of content.keyConcepts) {
                    const diagramDbKey = `diagram-${student.grade}-${subjectName}-${chapterTitle}-${concept.conceptTitle}`;
                    const cachedDiagram = await getDiagram(diagramDbKey);
                    if (!cachedDiagram) {
                        if (concept.diagramDescription && concept.diagramDescription.trim().length > 10) {
                            console.log(`Alfanumrik: Pre-fetching diagram for concept "${concept.conceptTitle}"...`);
                            const diagramUrl = await generateDiagram(concept.diagramDescription, subjectName);
                            await saveDiagram(diagramDbKey, diagramUrl);
                            console.log(`Alfanumrik: Successfully pre-fetched and cached diagram for "${concept.conceptTitle}".`);
                        }
                    }
                }

            } catch (error) {
                console.error("Alfanumrik: Background pre-fetch failed:", error);
                // Fail silently as this is a background optimization, not a critical user-facing feature.
            }
        };

        const timer = setTimeout(prefetchContent, 3000);
        
        return () => clearTimeout(timer); // Cleanup timer on unmount

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
            <div>
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                    {t('welcomeBack', { name: student.name.split(' ')[0] })}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('dashboardSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Start Learning & Recommendations */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Start Learning Section */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                           <div className="bg-primary-light p-4 rounded-full" style={{backgroundColor: 'rgb(var(--c-primary-light))'}}>
                               <RocketLaunchIcon className="h-10 w-10 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}/>
                           </div>
                           <div className="flex-grow text-center md:text-left">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('todaysMission')}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('missionPrompt')}</p>
                           </div>
                           <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                                <button 
                                    onClick={onStartMission}
                                    className="flex items-center justify-center w-full md:w-auto px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient"
                                >
                                <span>{t('beginMission')}</span>
                                <ArrowRightIcon className="h-5 w-5 ml-2" />
                                </button>
                                <button onClick={onBrowse} className="text-sm font-semibold text-primary hover:text-primary-dark transition" style={{color: 'rgb(var(--c-primary))', textDecorationColor: 'rgb(var(--c-primary-dark))'}}>
                                    {t('browseCurriculum')}
                                </button>
                           </div>
                        </div>
                    </div>
                     {/* Fitto's Recommendations */}
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                            {t('fittoRecommendations')}
                        </h2>
                        <ul className="space-y-3">
                            {recommendations.slice(0, 3).map((rec, index) => (
                                <li key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-600 dark:text-slate-300 flex items-start border border-slate-200 dark:border-slate-700">
                                    <div className="flex-shrink-0 mr-3 mt-1">
                                        <SparklesIcon className="h-5 w-5 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                                    </div>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
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