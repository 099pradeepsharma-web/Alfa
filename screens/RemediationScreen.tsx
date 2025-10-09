import React, { useState, useEffect } from 'react';
import { Grade, Subject, Chapter, NextStepRecommendation, Student, CoreConceptLesson, IQExercise, EQExercise } from '../types';
import { useLanguage } from '../contexts/Language-context';
import * as geminiService from '../services/geminiService';
import * as contentService from '../services/contentService';
import LoadingSpinner from '../components/LoadingSpinner';
import CognitiveExercise from '../components/CognitiveExercise';
import StructuredText from '../components/StructuredText';
import { ArrowLeftIcon, LightBulbIcon, AcademicCapIcon, PuzzlePieceIcon, HeartIcon, ForwardIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface RemediationScreenProps {
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  recommendation: NextStepRecommendation;
  student: Student;
  language: string;
  onProceed: () => void;
  onBack: () => void;
}

const AcademicRemediation: React.FC<{ lessons: CoreConceptLesson[], onComplete: () => void }> = ({ lessons, onComplete }) => {
    useEffect(() => {
        // For academic review, we consider it "complete" once it's displayed.
        onComplete();
    }, [onComplete]);

    return (
        <div className="space-y-3">
            {lessons.map(lesson => (
                 <div key={lesson.title} className="bg-surface rounded-lg border border-border p-4">
                     <h4 className="font-bold text-text-primary mb-2">{lesson.title}</h4>
                     <div className="prose prose-sm max-w-none dark:prose-invert">
                        <StructuredText text={lesson.explanation} />
                     </div>
                 </div>
            ))}
        </div>
    )
}

const RemediationScreen: React.FC<RemediationScreenProps> = ({ grade, subject, chapter, recommendation, student, language, onProceed, onBack }) => {
    const { t, tCurriculum } = useLanguage();
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [task, setTask] = useState<IQExercise[] | EQExercise[] | CoreConceptLesson[] | null>(null);
    const [isTaskCompleted, setIsTaskCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRemediationContent = async () => {
            setStatus('loading');
            setError(null);
            try {
                switch (recommendation.action) {
                    case 'REVISE_PREREQUISITE':
                        if (recommendation.prerequisiteChapterTitle) {
                            const prereqChapter = subject.chapters.find(c => c.title === recommendation.prerequisiteChapterTitle);
                            if (prereqChapter) {
                                const module = await contentService.getChapterContent(grade.level, subject.name, prereqChapter, student, language);
                                setTask(module.content.coreConceptTraining);
                            } else { throw new Error(`Prerequisite chapter '${recommendation.prerequisiteChapterTitle}' not found.`); }
                        } else { throw new Error('No prerequisite chapter specified.'); }
                        break;
                    case 'START_CRITICAL_THINKING':
                        const iqExercises = await geminiService.generateIQExercises(grade.level, language, 3);
                        setTask(iqExercises);
                        break;
                    case 'START_WELLBEING':
                        const eqExercises = await geminiService.generateEQExercises(grade.level, language, 3);
                        setTask(eqExercises);
                        break;
                    default:
                        // This case shouldn't be reached, but as a fallback, allow proceeding.
                        setIsTaskCompleted(true);
                        break;
                }
                setStatus('ready');
            } catch (err: any) {
                setError(err.message);
                setStatus('error');
            }
        };

        fetchRemediationContent();
    }, [recommendation, grade, subject, student, language]);
    
    const renderTask = () => {
        if (!task) return null;
        if (recommendation.action === 'REVISE_PREREQUISITE') {
            return <AcademicRemediation lessons={task as CoreConceptLesson[]} onComplete={() => setIsTaskCompleted(true)} />;
        }
        if (recommendation.action === 'START_CRITICAL_THINKING' || recommendation.action === 'START_WELLBEING') {
            return <CognitiveExercise 
                        exercises={task as (IQExercise[] | EQExercise[])}
                        exerciseType={recommendation.action === 'START_CRITICAL_THINKING' ? 'iq' : 'eq'}
                        student={student}
                        onFinish={() => setIsTaskCompleted(true)}
                    />
        }
        return null;
    };

    let titleIcon: React.ElementType = AcademicCapIcon;
    let titleText: string = t('remediationAcademicHeader', { chapter: tCurriculum(recommendation.prerequisiteChapterTitle || '') });
    let loadingText = t('remediationLoadingAcademic');

    if (recommendation.action === 'START_CRITICAL_THINKING') {
        titleIcon = PuzzlePieceIcon;
        titleText = t('remediationIQHeader');
        loadingText = t('remediationLoadingCognitive');
    } else if (recommendation.action === 'START_WELLBEING') {
        titleIcon = HeartIcon;
        titleText = t('remediationEQHeader');
        loadingText = t('remediationLoadingCognitive');
    }
    const TitleIcon = titleIcon;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToSubjects')}
            </button>
            <div className="dashboard-highlight-card p-8">
                 <div className="text-center">
                    <LightBulbIcon className="h-12 w-12 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('remediationTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto italic">"{recommendation.recommendationText}"</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center p-8">
                            <LoadingSpinner />
                            <p className="mt-3 text-text-secondary">{loadingText}</p>
                        </div>
                    )}
                    {status === 'error' && <p className="text-center text-status-danger">{error}</p>}
                    {status === 'ready' && (
                         <div className="animate-fade-in">
                            <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                                <TitleIcon className="h-7 w-7 text-primary"/>
                                {titleText}
                            </h3>
                            {renderTask()}

                            {isTaskCompleted && (
                                <div className="mt-8 text-center p-6 bg-status-success rounded-lg border border-status-success">
                                    <CheckCircleIcon className="h-10 w-10 mx-auto text-status-success"/>
                                    <p className="mt-2 font-semibold text-status-success">{t('remediationCompletePrompt')}</p>
                                    <button onClick={onProceed} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 btn-accent">
                                        <span>{t('remediationProceed')}</span>
                                        <ForwardIcon className="h-5 w-5 ml-2" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemediationScreen;
