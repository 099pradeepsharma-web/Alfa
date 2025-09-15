import React, { useState, useEffect } from 'react';
import { Student, AdaptiveAction, QuizQuestion, IQExercise, EQExercise, PerformanceRecord } from '../types';
import { getAdaptiveNextStep, generateQuiz, generateIQExercises, generateEQExercises, getChapterContent } from '../services/geminiService';
import { CURRICULUM } from '../data/curriculum';
import LoadingSpinner from '../components/LoadingSpinner';
import MissionQuiz from '../components/MissionQuiz';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface PersonalizedPathScreenProps {
  onBack: () => void;
}

type PathState = 'FETCHING_ACTION' | 'GENERATING_CONTENT' | 'PRESENTING_TASK' | 'ERROR';
type MissionTask = QuizQuestion | IQExercise | EQExercise;

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Helper function to find a weak area or provide a default
const findWeakestAcademicArea = (performance: PerformanceRecord[], studentGrade: string): { subject: string, chapter: string } => {
    const academicRecords = performance.filter(p => p.type === 'quiz' || p.type === 'exercise');
    if (academicRecords.length > 0) {
        academicRecords.sort((a, b) => a.score - b.score);
        return { subject: academicRecords[0].subject, chapter: academicRecords[0].chapter };
    }
    // Fallback if no performance data
    const gradeData = CURRICULUM.find(g => g.level === studentGrade);
    if (gradeData && gradeData.subjects.length > 0 && gradeData.subjects[0].chapters.length > 0) {
        return { subject: gradeData.subjects[0].name, chapter: gradeData.subjects[0].chapters[0].title };
    }
    // Absolute fallback
    return { subject: 'Mathematics', chapter: 'Real Numbers' };
};

const PersonalizedPathScreen: React.FC<PersonalizedPathScreenProps> = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { currentUser: student } = useAuth();
    
    const [pathState, setPathState] = useState<PathState>('FETCHING_ACTION');
    const [adaptiveAction, setAdaptiveAction] = useState<AdaptiveAction | null>(null);
    const [taskContent, setTaskContent] = useState<MissionTask[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdaptiveAction = async () => {
            if (!student) return;
            try {
                const action = await getAdaptiveNextStep(student, language);
                setAdaptiveAction(action);
                setPathState('GENERATING_CONTENT');
            } catch (err: any) {
                setError(err.message);
                setPathState('ERROR');
            }
        };

        if (pathState === 'FETCHING_ACTION') {
            fetchAdaptiveAction();
        }
    }, [pathState, student, language]);

    useEffect(() => {
        const generateContent = async () => {
            if (!adaptiveAction || !student) return;

            try {
                const missionTasks: MissionTask[] = [];
                const { type, details } = adaptiveAction;

                if (type.startsWith('ACADEMIC')) {
                    if (!details.subject || !details.chapter) {
                        throw new Error("Missing subject or chapter details for academic task.");
                    }
                    // Mission: 6 Academic, 2 IQ, 2 EQ
                    const module = await getChapterContent(student.grade, details.subject, details.chapter, student.name, language);
                    const academicQuestions = await generateQuiz(module.keyConcepts, language, 6);
                    const iqQuestions = await generateIQExercises(student.grade, language, 2);
                    const eqQuestions = await generateEQExercises(student.grade, language, 2);
                    missionTasks.push(...academicQuestions, ...iqQuestions, ...eqQuestions);

                } else if (type === 'IQ_EXERCISE') {
                    // Mission: 5 IQ, 3 EQ, 2 Academic
                    const iqQuestions = await generateIQExercises(student.grade, language, 5);
                    const eqQuestions = await generateEQExercises(student.grade, language, 3);
                    missionTasks.push(...iqQuestions, ...eqQuestions);
                    
                    const weakArea = findWeakestAcademicArea(student.performance, student.grade);
                    const module = await getChapterContent(student.grade, weakArea.subject, weakArea.chapter, student.name, language);
                    const academicQuestions = await generateQuiz(module.keyConcepts, language, 2);
                    missionTasks.push(...academicQuestions);

                } else if (type === 'EQ_EXERCISE') {
                    // Mission: 5 EQ, 3 IQ, 2 Academic
                    const eqQuestions = await generateEQExercises(student.grade, language, 5);
                    const iqQuestions = await generateIQExercises(student.grade, language, 3);
                    missionTasks.push(...eqQuestions, ...iqQuestions);
                     
                    const weakArea = findWeakestAcademicArea(student.performance, student.grade);
                    const module = await getChapterContent(student.grade, weakArea.subject, weakArea.chapter, student.name, language);
                    const academicQuestions = await generateQuiz(module.keyConcepts, language, 2);
                    missionTasks.push(...academicQuestions);
                }

                setTaskContent(shuffleArray(missionTasks).slice(0, 10));
                setPathState('PRESENTING_TASK');

            } catch (err: any) {
                setError(err.message);
                setPathState('ERROR');
            }
        };

        if (pathState === 'GENERATING_CONTENT') {
            generateContent();
        }

    }, [pathState, adaptiveAction, student, language]);

    const handleRetry = () => {
        setError(null);
        setAdaptiveAction(null);
        setTaskContent(null);
        setPathState('FETCHING_ACTION');
    };

    const renderTask = () => {
        if (!adaptiveAction || !taskContent || !student) return null;
        
        return <MissionQuiz
            tasks={taskContent}
            student={student}
            adaptiveAction={adaptiveAction}
            onFinish={onBack}
        />
    }

    if (pathState === 'FETCHING_ACTION' || pathState === 'GENERATING_CONTENT') {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">{t('craftingYourPath')}</p>
                 {adaptiveAction && (
                    <div className="mt-4 text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md">
                        <p className="font-semibold text-primary" style={{color: 'rgb(var(--c-primary))'}}>{t('aiReasoning')}</p>
                        <p className="text-slate-600 dark:text-slate-300 italic">"{adaptiveAction.details.reasoning}"</p>
                    </div>
                )}
            </div>
        );
    }
    
    if (pathState === 'ERROR') {
         return (
             <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500 dark:text-red-400" />
                <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 mt-4">{t('errorCraftingPathTitle')}</h3>
                <p className="text-red-700 dark:text-red-400 mt-2">{t('errorCraftingPathBody')}</p>
                {error && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">({error})</p>}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <button onClick={onBack} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                        {t('backToDashboard')}
                    </button>
                    <button 
                        onClick={handleRetry}
                        className="flex items-center justify-center px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-dark transition"
                        style={{backgroundColor: 'rgb(var(--c-primary))'}}
                    >
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        {t('retryButton')}
                    </button>
                </div>
            </div>
         );
    }

    return (
        <div className="animate-fade-in">
             <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-4" style={{color: 'rgb(var(--c-primary))'}}>
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToDashboard')}
                </button>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('yourNextMission')}</h1>
                <div className="mt-2 text-left p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-semibold text-primary flex items-center" style={{color: 'rgb(var(--c-primary))'}}>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {t('aiReasoning')}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 italic">"{adaptiveAction?.details.reasoning}"</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                {renderTask()}
            </div>
        </div>
    );
};

export default PersonalizedPathScreen;