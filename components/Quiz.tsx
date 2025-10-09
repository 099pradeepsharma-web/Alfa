import React, { useState, useMemo } from 'react';
import { QuizQuestion } from '../types';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface QuizProps {
  questions: QuizQuestion[];
  onBack: () => void;
  chapterTitle: string;
  onFinish?: (result: { score: number, answers: {[key: number]: string} }) => void;
  onLogEvent?: (eventName: string, attributes: any) => void;
  isPostTest?: boolean;
}

const Quiz: React.FC<QuizProps> = React.memo(({ questions, onBack, chapterTitle, onFinish, onLogEvent, isPostTest }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const { t } = useLanguage();
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
  
  const isCurrentQuestionAnswered = useMemo(() => selectedAnswers.hasOwnProperty(currentQuestionIndex), [selectedAnswers, currentQuestionIndex]);

  const handleAnswerSelect = (option: string) => {
    if (isCurrentQuestionAnswered) return;

    const newAnswers = { ...selectedAnswers, [currentQuestionIndex]: option };
    setSelectedAnswers(newAnswers);

    if (onLogEvent) {
        const question = questions[currentQuestionIndex];
        const isCorrect = option === question.correctAnswer;
        onLogEvent('item_attempt', {
            item_id: question.question,
            item_type: 'quiz_question',
            correctness: isCorrect ? 1 : 0,
            attempt_index: 1, // Simple implementation
            response_time: null // Not tracked in this version
        });
    }
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
    const finalScore = calculateScore();
    const percentage = Math.round((finalScore / questions.length) * 100);
    
    if (isPostTest && onLogEvent) {
        onLogEvent('posttest_submitted', {
            score: percentage,
            item_ids: questions.map(q => q.question)
        });
    }
    
    // For non-post-test quizzes, we show results.
    // For post-tests, the parent component handles completion.
    if (!isPostTest) {
        setShowResults(true);
    }

    if (onFinish) {
      onFinish({ score: percentage, answers: selectedAnswers });
    }
  };

  type ResultsByConceptType = Record<string, { correct: number, total: number, questions: (QuizQuestion & { userAnswer?: string, isCorrect: boolean })[] }>;
  
  const resultsByConcept = useMemo(() => {
      if (!showResults) return {};
      return questions.reduce((acc: ResultsByConceptType, question, index) => {
          const concept = question.conceptTitle;
          if (!acc[concept]) {
              acc[concept] = { correct: 0, total: 0, questions: [] };
          }
          acc[concept].total++;
          const isCorrect = selectedAnswers[index] === question.correctAnswer;
          if (isCorrect) {
              acc[concept].correct++;
          }
          acc[concept].questions.push({ ...question, userAnswer: selectedAnswers[index], isCorrect });
          return acc;
      }, {} as ResultsByConceptType);
  }, [questions, selectedAnswers, showResults]);

  const questionsToReview = useMemo(() => {
      if (!showResults) return [];
      const allQuestions = questions.map((q, index) => ({
          ...q,
          userAnswer: selectedAnswers[index],
          isCorrect: selectedAnswers[index] === q.correctAnswer
      }));
      return showIncorrectOnly ? allQuestions.filter(q => !q.isCorrect) : allQuestions;
  }, [showIncorrectOnly, questions, selectedAnswers, showResults]);


  const renderResults = () => {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
        <div className="dashboard-highlight-card p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-text-primary text-center">{t('masteryCheckpointTitle')}</h2>
            <p className="text-lg text-text-secondary mt-1 text-center">{t('chapter')}: {chapterTitle}</p>
            
            <div className="text-center my-8">
                <div className={`text-6xl font-bold ${percentage > 70 ? 'text-status-success' : 'text-status-danger'}`}>{percentage}%</div>
                <p className="text-xl text-text-secondary mt-2">{t('quizScoreSummary', { score, total: questions.length })}</p>
            </div>

            <div className="mt-10 text-left">
                <h3 className="text-2xl font-bold text-text-primary mb-4">{t('performanceByConcept')}</h3>
                <div className="bg-bg-primary p-4 rounded-lg">
                    {Object.keys(resultsByConcept).map((concept) => {
                        const data = resultsByConcept[concept];
                        const conceptScore = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                        return (
                            <div key={concept}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-text-secondary">{concept}</span>
                                    <span className="font-bold text-text-primary">{data.correct}/{data.total}</span>
                                </div>
                                <div className="w-full bg-surface rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${conceptScore}%`, backgroundColor: 'rgb(var(--c-primary))' }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mt-10 text-left">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-text-primary">{t('reviewAnswers')}</h3>
                    <label className="flex items-center text-sm font-semibold cursor-pointer text-text-secondary">
                        <input type="checkbox" checked={showIncorrectOnly} onChange={() => setShowIncorrectOnly(!showIncorrectOnly)} className="h-4 w-4 rounded mr-2 bg-surface border-border text-primary focus:ring-primary" />
                        {t('showIncorrectOnly')}
                    </label>
                </div>
                {questionsToReview.map((q, index) => (
                    <div key={index} className="mb-6 p-4 border border-border rounded-lg bg-bg-primary">
                        <p className="font-semibold text-text-primary">{index + 1}. {q.question}</p>
                        <p className="text-sm text-text-secondary font-medium my-1">{t('concept')}: {q.conceptTitle}</p>
                        <p className={`mt-2 flex items-center ${q.isCorrect ? 'text-text-primary' : 'text-text-secondary'}`}>
                           {q.isCorrect ? <CheckCircleIcon aria-hidden="true" className="h-5 w-5 mr-2 text-status-success"/> : <XCircleIcon aria-hidden="true" className="h-5 w-5 mr-2 text-status-danger"/>}
                           {t('yourAnswer')}: {q.userAnswer || t('notAnswered')}
                        </p>
                        {!q.isCorrect && (
                            <p className="mt-1 flex items-center text-text-primary">
                                <CheckCircleIcon aria-hidden="true" className="h-5 w-5 mr-2 text-status-success"/>
                                {t('correctAnswerLabel')}: {q.correctAnswer}
                            </p>
                        )}
                        <div className="mt-2 p-3 bg-surface rounded-md text-text-secondary flex items-start">
                          <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-1 text-primary"/>
                          <span><span className="font-semibold text-text-primary">{t('explanation')}:</span> {q.explanation}</span>
                        </div>
                    </div>
                ))}
            </div>
             <button onClick={onBack} className="mt-8 flex items-center justify-center mx-auto px-6 py-3 btn-accent">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToLesson')}
            </button>
        </div>
    )
  }

  if (showResults) return renderResults();

  const currentQuestion = questions[currentQuestionIndex];
  
  const getOptionStyle = (option: string) => {
      if (!isCurrentQuestionAnswered) {
          return 'bg-surface border-border text-text-primary hover:border-primary';
      }
      const isCorrect = option === currentQuestion.correctAnswer;
      const isSelected = selectedAnswers[currentQuestionIndex] === option;

      if (isCorrect) return 'bg-status-success border-status-success text-status-success';
      if (isSelected && !isCorrect) return 'bg-status-danger border-status-danger text-status-danger';
      return 'bg-surface border-border opacity-60';
  };

  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToLesson')}
        </button>
        <div className="dashboard-highlight-card p-8">
            <div className="flex justify-between items-center border-b border-border-color pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">{t('adaptiveQuiz')}</h2>
                    <p className="text-text-secondary">{chapterTitle}</p>
                </div>
                <div className="text-lg font-semibold text-text-secondary">
                    {t('question')} {currentQuestionIndex + 1} <span className="text-slate-600">/ {questions.length}</span>
                </div>
            </div>

            <div>
                <p className="text-sm text-text-secondary font-medium mb-2">{t('testingConcept')}: {currentQuestion.conceptTitle}</p>
                <p className="text-xl font-semibold text-text-primary mb-6">{currentQuestion.question}</p>
                <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={isCurrentQuestionAnswered}
                            aria-pressed={selectedAnswers[currentQuestionIndex] === option}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center ${getOptionStyle(option)}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {isCurrentQuestionAnswered && (
                     <div className="mt-4 p-3 bg-surface rounded-md text-text-secondary flex items-start animate-fade-in">
                      <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-1 text-primary"/>
                      <span><span className="font-semibold text-text-primary">{t('explanation')}:</span> {currentQuestion.explanation}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm border border-border-color hover:bg-bg-primary transition disabled:opacity-50"
                >
                    {t('previous')}
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <button
                        onClick={handleFinish}
                        disabled={!isCurrentQuestionAnswered}
                        className="px-6 py-2 btn-accent disabled:opacity-50"
                    >
                        {t('finishQuiz')}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={!isCurrentQuestionAnswered}
                        className="px-6 py-2 btn-accent disabled:opacity-50"
                    >
                        {t('next')}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
});

export default Quiz;
