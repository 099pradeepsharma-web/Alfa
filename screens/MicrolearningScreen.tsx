import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LearningModule, Concept, Achievement } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import ConceptCard from '../components/ConceptCard';
import PracticeExercises from '../components/PracticeExercises';
import AchievementToast from '../components/AchievementToast';
import { ALL_ACHIEVEMENTS } from '../data/achievements';
import { addAchievement } from '../services/pineconeService';

interface MicrolearningScreenProps {
  learningModule: LearningModule;
  onFinish: () => void;
}

const MicrolearningScreen: React.FC<MicrolearningScreenProps> = ({ learningModule, onFinish }) => {
    const { t, tCurriculum, language } = useLanguage();
    const { currentUser, isLoggedIn } = useAuth();
    const student = currentUser!; // This screen is only accessible when logged in.

    const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
    const [sessionProgress, setSessionProgress] = useState<Record<string, 'mastered'>>({});
    const [showPractice, setShowPractice] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    
    const currentConcept = learningModule.keyConcepts[currentConceptIndex];
    const totalConcepts = learningModule.keyConcepts.length;
    const progressPercentage = (Object.keys(sessionProgress).length / totalConcepts) * 100;

    const handleConceptMastered = useCallback(async () => {
        const newProgress = { ...sessionProgress, [currentConcept.conceptTitle]: 'mastered' as const };
        setSessionProgress(newProgress);
        setShowPractice(false);

        // Check for achievement on last concept
        if (Object.keys(newProgress).length === totalConcepts) {
            const chapterChampionAchievement = ALL_ACHIEVEMENTS.find(a => a.id === 'chapter-champion');
            if (chapterChampionAchievement && student) {
                // Check if student already has this achievement for this chapter
                const hasAchievement = student.achievements.some(a => a.id === chapterChampionAchievement.id); // Simple check, could be more specific
                if (!hasAchievement) {
                    await addAchievement(student.id, chapterChampionAchievement);
                    const achievementWithTimestamp = { ...chapterChampionAchievement, timestamp: new Date().toISOString() };
                    setUnlockedAchievement(achievementWithTimestamp);
                }
            }
        }

    }, [sessionProgress, currentConcept, totalConcepts, student]);

    const handleNextConcept = () => {
        if (currentConceptIndex < totalConcepts - 1) {
            setCurrentConceptIndex(currentConceptIndex + 1);
        }
    };

    const isCurrentConceptMastered = !!sessionProgress[currentConcept.conceptTitle];
    const isQuestFinished = Object.keys(sessionProgress).length === totalConcepts;

    return (
        <div className="microlearning-screen-container animate-fade-in">
            {unlockedAchievement && (
                <AchievementToast 
                    achievement={unlockedAchievement}
                    onClose={() => setUnlockedAchievement(null)}
                />
            )}
            <div className="mb-6">
                <button onClick={onFinish} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-4" style={{color: 'rgb(var(--c-primary))'}}>
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToLesson')}
                </button>
                 <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('focusedStudyTitle')}</h1>
                 <p className="text-slate-500 dark:text-slate-400">{tCurriculum(learningModule.chapterTitle)}</p>
            </div>
            
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-primary" style={{color: 'rgb(var(--c-primary))'}}>{t('progress')}</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {Object.keys(sessionProgress).length} / {totalConcepts} {t('conceptsMastered')}
                    </span>
                </div>
                <div className="w-full h-4 rounded-full microlearning-progress-bar-bg">
                    <div className="h-4 rounded-full microlearning-progress-bar-fg" style={{ width: `${progressPercentage}%` }}>
                        <div className="shimmer"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentConcept.conceptTitle}</h3>
                    {isCurrentConceptMastered && (
                        <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                            <CheckCircleIcon className="h-4 w-4 mr-1"/>{t('mastered')}
                        </span>
                    )}
                </div>
                 <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                    <p>{currentConcept.explanation}</p>
                </div>
                
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                    {showPractice ? (
                        <PracticeExercises
                            concept={currentConcept}
                            grade={{ level: student.grade, description: '', subjects: [] }}
                            subject={{ name: 'General', icon: '', chapters: [] }}
                            chapter={{ title: learningModule.chapterTitle }}
                            language={language}
                            onClose={() => setShowPractice(false)}
                            onMastered={handleConceptMastered}
                        />
                    ) : (
                         <div className="text-center">
                            <button
                                onClick={() => setShowPractice(true)}
                                disabled={isCurrentConceptMastered}
                                className="px-6 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
                            >
                                {t('practiceThisConcept')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="mt-6 flex justify-end">
                {isQuestFinished ? (
                    <button onClick={onFinish} className="flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-md">
                        {t('finishQuest')}
                    </button>
                ) : (
                    <button
                        onClick={handleNextConcept}
                        disabled={!isCurrentConceptMastered || currentConceptIndex === totalConcepts - 1}
                        className="flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-50"
                    >
                        <span>{t('nextConcept')}</span>
                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MicrolearningScreen;