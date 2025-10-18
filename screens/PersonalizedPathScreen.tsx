import React, { useState, useEffect } from 'react';
import { Student, AdaptiveAction, QuizQuestion, IQExercise, EQExercise, PerformanceRecord, Chapter } from '../types';
// FIX: Import geminiService to resolve "Cannot find name 'geminiService'" errors.
import * as geminiService from '../services/geminiService';
import { getChapterContent } from '../services/contentService';
import { CURRICULUM } from '../data/curriculum';
import LoadingSpinner from '../components/LoadingSpinner';
import MissionQuiz from '../components/MissionQuiz';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface PersonalizedPathScreenProps {
  student: Student;
  onBack: () => void;
  onMissionComplete: (action: AdaptiveAction) => void;
}

type PathState = 'FETCHING_ACTION' | 'GENERATING_CONTENT' | 'PRESENTING_TASK' | 'ERROR';
type MissionTask = QuizQuestion | IQExercise | EQExercise;

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

const PersonalizedPathScreen: React.FC<PersonalizedPathScreenProps> = ({ student, onBack, onMissionComplete }) => {
    const { t, language } = useLanguage();
    
    const [pathState, setPathState] = useState<PathState>('FETCHING_ACTION');
    const [adaptiveAction, setAdaptiveAction] = useState<AdaptiveAction | null>(null);
    const [taskContent, setTaskContent] = useState<MissionTask[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(t('craftingYourPath'));

    useEffect(() => {
        let interval: number | undefined;
        if (pathState === 'GENERATING_CONTENT' || pathState === 'FETCHING_ACTION') {
            const messages = [
                "Analyzing your learning patterns...",
                "Selecting concepts for mastery...",
                "Designing cognitive challenges...",
                "Building your personalized mission..."
            ];
            let msgIdx = 0;
            interval = window.setInterval(() => {
                msgIdx = (msgIdx + 1) % messages.length;
                setLoadingMessage(messages[msgIdx]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [pathState]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchAndGenerate = async () => {
            if (!student) return;

            try {
                // State: FETCHING_ACTION
                setPathState('FETCHING_ACTION');
                // FIX: Added signal argument to function signature in geminiService to match this call.
                const action = await geminiService.getAdaptiveNextStep(student, language, controller.signal);
                setAdaptiveAction(action);
                
                // State: GENERATING_CONTENT
                setPathState('GENERATING_CONTENT');
                const { type, details } = action;

                let academicQuestions: QuizQuestion[] = [];
                let iqQuestions: IQExercise[] = [];
                let eqQuestions: EQExercise[] = [];

                if (type.startsWith('ACADEMIC')) {
                    if (!details.subject || !details.chapter) throw new Error("Missing subject or chapter details for academic task.");
                    
                    const gradeData = CURRICULUM.find(g => g.level === student.grade);
                    const subjectData = gradeData?.subjects?.find(s => s.name === details.subject);
                    const chapterObject = subjectData?.chapters?.find(c => c.title === details.chapter);
                    if (!chapterObject) throw new Error(`Chapter "${details.chapter}" not found in curriculum.`);

                    const {content: module} = await getChapterContent(student.grade, details.subject, chapterObject, student, language, controller.signal);
                    [academicQuestions, iqQuestions, eqQuestions] = await Promise.all([
                        // FIX: Added signal argument to function signatures in geminiService to match these calls.
                        geminiService.generateQuiz(module.coreConceptTraining.map(c => c.title), language, 6, controller.signal),
                        geminiService.generateIQExercises(student.grade, language, 2, controller.signal),
                        geminiService.generateEQExercises(student.grade, language, 2, controller.signal)
                    ]);

                } else if (type === 'IQ_EXERCISE' || type === 'EQ_EXERCISE') {
                    const weakArea = findWeakestAcademicArea(student.performance, student.grade);
                    const gradeData = CURRICULUM.find(g => g.level === student.grade);
                    const subjectData = gradeData?.subjects?.find(s => s.name === weakArea.subject);
                    const chapterObject = subjectData?.chapters?.find(c => c.title === weakArea.chapter);
                    if (!chapterObject) throw new Error(`Chapter "${weakArea.chapter}" not found in curriculum.`);
                    
                    const {content: module} = await getChapterContent(student.grade, weakArea.subject, chapterObject, student, language, controller.signal);
                    
                    if (type === 'IQ_EXERCISE') {
                        [iqQuestions, eqQuestions, academicQuestions] = await Promise.all([
                            // FIX: Added signal argument to function signatures in geminiService to match these calls.
                            geminiService.generateIQExercises(student.grade, language, 5, controller.signal),
                            geminiService.generateEQExercises(student.grade, language, 3, controller.signal),
                            geminiService.generateQuiz(module.coreConceptTraining.map(c => c.title), language, 2, controller.signal)
                        ]);
                    } else { // EQ_EXERCISE
                         [eqQuestions, iqQuestions, academicQuestions] = await Promise.all([
                            // FIX: Added signal argument to function signatures in geminiService to match these calls.
                            geminiService.generateEQExercises(student.grade, language, 5, controller.signal),
                            geminiService.generateIQExercises(student.grade, language, 3, controller.signal),
                            geminiService.generateQuiz(module.coreConceptTraining.map(c => c.title), language, 2, controller.signal)
                        ]);
                    }
                }

                let orderedTasks: MissionTask[] = [];
                if (type.startsWith('ACADEMIC')) {
                    orderedTasks = [...academicQuestions, ...iqQuestions, ...eqQuestions];
                } else if (type === 'IQ_EXERCISE') {
                    orderedTasks = [...iqQuestions, ...eqQuestions, ...academicQuestions];
                } else if (type === 'EQ_EXERCISE') {
                    orderedTasks = [...eqQuestions, ...iqQuestions, ...academicQuestions];
                }
                
                if (!controller.signal.aborted) {
                    setTaskContent(orderedTasks.slice(0, 10));
                    setPathState('PRESENTING_TASK');
                }

            } catch (err: any) {
                 if (err.name !== 'AbortError') {
                    setError(err.message);
                    setPathState('ERROR');
                }
            }
        };

        fetchAndGenerate();
        
        return () => controller.abort();

    }, [student, language]);


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
            onFinish={() => onMissionComplete(adaptiveAction)}
        />
    }

    if (pathState === 'FETCHING_ACTION' || pathState === 'GENERATING_CONTENT') {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary text-lg font-semibold animate-pulse">{loadingMessage}</p>
                 {adaptiveAction && (
                    <div className="mt-4 text-center p-4 bg-surface rounded-lg max-w-md">
                        <p className="font-semibold text-primary">{t('aiReasoning')}</p>
                        <p className="text-text-secondary italic">"{adaptiveAction.details.reasoning}"</p>
                    </div>
                )}
            </div>
        );
    }
    
    if (pathState === 'ERROR') {
         return (
             <div className="text-center p-8 bg-red-900/20 rounded-2xl shadow-lg border border-red-800">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400" />
                <h3 className="text-2xl font-bold text-red-300 mt-4">{t('errorCraftingPathTitle')}</h3>
                <p className="text-red-400 mt-2">{t('errorCraftingPathBody')}</p>
                {error && <p className="text-xs text-slate-400 mt-2">({error})</p>}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <button onClick={onBack} className="px-6 py-2 bg-slate-700 text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-600 transition">
                        {t('backToDashboard')}
                    </button>
                    <button 
                        onClick={handleRetry}
                        className="flex items-center justify-center px-6 py-2 btn-accent"
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
             <div className="mb-6 p-6 dashboard-highlight-card">
                <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToDashboard')}
                </button>
                <h1 className="text-3xl font-bold text-text-primary">{t('yourNextMission')}</h1>
                <div className="mt-2 text-left p-3 bg-surface rounded-lg">
                    <p className="font-semibold text-primary flex items-center">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {t('aiReasoning')}
                    </p>
                    <p className="text-text-secondary italic">"{adaptiveAction?.details.reasoning}"</p>
                </div>
            </div>
            <div className="dashboard-highlight-card p-8">
                {renderTask()}
            </div>
        </div>
    );
};

export default PersonalizedPathScreen;