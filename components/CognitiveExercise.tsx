import React, { useState } from 'react';
import { IQExercise, EQExercise, Student, PerformanceRecord } from '../types';
import { savePerformanceRecord } from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
import { LightBulbIcon, XCircleIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface CognitiveExerciseProps {
  exercises: (IQExercise | EQExercise)[];
  exerciseType: 'iq' | 'eq';
  student: Student;
  onFinish: () => void;
}

const CognitiveExercise: React.FC<CognitiveExerciseProps> = ({ exercises, exerciseType, student, onFinish }) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const currentExercise = exercises[currentIndex];
  const isIQ = (exercise: IQExercise | EQExercise): exercise is IQExercise => exerciseType === 'iq';
  const correctAnswer = isIQ(currentExercise) ? currentExercise.correctAnswer : currentExercise.bestResponse;

  const handleAnswerSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    if (option === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    const isLastQuestion = currentIndex === exercises.length - 1;
    if (isLastQuestion) {
      // Recalculate score ensuring the last answer is included
      const finalCorrectAnswers = score + (selectedOption === correctAnswer && !isFinished ? 1 : 0);
      const finalScore = Math.round((finalCorrectAnswers / exercises.length) * 100);
      
      const newRecord: PerformanceRecord = {
        subject: exerciseType === 'iq' ? 'Cognitive Skills' : 'Emotional Intelligence',
        chapter: 'Daily Exercise',
        score: finalScore,
        completedDate: new Date().toISOString(),
        type: exerciseType,
        context: currentExercise.skill,
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
    const finalScore = score;
    return (
      <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('missionComplete')}</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">{t('greatWork')}</p>
          <div className="text-5xl font-bold text-primary my-4" style={{color: 'rgb(var(--c-primary))'}}>
            {finalScore} / {exercises.length}
          </div>
          <button onClick={onFinish} className="mt-4 flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition">
              {t('backToDashboard')}
          </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center border-b dark:border-slate-600 pb-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {exerciseType === 'iq' ? t('iqChallenge') : t('eqChallenge')}
                </h2>
                <p className="text-primary font-medium" style={{color: 'rgb(var(--c-primary))'}}>{t('skill')}: {currentExercise.skill}</p>
            </div>
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                {currentIndex + 1} <span className="text-slate-400 dark:text-slate-500">/ {exercises.length}</span>
            </div>
        </div>

        <div>
            {!isIQ(currentExercise) && <p className="text-slate-500 dark:text-slate-400 italic mb-4">"{currentExercise.scenario}"</p>}
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">{currentExercise.question}</p>
            <div className="space-y-4">
                {currentExercise.options.map((option, index) => (
                     <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={!!selectedOption}
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
                        <CheckCircleIcon className="h-6 w-6 mr-2" /> {t('correct')}
                     </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-lg">
                            <XCircleIcon className="h-6 w-6 mr-2" /> {t('incorrect')}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{t(isIQ(currentExercise) ? 'correctAnswerLabel' : 'bestResponse')}: {correctAnswer}</p>
                    </div>
                )}
                 <div className="mt-3 p-3 bg-primary-light dark:bg-slate-700/50 rounded-md text-primary-dark/80 dark:text-slate-300 flex items-start">
                    <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <span><span className="font-semibold">{t('explanation')}:</span> {currentExercise.explanation}</span>
                </div>
                 <div className="text-right mt-6">
                     <button
                         onClick={handleNext}
                         className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-dark transition flex items-center ml-auto"
                         style={{backgroundColor: 'rgb(var(--c-primary))'}}
                    >
                        {currentIndex === exercises.length - 1 ? t('finishPractice') : t('nextQuestion')}
                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </button>
                 </div>
            </div>
        )}
    </div>
  );
};

export default CognitiveExercise;