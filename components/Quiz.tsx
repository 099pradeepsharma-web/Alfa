import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface QuizProps {
  questions: QuizQuestion[];
  onBack: () => void;
  chapterTitle: string;
  onFinish?: (result: { score: number, answers: {[key: number]: string} }) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onBack, chapterTitle, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const { t } = useLanguage();

  const handleAnswerSelect = (option: string) => {
    if (showResults) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
        return selectedAnswers[index] === question.correctAnswer ? score + 1 : score;
    }, 0);
  }

  const handleFinish = () => {
    if (onFinish) {
      onFinish({ score: calculateScore(), answers: selectedAnswers });
    } else {
      setShowResults(true);
    }
  };

  const renderResults = () => {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg animate-fade-in text-center border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('quizResults')}</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('chapter')}: {chapterTitle}</p>
            <div className={`mt-8 text-6xl font-bold ${percentage >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                {percentage}%
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-300 mt-2">{t('quizScoreSummary', { score, total: questions.length })}</p>

            <div className="mt-10 text-left">
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">{t('reviewAnswers')}</h3>
                {questions.map((q, index) => (
                    <div key={index} className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{index + 1}. {q.question}</p>
                        <p className="text-sm text-primary dark:text-indigo-400 font-medium my-1" style={{color: 'rgb(var(--c-primary))'}}>{t('concept')}: {q.conceptTitle}</p>
                        <p className={`mt-2 flex items-center ${selectedAnswers[index] === q.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                           {selectedAnswers[index] === q.correctAnswer ? <CheckCircleIcon aria-hidden="true" className="h-5 w-5 mr-2"/> : <XCircleIcon aria-hidden="true" className="h-5 w-5 mr-2"/>}
                           {t('yourAnswer')}: {selectedAnswers[index] || t('notAnswered')}
                        </p>
                        {selectedAnswers[index] !== q.correctAnswer && (
                            <p className="mt-1 flex items-center text-green-700 dark:text-green-400">
                                <CheckCircleIcon aria-hidden="true" className="h-5 w-5 mr-2"/>
                                {t('correctAnswerLabel')}: {q.correctAnswer}
                            </p>
                        )}
                        <div className="mt-2 p-3 bg-primary-light dark:bg-slate-900/50 rounded-md text-primary-dark/80 dark:text-slate-300 flex items-start" style={{backgroundColor: 'rgb(var(--c-primary-light))', color: 'rgba(var(--c-primary-dark), 0.9)'}}>
                          <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-1"/>
                          <span><span className="font-semibold">{t('explanation')}:</span> {q.explanation}</span>
                        </div>
                    </div>
                ))}
            </div>
             <button onClick={onBack} className="mt-8 flex items-center justify-center mx-auto px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToLesson')}
            </button>
        </div>
    )
  }

  if (showResults) return renderResults();

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToLesson')}
        </button>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('adaptiveQuiz')}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{chapterTitle}</p>
                </div>
                <div className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                    {t('question')} {currentQuestionIndex + 1} <span className="text-slate-400 dark:text-slate-500">/ {questions.length}</span>
                </div>
            </div>

            <div>
                <p className="text-sm text-primary dark:text-indigo-400 font-medium mb-2" style={{color: 'rgb(var(--c-primary))'}}>{t('testingConcept')}: {currentQuestion.conceptTitle}</p>
                <p className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">{currentQuestion.question}</p>
                <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            aria-pressed={selectedAnswers[currentQuestionIndex] === option}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center text-slate-800 dark:text-slate-200
                                ${selectedAnswers[currentQuestionIndex] === option 
                                    ? 'bg-primary-light/50 dark:bg-slate-900/50 border-primary ring-2 ring-primary/50' 
                                    : 'bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary'}
                            `}
                            style={{
                                borderColor: selectedAnswers[currentQuestionIndex] === option ? 'rgb(var(--c-primary))' : '',
                            }}
                        >
                            <span className={`h-6 w-6 rounded-full border-2 ${selectedAnswers[currentQuestionIndex] === option ? 'border-primary bg-primary' : 'border-slate-400 dark:border-slate-500'} mr-4 flex-shrink-0`} style={{borderColor: selectedAnswers[currentQuestionIndex] === option ? 'rgb(var(--c-primary))' : '', backgroundColor: selectedAnswers[currentQuestionIndex] === option ? 'rgb(var(--c-primary))' : 'transparent'}}></span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {t('previous')}
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="px-6 py-2 text-white font-semibold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {t('next')}
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        disabled={!selectedAnswers[currentQuestionIndex]}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {t('finishQuiz')}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default Quiz;