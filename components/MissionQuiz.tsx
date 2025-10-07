import React, { useState } from 'react';
import { QuizQuestion, IQExercise, EQExercise, Student, PerformanceRecord, AdaptiveAction } from '../types';
import { savePerformanceRecord } from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
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

const MissionQuiz: React.FC<MissionQuizProps> = ({ tasks, student, adaptiveAction, onFinish }) => {
    const { t, tCurriculum } = useLanguage();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
    const [isFinished, setIsFinished] = useState(false);

    const currentTask = tasks[currentIndex];

    const getCorrectAnswer = (task: MissionTask): string => {
        if (isAcademic(task) || isIQ(task)) return task.correctAnswer;
        if (isEQ(task)) return task.bestResponse;
        return '';
    };

    const correctAnswer = getCorrectAnswer(currentTask);

    const handleAnswerSelect = (option: string) => {
        if (selectedAnswers[currentIndex]) return; // Prevent changing answer
        setSelectedAnswers(prev => ({...prev, [currentIndex]: option}));
    };
    
    const handleNext = async () => {
        if (!student) return;

        if (currentIndex === tasks.length - 1) {
            // Group tasks by their type
            const academicTasks = tasks.filter(isAcademic);
            const iqTasks = tasks.filter(isIQ);
            const eqTasks = tasks.filter(isEQ);

            const getCorrectCountForType = (taskList: MissionTask[], currentAnswers: {[key: number]: string}) => {
                return taskList.reduce((count, task) => {
                    const taskIndex = tasks.indexOf(task);
                    const isCorrect = currentAnswers[taskIndex] === getCorrectAnswer(task);
                    return count + (isCorrect ? 1 : 0);
                }, 0);
            };

            const recordsToSave: PerformanceRecord[] = [];
            const today = new Date().toISOString();

            if (academicTasks.length > 0) {
                const correctCount = getCorrectCountForType(academicTasks, selectedAnswers);
                recordsToSave.push({
                    subject: adaptiveAction.details.subject || 'Academic',
                    chapter: adaptiveAction.details.chapter || 'Mission',
                    score: Math.round((correctCount / academicTasks.length) * 100),
                    completedDate: today,
                    type: 'quiz',
                    context: `Part of AI Mission: ${adaptiveAction.details.reasoning}`
                });
            }

            if (iqTasks.length > 0) {
                const correctCount = getCorrectCountForType(iqTasks, selectedAnswers);
                recordsToSave.push({
                    subject: 'Cognitive Skills',
                    chapter: 'IQ Challenge',
                    score: Math.round((correctCount / iqTasks.length) * 100),
                    completedDate: today,
                    type: 'iq',
                    context: 'Part of AI Mission'
                });
            }
            
            if (eqTasks.length > 0) {
                const correctCount = getCorrectCountForType(eqTasks, selectedAnswers);
                recordsToSave.push({
                    subject: 'Emotional Intelligence',
                    chapter: 'EQ Challenge',
                    score: Math.round((correctCount / eqTasks.length) * 100),
                    completedDate: today,
                    type: 'eq',
                    context: 'Part of AI Mission'
                });
            }

            // Save all generated records
            for (const record of recordsToSave) {
                await savePerformanceRecord(student.id, record);
            }
            
            setIsFinished(true);

        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const getOptionStyle = (option: string) => {
        const selectedOption = selectedAnswers[currentIndex];
        if (!selectedOption) {
            return 'bg-surface border-border hover:bg-bg-primary hover:border-primary';
        }
        if (option === correctAnswer) {
            return 'bg-status-success border-status-success text-status-success';
        }
        if (option === selectedOption && option !== correctAnswer) {
            return 'bg-status-danger border-status-danger text-status-danger';
        }
        return 'bg-surface border-border opacity-60 cursor-not-allowed';
    };

    if (isFinished) {
        const totalCorrect = Object.keys(selectedAnswers).reduce((acc, key) => {
            const index = parseInt(key);
            if (selectedAnswers[index] === getCorrectAnswer(tasks[index])) {
                return acc + 1;
            }
            return acc;
        }, 0);
        const percentage = Math.round((totalCorrect / tasks.length) * 100);
        const isHighScorer = percentage >= 80;
        return (
             <div className="text-center animate-fade-in flex flex-col items-center">
                {isHighScorer && <div className="mb-4"><FittoAvatar state="celebrating" size={100} /></div>}
                <h2 className="text-3xl font-bold text-text-primary">{t('missionComplete')}</h2>
                <p className="text-lg text-text-secondary mt-2">{t('greatWork')}</p>
                <div className="text-5xl font-bold text-primary my-4">
                    {totalCorrect} / {tasks.length}
                </div>
                <button onClick={onFinish} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 btn-accent">
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

    const selectedOption = selectedAnswers[currentIndex];

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{taskTitle}</h2>
                    <p className="text-primary font-medium">{taskSubtitle}</p>
                </div>
                <div className="text-lg font-semibold text-text-secondary">
                    {t('question')} {currentIndex + 1} <span className="text-slate-500">/ {tasks.length}</span>
                </div>
            </div>

            <div>
                {isEQ(currentTask) && <p className="text-text-secondary italic mb-4">"{currentTask.scenario}"</p>}
                <p className="text-xl font-semibold text-text-primary mb-6">{currentTask.question}</p>
                <div className="space-y-4">
                    {currentTask.options.map((option, index) => (
                         <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={!!selectedOption}
                            aria-pressed={selectedOption === option}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center font-medium ${getOptionStyle(option)}`}
                        >
                             <span className={`h-6 w-6 rounded-full border-2 ${selectedOption === option ? 'border-current bg-current' : 'border-current'} mr-4 flex-shrink-0`}></span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {selectedOption && (
                 <div className="mt-6 animate-fade-in">
                     {selectedOption === correctAnswer ? (
                         <div className="flex items-center text-status-success font-bold text-lg">
                            <CheckCircleIcon aria-hidden="true" className="h-6 w-6 mr-2" /> {t('correct')}
                         </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center text-status-danger font-bold text-lg">
                                <XCircleIcon aria-hidden="true" className="h-6 w-6 mr-2" /> {t('incorrect')}
                            </div>
                            <p className="text-text-secondary">{t(isEQ(currentTask) ? 'bestResponse' : 'correctAnswerLabel')}: {correctAnswer}</p>
                        </div>
                    )}
                     <div className="mt-3 p-3 bg-surface rounded-md text-text-secondary flex items-start">
                        <LightBulbIcon aria-hidden="true" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary" />
                        <span><span className="font-semibold text-text-primary">{t('explanation')}:</span> {currentTask.explanation}</span>
                    </div>
                     <div className="text-right mt-6">
                         <button
                             onClick={handleNext}
                             className="px-8 py-3 btn-accent flex items-center ml-auto"
                        >
                            {currentIndex === tasks.length - 1 ? t('finish') : t('nextQuestion')}
                            <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </button>
                     </div>
                </div>
            )}
        </div>
    );
};
export default MissionQuiz;