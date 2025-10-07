import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, QuizQuestion, Chapter, NextStepRecommendation } from '../types';
import { generateComprehensiveDiagnosticTest, generateComprehensiveDiagnosticRecommendation } from '../services/geminiService';
import Quiz from '../components/Quiz';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, LightBulbIcon, ForwardIcon, AcademicCapIcon, PuzzlePieceIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface DiagnosticTestProps {
    grade: Grade;
    subject: Subject;
    chapter?: Chapter;
    language: string;
    onBack: () => void;
    onTestComplete?: (recommendation: NextStepRecommendation) => void;
}

const DiagnosticTest: React.FC<DiagnosticTestProps> = ({ grade, subject, chapter, language, onBack, onTestComplete }) => {
    const [testQuestions, setTestQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTestCompleted, setIsTestCompleted] = useState(false);
    const [scores, setScores] = useState<{ academic: number; iq: number; eq: number; total: number } | null>(null);
    const { t, tCurriculum } = useLanguage();

    const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const effectiveChapter = chapter || subject.chapters[0];
                if (!effectiveChapter) {
                    throw new Error("No chapters available for this subject.");
                }
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
            const rec = await generateComprehensiveDiagnosticRecommendation(grade.level, subject.name, effectiveChapter.title, calculatedScores, language, subject.chapters);
            setRecommendation(rec);
        } catch (err: any) {
            setError(err.message || "Could not get recommendation.");
        } finally {
            setIsLoadingRecommendation(false);
        }
    }, [chapter, subject.chapters, grade.level, subject.name, testQuestions, language, onTestComplete]);

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
            <p className="mt-4 text-text-secondary text-lg">{t('preparingDiagnosticTest')}</p>
        </div>;
    }

    if (error) {
         return <div className="text-center p-8 bg-status-danger rounded-lg">
            <h3 className="text-xl font-bold text-status-danger">{t('couldNotCreateTest')}</h3>
            <p className="text-status-danger mt-2">{error}</p>
            <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">{t('backToSubjects')}</button>
        </div>;
    }
    
    if (isTestCompleted && scores) {
        return (
             <div className="dashboard-highlight-card p-8 animate-fade-in text-center">
                <h2 className="text-3xl font-bold text-text-primary">{t('testComplete')}</h2>
                <p className="text-lg text-text-secondary mt-1">{t('youScored', { score: Math.round(scores.total / 100 * (testQuestions?.length || 10)), total: testQuestions?.length })}</p>

                <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    <ScoreCard icon={AcademicCapIcon} title="Academic Readiness" score={scores.academic} />
                    <ScoreCard icon={PuzzlePieceIcon} title="Cognitive Skills (IQ)" score={scores.iq} />
                    <ScoreCard icon={HeartIcon} title="Emotional Skills (EQ)" score={scores.eq} />
                </div>
                
                <div role="status" className="mt-8 p-6 bg-surface border-l-4 border-primary rounded-r-lg text-left">
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

const ScoreCard: React.FC<{icon: React.ElementType, title: string, score: number}> = ({ icon: Icon, title, score }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-status-success';
        if (s >= 60) return 'text-yellow-400 dark:text-yellow-300';
        return 'text-status-danger';
    };
    return (
        <div className="bg-bg-primary p-4 rounded-lg border border-border flex items-center gap-4">
            <Icon className={`h-8 w-8 flex-shrink-0 ${getScoreColor(score)}`} />
            <div>
                <p className="font-semibold text-text-secondary text-sm">{title}</p>
                <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</p>
            </div>
        </div>
    );
};

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
