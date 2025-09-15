import React, { useState } from 'react';
import { QuizQuestion, IQExercise, EQExercise, Student, PerformanceRecord, AdaptiveAction } from '../types';
import { savePerformanceRecord } from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { LightBulbIcon, XCircleIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import FittoAvatar from './FittoAvatar';

type MissionTask = QuizQuestion | IQExercise | EQExercise;

// Type guards
const isAcademic = (task: MissionTask): task is QuizQuestion => 'conceptTitle' in task;
const isIQ = (task: MissionTask): task is IQExercise => 'skill' in task && !('scenario' in task);
const isEQ = (task: MissionTask): task is EQExercise => 'scenario' in task;

interface MissionQuizProps {
  tasks: MissionTask[];
  student: Student;
  adaptiveAction: AdaptiveAction;
  onFinish: () => void;
}

const MissionQuiz: React.FC<MissionQuizProps> = ({ tasks, adaptiveAction, onFinish }) => {
    const { t, tCurriculum } = useLanguage();
    const { currentUser: student } = useAuth();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentTask = tasks[currentIndex];

    const getCorrectAnswer = (task: MissionTask): string => {
        if (isAcademic(task) || isIQ(task)) return task.correctAnswer;
        if (isEQ(task)) return task.bestResponse;
        return '';
    };

    const correctAnswer = getCorrectAnswer(currentTask);

    const handleAnswerSelect = (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        if (option === correctAnswer) {
            setCorrectAnswers(prev => prev + 1);
        }
    };
    
    const handleNext = async () => {
        if (!student) return;

        if (currentIndex === tasks.length - 1) {
            const finalScore = Math.round(((correctAnswers) / tasks.length) * 100);
            const { type, details } = adaptiveAction;
            
            const newRecord: PerformanceRecord = {
                subject: details.subject ? tCurriculum(details.subject) : t(`missionType_${type}`),
                chapter: details.chapter ? tCurriculum(details.chapter) : t('todaysMission'),
                score: finalScore,
                completedDate: new Date().toISOString(),
                type: 'quiz',
                context: details.reasoning,
            };
            await savePerformanceRecord(student.id, newRecord);
            setIsFinished(true);

        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
        }
    };

    const getOptionStyle = (option: string) => {
        if (!selectedOption) {
            return 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-primary';
        }
        if (option === correctAnswer) {
            return 'bg-green-100 dark:bg-green-900/50 border-green-500 ring-2 ring-green-300';
        }
        if (option === selectedOption && option !== correctAnswer) {
            return 'bg-red-100 dark:bg-red-900/50 border-red-500 ring-2 ring-red-300';
        }
        return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-70 cursor-not-allowed';
    };

    if (isFinished) {
        const percentage = Math.round((correctAnswers / tasks.length) * 100);
        const isHighScorer = percentage >= 80;
        return (
             <div className="text-center animate-fade-in flex flex-col items-center">
                {isHighScorer && <div className="mb-4"><FittoAvatar state="celebrating" size={100} /></div>}
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('missionComplete')}</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">{t('greatWork')}</p>
                <div className="text-5xl font-bold text-primary my-4" style={{color: 'rgb(var(--c-primary))'}}>
                    {correctAnswers} / {tasks.length}
                </div>
                <button onClick={onFinish} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition">
                    {t('backToDashboard')}
                </button>
            </div>
        );
    }
    
    let taskTitle = t('todaysTask');
    let taskSubtitle = '';
    if (isAcademic(currentTask)) {
        taskTitle = t('academicQuestion');
        taskSubtitle = `${t('testingConcept')}: ${tCurriculum(currentTask.conceptTitle)}`;
    } else if (isIQ(currentTask)) {
        taskTitle = t('iqChallenge');
        taskSubtitle = `${t('skill')}: ${currentTask.skill}`;
    } else if (isEQ(currentTask)) {
        taskTitle = t('eqChallenge');
        taskSubtitle = `${t('skill')}: ${currentTask.skill}`;
    }

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center border-b dark:border-slate-600 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{taskTitle}</h2>
                    <p className="text-primary font-medium" style={{color: 'rgb(var(--c-primary))'}}>{taskSubtitle}</p>
                </div>
                <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                    {t('question')} {currentIndex + 1} <span className="text-slate-400 dark:text-slate-500">/ {tasks.length}</span>
                </div>
            </div>

            <div>
                {isEQ(currentTask) && <p className="text-slate-500 dark:text-slate-400 italic mb-4">"{currentTask.scenario}"</p>}
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">{currentTask.question}</p>
                <div className="space-y-4">
                    {currentTask.options.map((option, index) => (
                         <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={!!selectedOption}
                            aria-pressed={selectedOption === option}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center text-slate-800 dark:text-slate-200 ${getOptionStyle(option)}`}
                        >
                             <span className={`h-6 w-6 rounded-full border-2 ${selectedOption === option ? 'border-primary bg-primary' : 'border-slate-400 dark:border-slate-500'} mr-4 flex-shrink-0`} style={{borderColor: selectedOption === option ? 'rgb(var(--c-primary))' : '', backgroundColor: selectedOption === option ? 'rgb(var(--c-primary))' : ''}}></span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {selectedOption && (
                 <div className="mt-6 animate-fade-in">
                     {selectedOption === correctAnswer ? (
                         <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-lg">
                            <CheckCircleIcon aria-hidden="true" className="h-6 w-6 mr-2" /> {t('correct')}
                         </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-lg">
                                <XCircleIcon aria-hidden="true" className="h-6 w-6 mr-2" /> {t('incorrect')}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">{t(isEQ(currentTask) ? 'bestResponse' : 'correctAnswerLabel')}: {correctAnswer}</p>
                        </div>
                    )}
                     <div className="mt-3 p-3 bg-primary-light dark:bg-slate-700/50 rounded-md text-primary-dark/80 dark:text-slate-300 flex items-start">
                        <LightBulbIcon aria-hidden="true" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                        <span><span className="font-semibold">{t('explanation')}:</span> {currentTask.explanation}</span>
                    </div>
                     <div className="text-right mt-6">
                         <button
                             onClick={handleNext}
                             className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-dark transition flex items-center ml-auto"
                             style={{backgroundColor: 'rgb(var(--c-primary))'}}
                        >
                            {currentIndex === tasks.length - 1 ? t('finishPractice') : t('nextQuestion')}
                            <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </button>
                     </div>
                </div>
            )}
        </div>
    );
};
export default MissionQuiz;