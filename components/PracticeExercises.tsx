import React, { useState } from 'react';
import { QuizQuestion, Concept, Grade, Subject, Chapter } from '../types';
import { generatePracticeExercises } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/Language-context';
import { LightBulbIcon, XCircleIcon, CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';

interface PracticeExercisesProps {
  concept: Concept;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  language: string;
  onResult: (score: number, correctCount: number) => void;
}

const PracticeExercises: React.FC<PracticeExercisesProps> = ({ concept, grade, language, onResult }) => {
  const { t } = useLanguage();
  
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedQuestions = await generatePracticeExercises(concept, grade.level, language);
      setQuestions(generatedQuestions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    if (option === questions![currentQuestionIndex].correctAnswer) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    const isLastQuestion = currentQuestionIndex === questions!.length - 1;
    if (isLastQuestion) {
       const scorePercentage = Math.round((correctAnswers / questions!.length) * 100);
       onResult(scorePercentage, correctAnswers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    }
  };
  
  const getOptionStyle = (option: string) => {
    if (!selectedOption) {
        return 'bg-surface border-border hover:bg-bg-primary hover:border-primary';
    }
    const isCorrect = option === questions![currentQuestionIndex].correctAnswer;
    const isSelected = option === selectedOption;

    if (isCorrect) {
        return 'bg-green-900/30 border-green-500 ring-2 ring-green-400/50';
    }
    if (isSelected && !isCorrect) {
        return 'bg-red-900/30 border-red-500 ring-2 ring-red-400/50';
    }
    return 'bg-surface border-border opacity-60';
  };

  return (
    <div className="mt-4 p-4 border-t-2 border-dashed border-border animate-fade-in">
        {!questions && (
             <div className="text-center">
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="flex items-center justify-center mx-auto px-6 py-3 btn-accent disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                     {isLoading ? (
                         <>
                             <LoadingSpinner />
                             <span className="ml-2">{t('generatingExercises')}</span>
                         </>
                     ) : (
                         <>
                             <RocketLaunchIcon className="h-5 w-5 mr-2" />
                             <span>{t('generateExercises')}</span>
                         </>
                     )}
                 </button>
                 {error && <p className="text-red-400 mt-3">{error}</p>}
             </div>
        )}

        {questions && questions.length > 0 && (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-text-primary">{t('practiceThisConcept')}</h4>
                    <span className="text-sm font-semibold text-text-secondary">{currentQuestionIndex + 1} / {questions.length}</span>
                </div>
                <p className="font-semibold text-text-primary mb-4">{questions[currentQuestionIndex].question}</p>
                <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map(option => (
                         <button
                            key={option}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={!!selectedOption}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center text-text-primary ${getOptionStyle(option)}`}
                        >
                            <span className={`h-5 w-5 rounded-full border-2 ${selectedOption === option ? 'border-primary bg-primary' : 'border-slate-500'} mr-3 flex-shrink-0`}></span>
                            {option}
                        </button>
                    ))}
                </div>
                {selectedOption && (
                     <div className="mt-4 animate-fade-in">
                        {selectedOption === questions[currentQuestionIndex].correctAnswer ? (
                             <div className="flex items-center text-green-400 font-bold">
                                <CheckCircleIcon className="h-6 w-6 mr-2" /> {t('correct')}
                             </div>
                        ) : (
                            <div className="flex items-center text-red-400 font-bold">
                                <XCircleIcon className="h-6 w-6 mr-2" /> {t('incorrect')}
                             </div>
                        )}
                         <div className="mt-2 p-3 bg-slate-900/50 rounded-md text-text-secondary flex items-start">
                            <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary"/>
                            <span><span className="font-semibold text-text-primary">{t('explanation')}:</span> {questions[currentQuestionIndex].explanation}</span>
                        </div>
                         <div className="text-right mt-4">
                             <button
                                 onClick={handleNext}
                                 className="px-6 py-2 btn-accent"
                            >
                                {currentQuestionIndex === questions.length - 1 ? t('finishPractice') : t('nextQuestion')}
                            </button>
                         </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default PracticeExercises;