import React, { useState, useMemo, useEffect } from 'react';
import { LearningModule } from '../types';
import { useLanguage } from '../contexts/Language-context';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import StructuredText from './StructuredText';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { BookText, ListChecks, BrainCircuit, Sparkles } from 'lucide-react';

interface MigaStudyNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  learningModule: LearningModule;
  language: string;
}

const MigaStudyNotebookModal: React.FC<MigaStudyNotebookModalProps> = ({
  isOpen,
  onClose,
  learningModule,
  language,
}) => {
  const { t } = useLanguage();
  const [notebookQuery, setNotebookQuery] = useState('');
  const [notebookOutput, setNotebookOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapterText = useMemo(() => {
    return learningModule.coreConceptTraining
      .map(lesson => `## ${lesson.title}\n${lesson.explanation}`)
      .join('\n\n');
  }, [learningModule]);

  const handleAction = async (task: 'summarize' | 'glossary' | 'questions' | 'custom', customPrompt: string | null = null) => {
    setIsLoading(true);
    setError(null);
    setNotebookOutput('');
    try {
      const result = await geminiService.generateChapterInsights(chapterText, task, customPrompt, language);
      setNotebookOutput(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookQuery.trim()) return;
    handleAction('custom', notebookQuery);
    setNotebookQuery('');
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notebook-title">
      <div className="modal-content w-full h-full max-w-6xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-border">
          <h2 id="notebook-title" className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            {t('aiStudyNotebook')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 transition">
            <XMarkIcon className="h-6 w-6 text-text-secondary" />
          </button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-hidden">
          {/* Left Column: Chapter Content */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="flex-shrink-0 font-bold text-text-primary mb-2">Chapter Content: {learningModule.chapterTitle}</h3>
            <div className="flex-grow overflow-y-auto bg-bg-primary p-4 rounded-lg border border-border">
              <div className="prose prose-sm max-w-none prose-invert">
                <StructuredText text={chapterText} />
              </div>
            </div>
          </div>
          {/* Right Column: Interaction */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex-shrink-0 space-y-3">
                <p className="text-sm text-text-secondary">{t('aiStudyNotebookDesc')}</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleAction('summarize')} className="ai-notebook-action-btn"><BookText size={14} className="mr-1.5"/>{t('generateSummary')}</button>
                    <button onClick={() => handleAction('glossary')} className="ai-notebook-action-btn"><ListChecks size={14} className="mr-1.5"/>{t('keyTermsGlossary')}</button>
                    <button onClick={() => handleAction('questions')} className="ai-notebook-action-btn"><BrainCircuit size={14} className="mr-1.5"/>{t('generatePracticeQuestions')}</button>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        type="text"
                        value={notebookQuery}
                        onChange={(e) => setNotebookQuery(e.target.value)}
                        placeholder={t('askAboutChapter')}
                        className="flex-grow !text-sm"
                        disabled={isLoading}
                    />
                    <button type="submit" className="btn-accent p-2.5 flex-shrink-0" disabled={isLoading || !notebookQuery.trim()}>
                        {isLoading ? <LoadingSpinner /> : <PaperAirplaneIcon className="h-4 w-4" />}
                    </button>
                </form>
            </div>
            <div className="flex-grow mt-4 overflow-y-auto ai-notebook-output">
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-text-secondary h-full">
                        <LoadingSpinner />
                        <span>{t('generatingInsight')}...</span>
                    </div>
                )}
                {error && <p className="text-status-danger text-sm">{error}</p>}
                {notebookOutput && (
                    <div className="prose prose-sm max-w-none prose-invert">
                        <StructuredText text={notebookOutput} />
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigaStudyNotebookModal;
