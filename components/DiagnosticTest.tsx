import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, QuizQuestion, Chapter, NextStepRecommendation } from '../types';
// FIX: Updated imports to use the correct exported members from geminiService.
import { generateComprehensiveDiagnosticTest, generateComprehensiveDiagnosticRecommendation } from '../services/geminiService';
import Quiz from './Quiz';
import LoadingSpinner from './LoadingSpinner';
// FIX: Added new icons for the updated results view.
import { ArrowLeftIcon, LightBulbIcon, ForwardIcon, AcademicCapIcon, PuzzlePieceIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface DiagnosticTestProps {
    grade: Grade;
    subject: Subject;
    chapter?: Chapter;
    language: string;
    onBack: () => void;
    // FIX: Changed prop type to pass the full recommendation object, fixing the type error in the parent component.
    onTestComplete?: (recommendation: NextStepRecommendation) => void;
}

const DiagnosticTest: React.FC<DiagnosticTestProps> = ({ grade, subject, chapter, language, onBack, onTestComplete }) => {
    const [testQuestions, setTestQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTestCompleted, setIsTestCompleted] = useState(false);
    // FIX: Use a state object for detailed scores instead of a single score.
    const [scores, setScores] = useState<{ academic: number; iq: number; eq: number; total: number } | null>(null);
    const { t, tCurriculum } = useLanguage();

    const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // FIX: Use a fallback chapter if one isn't provided, as the new API requires it.
                const effectiveChapter = chapter || subject.chapters[0];
                if (!effectiveChapter) {
                    throw new Error("No chapters available for this subject.");
                }
                // FIX: Called the correct 'generateComprehensiveDiagnosticTest' function.
                const questions = await generateComprehensiveDiagnosticTest(grade.level, subject.name, effectiveChapter.title, language);
                setTestQuestions(questions);
            } catch (err: any) {
                setError(err.message || t('testGenerationError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTest();
    }, [grade.level, subject.name, chapter, subject.chapters, language, t]);
    
    // FIX: Replaced old handler with a new comprehensive one that calculates detailed scores and calls the correct recommendation function.
    const handleQuizFinish = useCallback(async (result: { score: number; answers: { [key: number]: string; } }) => {
        if (!testQuestions || !onTestComplete) return;

        setIsTestCompleted(true);
        setIsLoadingRecommendation(true);

        const scoreCounts: Record<string, { correct: number, total: number }> = {
            ACADEMIC: { correct: 0, total: 0 },
            IQ: { correct: 0, total: 0 },
            EQ: { correct: 0, total: 0 },
        };

        testQuestions.forEach((q, index) => {
            const type = q.type || 'ACADEMIC';
            if (!scoreCounts[type]) scoreCounts[type] = { correct: 0, total: 0 };
            scoreCounts[type].total++;
            if (result.answers[index] === q.correctAnswer) {
                scoreCounts[type].correct++;
            }
        });

        const calculatedScores = {
            academic: scoreCounts.ACADEMIC.total > 0 ? Math.round((scoreCounts.ACADEMIC.correct / scoreCounts.ACADEMIC.total) * 100) : 100,
            iq: scoreCounts.IQ.total > 0 ? Math.round((scoreCounts.IQ.correct / scoreCounts.IQ.total) * 100) : 100,
            eq: scoreCounts.EQ.total > 0 ? Math.round((scoreCounts.EQ.correct / scoreCounts.EQ.total) * 100) : 100,
            total: result.score
        };
        setScores(calculatedScores);
        
        const effectiveChapter = chapter || subject.chapters[0];
        if (!effectiveChapter) {
            setError("Could not determine chapter for recommendation.");
            setIsLoadingRecommendation(false);
            return;
        }

        try {
            // FIX: Added the missing 'subject.chapters' argument to the function call.
            const rec = await generateComprehensiveDiagnosticRecommendation(grade.level, subject.name, effectiveChapter.title, calculatedScores, language, subject.chapters);
            setRecommendation(rec);
        } catch (err: any) {
            setError(err.message || "Could not get recommendation.");
        } finally {
            setIsLoadingRecommendation(false);
        }
    }, [chapter, subject.chapters, grade.level, subject.name, testQuestions, language, onTestComplete]);

    // FIX: Updated logic to pass the full recommendation object to the onTestComplete callback.
    const handleRecommendationAction = () => {
        if (recommendation && onTestComplete) {
            onTestComplete(recommendation);
        } else {
            onBack();
        }
    }

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center h-96">
            <LoadingSpinner />
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">{t('preparingDiagnosticTest')}</p>
        </div>;
    }

    if (error) {
         return <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('couldNotCreateTest')}</h3>
            <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
            <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">{t('backToSubjects')}</button>
        </div>;
    }
    
    // FIX: Replaced entire results view with the new comprehensive one.
    if (isTestCompleted && scores) {
        return (
             <div className="dashboard-highlight-card p-8 animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-text-primary">{t('testComplete')}</h2>
                <p className="text-lg text-text-secondary mt-1">{t('youScored', { score: Math.round(scores.total * (testQuestions?.length || 10) / 100), total: testQuestions?.length })}</p>

                <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    <ScoreCard icon={AcademicCapIcon} title="Academic Readiness" score={scores.academic} />
                    <ScoreCard icon={PuzzlePieceIcon} title="Cognitive Skills (IQ)" score={scores.iq} />
                    <ScoreCard icon={HeartIcon} title="Emotional Skills (EQ)" score={scores.eq} />
                </div>
                
                <div role="status" className="mt-8 p-6 bg-slate-800/50 border-l-4 border-primary rounded-r-lg text-left">
                     <h3 className="font-semibold text-primary flex items-center mb-2 text-xl">
                        <LightBulbIcon className="h-6 w-6 mr-2" />
                        {t('ourRecommendation')}
                    </h3>
                    {isLoadingRecommendation ? <div className="flex justify-center"><LoadingSpinner /></div> : (
                        recommendation ? (
                            <>
                                <p className="text-text-secondary text-lg italic">"{recommendation.recommendationText}"</p>
                                <div className="mt-6 text-center">
                                     <button onClick={handleRecommendationAction} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 btn-accent">
                                        <span>{getRecommendationButtonText(recommendation, t, tCurriculum)}</span>
                                        <ForwardIcon className="h-5 w-5 ml-2" />
                                    </button>
                                </div>
                            </>
                        ) : <p className="text-red-400">Could not load recommendation.</p>
                    )}
                </div>
             </div>
        )
    }

    if (testQuestions) {
        const title = `${t('diagnosticTestFor')}: ${tCurriculum((chapter || subject.chapters[0]).title)}`;
        return <Quiz 
            questions={testQuestions} 
            onBack={onBack} 
            chapterTitle={title}
            onFinish={handleQuizFinish}
         />
    }

    return null;
};

// FIX: Added ScoreCard sub-component for the new results view.
const ScoreCard: React.FC<{icon: React.ElementType, title: string, score: number}> = ({ icon: Icon, title, score }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-400';
        if (s >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-border flex items-center gap-4">
            <Icon className={`h-8 w-8 flex-shrink-0 ${getScoreColor(score)}`} />
            <div>
                <p className="font-semibold text-text-secondary text-sm">{title}</p>
                <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</p>
            </div>
        </div>
    );
};

// FIX: Added helper function for recommendation button text.
const getRecommendationButtonText = (rec: NextStepRecommendation, t: Function, tCurriculum: Function) => {
    switch (rec.action) {
        case 'REVISE_PREREQUISITE':
            return t('revisePrerequisite', { chapter: tCurriculum(rec.prerequisiteChapterTitle || '') });
        case 'START_CRITICAL_THINKING':
            return t('ctGymStartChallenge');
        case 'START_WELLBEING':
            return "Explore Well-being Module";
        case 'CONTINUE':
        default:
             return t('startNextChapter', { chapter: tCurriculum(rec.nextChapterTitle || '') });
    }
};


export default DiagnosticTest;