import React, { useState } from 'react';
import { Concept, Student, Grade, Subject, Chapter, StudentQuestion, FittoResponse } from '../types';
import { LightBulbIcon, BeakerIcon, ViewfinderCircleIcon, ExclamationTriangleIcon, ClockIcon, PaperAirplaneIcon, SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { saveStudentQuestion, updateStudentQuestion } from '../services/pineconeService';
import { getFittoAnswer } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

import LoadingSpinner from './LoadingSpinner';
import PracticeExercises from './PracticeExercises';
import { useLanguage } from '../contexts/Language-context';

interface ConceptCardProps {
  concept: Concept;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  language: string;
  imageUrl: string | null;
  isDiagramLoading: boolean;
  diagramError: string | null;
  progressStatus: 'not-started' | 'in-progress' | 'mastered';
  onMarkAsInProgress: () => void;
  renderText: (text: string) => React.ReactNode;
}

const ProgressBadge: React.FC<{ status: ConceptCardProps['progressStatus'] }> = ({ status }) => {
    const { t } = useLanguage();
    switch (status) {
        case 'mastered':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><CheckCircleSolid className="h-4 w-4 mr-1"/>{t('mastered')}</span>;
        case 'in-progress':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"><ClockIcon className="h-4 w-4 mr-1"/>{t('inProgress')}</span>;
        default:
            return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{t('notStarted')}</span>;
    }
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, grade, subject, chapter, language, imageUrl, isDiagramLoading, diagramError, progressStatus, onMarkAsInProgress, renderText }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const student = currentUser!;
  
  const [isAsking, setIsAsking] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fittoResponse, setFittoResponse] = useState<FittoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPractice, setShowPractice] = useState(false);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setFittoResponse(null);

    const newQuestion: StudentQuestion = {
        id: `q-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        grade: grade.level,
        subject: subject.name,
        chapter: chapter.title,
        concept: concept.conceptTitle,
        questionText: questionText.trim(),
        timestamp: new Date().toISOString(),
    };

    try {
        await saveStudentQuestion(newQuestion, language);
        
        const response = await getFittoAnswer(newQuestion, language);
        setFittoResponse(response);
        
        const updatedQuestion = { ...newQuestion, fittoResponse: response };
        await updateStudentQuestion(updatedQuestion, language);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
        setQuestionText("");
        setIsAsking(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-shadow hover:shadow-md not-prose">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <LightBulbIcon className="h-7 w-7 text-yellow-500 mr-3" />
            {concept.conceptTitle}
        </h3>
        <ProgressBadge status={progressStatus} />
      </div>
      
      <div className="text-slate-600 dark:text-slate-300 mb-4">{renderText(concept.explanation)}</div>
      
       {progressStatus === 'not-started' && (
        <div className="text-right mb-4">
            <button
                onClick={onMarkAsInProgress}
                className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm"
            >
                {t('markAsUnderstood')}
            </button>
        </div>
      )}

      <div className="bg-primary-light border-l-4 border-primary/50 p-4 rounded-r-lg mb-4" style={{backgroundColor: 'rgb(var(--c-primary-light))', borderColor: 'rgba(var(--c-primary), 0.5)'}}>
        <h4 className="font-semibold text-primary-dark flex items-center mb-2" style={{color: 'rgb(var(--c-primary-dark))'}}>
            <BeakerIcon className="h-5 w-5 mr-2" />
            {t('stemConnection')}
        </h4>
        <div className="text-primary-dark/80" style={{color: 'rgba(var(--c-primary-dark), 0.8)'}}>{renderText(concept.realWorldExample)}</div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center mb-2">
            <ViewfinderCircleIcon className="h-5 w-5 mr-2" />
            {t('visualDiagram')}
        </h4>
        <div role="status" className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center min-h-[200px] flex items-center justify-center bg-white dark:bg-slate-800">
            {isDiagramLoading && (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                    <div className="text-primary h-8 w-8" style={{color: 'rgb(var(--c-primary))'}}><LoadingSpinner /></div>
                    <p className="text-sm mt-2">{t('aiDrawingDiagram')}</p>
                </div>
            )}
            {diagramError && (
                <div className="text-red-500 dark:text-red-400 flex flex-col items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm font-semibold">{diagramError}</p>
                </div>
            )}
            {!isDiagramLoading && !diagramError && imageUrl && (
                <div>
                <img src={imageUrl} alt={concept.diagramDescription} className="rounded-md mx-auto mb-2 max-h-[300px] w-auto bg-white" />
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">{concept.diagramDescription}</p>
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-6">
        {showPractice ? (
            <PracticeExercises 
                concept={concept}
                grade={grade}
                subject={subject}
                chapter={chapter}
                language={language}
                onClose={() => setShowPractice(false)}
            />
        ) : (
             <div className="text-center">
                <button
                    onClick={() => setShowPractice(true)}
                    className="inline-flex items-center px-6 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
                    style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
                >
                    <PencilSquareIcon className="h-5 w-5 mr-2" />
                    {t('practiceThisConcept')}
                </button>
            </div>
        )}
      </div>

       {/* Q&A Section */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        {isSubmitting ? (
             <div role="status" className="p-3 text-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-lg animate-pulse font-semibold flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">{t('fittoIsThinking')}</span>
           </div>
        ) : error ? (
            <div role="status" className="p-3 text-center bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg">
                {error}
            </div>
        ) : fittoResponse ? (
            <div role="status" className="bg-white dark:bg-slate-700 rounded-lg p-4 animate-fade-in">
                <div className="flex items-start space-x-3">
                    <div className="bg-primary text-white rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center" style={{backgroundColor: 'rgb(var(--c-primary))'}}>
                        <SparklesIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h5 className="font-bold text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>
                            {t('fittoResponseTitle')}
                        </h5>
                        <p className="text-slate-700 dark:text-slate-200 mt-1">{fittoResponse.responseText}</p>
                    </div>
                </div>
            </div>
        ) : isAsking ? (
          <form onSubmit={handleSubmitQuestion} className="space-y-3 animate-fade-in">
            <label htmlFor={`question-${concept.conceptTitle}`} className="font-semibold text-slate-700 dark:text-slate-200 block">{t('yourQuestion')}:</label>
            <textarea
              id={`question-${concept.conceptTitle}`}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={t('askQuestionPlaceholder')}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition"
              rows={3}
            />
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsAsking(false)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">
                {t('cancel')}
              </button>
              <button type="submit" className="flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark transition" style={{backgroundColor: 'rgb(var(--c-primary))'}}>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {t('submitQuestion')}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <button onClick={() => setIsAsking(true)} className="flex items-center mx-auto text-sm font-semibold text-primary-dark hover:text-primary-dark/80 transition" style={{color: 'rgb(var(--c-primary-dark))'}}>
              <SparklesIcon className="h-5 w-5 mr-1.5" />
              {t('askFitto')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptCard;