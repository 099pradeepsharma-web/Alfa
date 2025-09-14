import React, { useState, useEffect } from 'react';
import { Grade, Subject, QuizQuestion } from '../types';
import { generateDiagnosticTest } from '../services/geminiService';
import Quiz from './Quiz';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface DiagnosticTestProps {
    grade: Grade;
    subject: Subject;
    language: string;
    onBack: () => void;
}

const DiagnosticTest: React.FC<DiagnosticTestProps> = ({ grade, subject, language, onBack }) => {
    const [testQuestions, setTestQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTestCompleted, setIsTestCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const { t, tCurriculum } = useLanguage();

    useEffect(() => {
        const fetchTest = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const questions = await generateDiagnosticTest(grade.level, subject.name, language);
                setTestQuestions(questions);
            } catch (err: any) {
                setError(err.message || t('testGenerationError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTest();
    }, [grade.level, subject.name, language, t]);

    const handleQuizFinish = (result: { score: number; answers: { [key: number]: string; } }) => {
        setScore(result.score);
        setIsTestCompleted(true);
    };

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

    if (testQuestions) {
        return <Quiz 
            questions={testQuestions} 
            onBack={onBack} 
            chapterTitle={`${t('diagnosticTestFor')}: ${tCurriculum(subject.name)}`}
            onFinish={handleQuizFinish}
         />
    }

    return null;
};

export default DiagnosticTest;