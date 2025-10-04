import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, QuizQuestion, Chapter, NextStepRecommendation } from '../types';
import { generateDiagnosticTest, generateChapterDiagnosticTest, generateDiagnosticRecommendation } from '../services/geminiService';
import Quiz from './Quiz';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon, LightBulbIcon, ForwardIcon } from '@heroicons/react/24/solid';
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
    const [score, setScore] = useState(0);
    const { t, tCurriculum } = useLanguage();

    const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const questions = chapter 
                    ? await generateChapterDiagnosticTest(grade.level, subject.name, chapter.title, language)
                    : await generateDiagnosticTest(grade.level, subject.name, language);
                setTestQuestions(questions);
            } catch (err: any) {
                setError(err.message || t('testGenerationError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTest();
    }, [grade.level, subject.name, chapter, language, t]);
    
    const handleChapterTestFinish = useCallback(async (result: { score: number; answers: { [key: number]: string; } }) => {
        if (!chapter || !testQuestions) return;
        
        setIsLoadingRecommendation(true);
        setError(null);
        try {
            const subjectChapters = grade.subjects.find(s => s.name === subject.name)?.chapters || [];
            const rec = await generateDiagnosticRecommendation(grade.level, subject.name, chapter.title, result.score, testQuestions.length, subjectChapters, language);
            setRecommendation(rec);
        } catch (err: any) {
            setError(err.message || "Could not get recommendation.");
        } finally {
            setIsLoadingRecommendation(false);
        }

    }, [chapter, grade, subject, testQuestions, language]);


    const handleQuizFinish = (result: { score: number; answers: { [key: number]: string; } }) => {
        setScore(result.score);
        setIsTestCompleted(true);
        if (chapter) {
            handleChapterTestFinish(result);
        }
    };

    // FIX: Updated logic to pass the full recommendation object to the onTestComplete callback.
    const handleRecommendationAction = () => {
        if (recommendation && onTestComplete) {
            onTestComplete(recommendation);
        } else {
            onBack();
        }
    }


    const getRecommendation = () => {
        const percentage = (score / (testQuestions?.length || 1)) * 100;
        const subjectName = tCurriculum(subject.name);
        const firstChapter = tCurriculum(subject.chapters[0].title);
        const middleChapter = tCurriculum(subject.chapters[Math.floor(subject.chapters.length / 2)].title);

        if (percentage >= 80) {
            return t('diagnosticResultHigh', { subject: subjectName, chapter: middleChapter });
        } else if (percentage >= 50) {
            return t('diagnosticResultMid', { chapter: firstChapter });
        } else {
            return t('diagnosticResultLow', { chapter: firstChapter });
        }
    };
    
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
    
    if (isTestCompleted) {
        if (chapter) {
            // Chapter-specific results and recommendation view
            return (
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg animate-fade-in text-center">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('testComplete')}</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('youScored', { score, total: testQuestions?.length })}</p>
                    
                    <div role="status" className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-400 dark:border-indigo-500 rounded-r-lg text-left">
                         <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 flex items-center mb-2 text-xl">
                            <LightBulbIcon className="h-6 w-6 mr-2" />
                            {t('ourRecommendation')}
                        </h3>
                        {isLoadingRecommendation ? <div className="flex justify-center"><LoadingSpinner /></div> : (
                            recommendation ? (
                                <>
                                    <p className="text-indigo-700 dark:text-indigo-300 text-lg italic">"{recommendation.recommendationText}"</p>
                                    <div className="mt-4 text-center">
                                         <button onClick={handleRecommendationAction} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition">
                                            <span>
                                                 {recommendation.action === 'REVISE_PREREQUISITE' 
                                                     ? t('revisePrerequisite', { chapter: tCurriculum(recommendation.prerequisiteChapterTitle || '') })
                                                     : t('startNextChapter', { chapter: tCurriculum(recommendation.nextChapterTitle || '') })
                                                 }
                                            </span>
                                            <ForwardIcon className="h-5 w-5 ml-2" />
                                        </button>
                                    </div>
                                </>
                            ) : <p className="text-red-500">Could not load recommendation.</p>
                        )}
                    </div>
                 </div>
            )
        } else {
             // Generic subject-level results view
            return (
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg animate-fade-in text-center">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('testComplete')}</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('youScored', { score, total: testQuestions?.length })}</p>
                    <div role="status" className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-400 dark:border-indigo-500 rounded-r-lg text-left">
                         <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 flex items-center mb-2 text-xl">
                            <LightBulbIcon className="h-6 w-6 mr-2" />
                            {t('ourRecommendation')}
                        </h3>
                        <p className="text-indigo-700 dark:text-indigo-300 text-lg">{getRecommendation()}</p>
                    </div>
                    <button onClick={onBack} className="mt-8 flex items-center justify-center mx-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition">
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        {t('backToChapters')}
                    </button>
                 </div>
            )
        }
    }

    if (testQuestions) {
        const title = chapter 
            ? `${t('diagnosticTestFor')}: ${tCurriculum(chapter.title)}` 
            : `${t('diagnosticTestFor')}: ${tCurriculum(subject.name)}`;
        return <Quiz 
            questions={testQuestions} 
            onBack={onBack} 
            chapterTitle={title}
            onFinish={handleQuizFinish}
         />
    }

    return null;
};

export default DiagnosticTest;