




import React, { useState } from 'react';
import { QuizQuestion, Concept, Student, Grade, Subject, Chapter, PerformanceRecord } from '../types';
import { generatePracticeExercises } from '../services/geminiService';
import { savePerformanceRecord } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { LightBulbIcon, XCircleIcon, CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';

interface PracticeExercisesProps {
  concept: Concept;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  language: string;
  onClose: () => void;
  onMastered: () => void;
}

const PracticeExercises: React.FC<PracticeExercisesProps> = ({ concept, grade, subject, chapter, language, onClose, onMastered }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const student = currentUser!;
  
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
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
      const score = Math.round((correctAnswers / questions!.length) * 100);
      const newRecord: PerformanceRecord = {
        subject: subject.name,
        chapter: chapter.title,
        score: score,
        completedDate: new Date().toISOString(),
        type: 'exercise',
        context: concept.conceptTitle,
      };
      await savePerformanceRecord(student.id, newRecord);
      
      if (score >= 75) { 
        onMastered();
      }
      setIsFinished(true);

    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    }
  };
  
  const getOptionStyle = (option: string) => {
    if (!selectedOption) {
        return 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-primary';
    }
    const isCorrect = option === questions![currentQuestionIndex].correctAnswer;
    const isSelected = option === selectedOption;

    if (isCorrect) {
        return 'bg-green-100 dark:bg-green-900/50 border-green-500 ring-2 ring-green-300';
    }
    if (isSelected && !isCorrect) {
        return 'bg-red-100 dark:bg-red-900/50 border-red-500 ring-2 ring-red-300';
    }
    return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-70';
  };
  
  if (isFinished) {
    return (
      <div className="mt-4 p-4 border-t-2 border-dashed dark:border-slate-600 text-center animate-fade-in">
          <h4 className="text-xl font-bold text-slate-700 dark:text-slate-100">{t('exerciseSummary')}</h4>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('yourScore')}:</p>
          <div className="text-4xl font-bold text-primary my-2" style={{color: 'rgb(var(--c-primary))'}}>{correctAnswers} / {questions?.length}</div>
          <button onClick={onClose} className="mt-3 px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
              {t('close')}
          </button>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 border-t-2 border-dashed dark:border-slate-600 animate-fade-in">
        {!questions && (
             <div className="text-center">
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="flex items-center justify-center mx-auto px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    style={{backgroundColor: 'rgb(var(--c-primary))'}}
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
                 {error && <p className="text-red-500 dark:text-red-400 mt-3">{error}</p>}
             </div>
        )}

        {questions && questions.length > 0 && (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-100">{t('practiceThisConcept')}</h4>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{currentQuestionIndex + 1} / {questions.length}</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-4">{questions[currentQuestionIndex].question}</p>
                <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map(option => (
                         <button
                            key={option}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={!!selectedOption}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center text-slate-800 dark:text-slate-200 ${getOptionStyle(option)}`}
                        >
                            <span className={`h-5 w-5 rounded-full border-2 ${selectedOption === option ? 'border-primary bg-primary' : 'border-slate-400 dark:border-slate-500'} mr-3 flex-shrink-0`} style={{borderColor: selectedOption === option ? 'rgb(var(--c-primary))' : '', backgroundColor: selectedOption === option ? 'rgb(var(--c-primary))' : ''}}></span>
                            {option}
                        </button>
                    ))}
                </div>
                {selectedOption && (
                     <div className="mt-4 animate-fade-in">
                        {selectedOption === questions[currentQuestionIndex].correctAnswer ? (
                             <div className="flex items-center text-green-600 dark:text-green-400 font-bold">
                                <CheckCircleIcon className="h-6 w-6 mr-2" /> {t('correct')}
                             </div>
                        ) : (
                            <div className="flex items-center text-red-600 dark:text-red-400 font-bold">
                                <XCircleIcon className="h-6 w-6 mr-2" /> {t('incorrect')}
                             </div>
                        )}
                         <div className="mt-2 p-3 bg-primary-light dark:bg-slate-700/50 rounded-md text-primary-dark/80 dark:text-slate-300 flex items-start">
                            <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                            <span><span className="font-semibold">{t('explanation')}:</span> {questions[currentQuestionIndex].explanation}</span>
                        </div>
                         <div className="text-right mt-4">
                             <button
                                 onClick={handleNext}
                                 className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-dark transition"
                                 style={{backgroundColor: 'rgb(var(--c-primary))'}}
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