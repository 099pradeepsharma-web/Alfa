import React, { useState, useMemo } from 'react';
import { QuestionBankItem, Grade, Subject, Chapter } from '../types';
// FIX: The function is exported from questionBankService, not geminiService.
import { generateQuestionBankQuestions } from '../services/questionBankService';
import { CURRICULUM } from '../data/curriculum';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, SparklesIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface QuestionBankScreenProps {
  onBack: () => void;
}

const Tag: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => (
    <span className={`metadata-tag ${className}`}>
        {text}
    </span>
);

const QuestionCard: React.FC<{ question: QuestionBankItem }> = ({ question }) => {
    const { t } = useLanguage();

    const difficultyColors: { [key: string]: string } = {
        Easy: 'bg-green-900/50 text-green-300',
        Medium: 'bg-yellow-900/50 text-yellow-300',
        Hard: 'bg-red-900/50 text-red-300',
    };

    const bloomColors: { [key: string]: string } = {
        Remembering: 'bg-sky-900/50 text-sky-300',
        Understanding: 'bg-blue-900/50 text-blue-300',
        Applying: 'bg-indigo-900/50 text-indigo-300',
        Analyzing: 'bg-purple-900/50 text-purple-300',
        Evaluating: 'bg-fuchsia-900/50 text-fuchsia-300',
        Creating: 'bg-rose-900/50 text-rose-300',
    };

    return (
        <div className="bg-surface p-4 rounded-lg border border-border">
            <p className="font-semibold text-text-primary mb-3">{question.questionText}</p>
            
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                <Tag text={t(question.questionType.toLowerCase().replace(' ', ''))} className="bg-slate-600 text-slate-200" />
                <Tag text={t(question.difficulty.toLowerCase())} className={difficultyColors[question.difficulty]} />
                <Tag text={question.bloomTaxonomy} className={bloomColors[question.bloomTaxonomy]} />
                {question.isCompetencyBased && <Tag text={t('competencyBased')} className="bg-teal-900/50 text-teal-300" />}
                {question.isPreviousYearQuestion && <Tag text={t('previousYearQuestion')} className="bg-amber-900/50 text-amber-300" />}
            </div>

            {question.questionType === 'MCQ' && (
                <div className="space-y-2">
                    {question.options.map(opt => (
                        <p key={opt} className={`px-3 py-1.5 rounded-md text-sm border ${
                            opt === question.correctAnswer 
                            ? 'bg-green-900/30 border-green-700 font-semibold text-green-200' 
                            : 'bg-bg-primary border-border'}`
                        }>{opt}</p>
                    ))}
                     <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark">{t('explanation')}</summary>
                        <div className="mt-2 p-3 bg-bg-primary rounded-md text-text-secondary">
                            <p>{question.explanation}</p>
                        </div>
                    </details>
                </div>
            )}

            {(question.questionType === 'Short Answer' || question.questionType === 'Long Answer') && (
                <div className="space-y-3">
                     <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark">{t('modelAnswer')}</summary>
                        <div className="mt-2 p-3 bg-bg-primary rounded-md text-text-secondary">
                            <p className="whitespace-pre-wrap">{question.modelAnswer}</p>
                        </div>
                    </details>
                     <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark">{t('markingScheme')}</summary>
                        <div className="mt-2 p-3 bg-bg-primary rounded-md text-text-secondary">
                             <p className="whitespace-pre-wrap">{question.markingScheme}</p>
                        </div>
                    </details>
                    {question.answerWritingGuidance && (
                         <details className="text-sm">
                            <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark">{t('answerWritingGuidance')}</summary>
                            <div className="mt-2 p-3 bg-indigo-900/40 rounded-md text-indigo-200">
                                 <p className="whitespace-pre-wrap">{question.answerWritingGuidance}</p>
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};


const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({ onBack }) => {
    const { t, tCurriculum, language } = useLanguage();

    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

    const [questions, setQuestions] = useState<QuestionBankItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableGrades = useMemo(() => CURRICULUM.filter(g => parseInt(g.level.split(' ')[1]) >= 6), []);

    const handleGenerate = async () => {
        if (!selectedGrade || !selectedSubject || !selectedChapter) return;
        setIsLoading(true);
        setError(null);
        setQuestions(null);
        try {
            const results = await generateQuestionBankQuestions(selectedGrade.level, selectedSubject.name, selectedChapter.title, language);
            if (results.length === 0) {
                setError(t('noQuestionsGenerated'));
            } else {
                setQuestions(results);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
             <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center border-b border-border pb-6 mb-6">
                    <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('questionBankTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('questionBankPrompt')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Grade Selector */}
                    <select
                        value={selectedGrade?.level || ''}
                        onChange={(e) => {
                            setSelectedGrade(availableGrades.find(g => g.level === e.target.value) || null);
                            setSelectedSubject(null);
                            setSelectedChapter(null);
                        }}
                        className="w-full"
                    >
                        <option value="" disabled>{t('selectGradePlaceholder')}</option>
                        {availableGrades.map(g => <option key={g.level} value={g.level}>{tCurriculum(g.level)}</option>)}
                    </select>

                    {/* Subject Selector */}
                    <select
                        value={selectedSubject?.name || ''}
                        disabled={!selectedGrade}
                        onChange={(e) => {
                            setSelectedSubject(selectedGrade?.subjects.find(s => s.name === e.target.value) || null);
                            setSelectedChapter(null);
                        }}
                        className="w-full disabled:opacity-50"
                    >
                        <option value="" disabled>{t('selectSubjectPrompt')}</option>
                        {selectedGrade?.subjects.map(s => <option key={s.name} value={s.name}>{tCurriculum(s.name)}</option>)}
                    </select>

                    {/* Chapter Selector */}
                    <select
                        value={selectedChapter?.title || ''}
                        disabled={!selectedSubject}
                        onChange={(e) => setSelectedChapter(selectedSubject?.chapters.find(c => c.title === e.target.value) || null)}
                         className="w-full disabled:opacity-50"
                    >
                        <option value="" disabled>{t('selectChapterPlaceholder')}</option>
                        {selectedSubject?.chapters.map(c => <option key={c.title} value={c.title}>{tCurriculum(c.title)}</option>)}
                    </select>
                </div>
                
                <div className="text-center mb-6">
                     <button
                        onClick={handleGenerate}
                        disabled={!selectedChapter || isLoading}
                        className="flex items-center justify-center w-full md:w-auto md:mx-auto btn-accent"
                    >
                        {isLoading ? (
                            <><LoadingSpinner /><span className="ml-2">{t('generatingQuestions')}</span></>
                        ) : (
                             <><SparklesIcon className="h-5 w-5 mr-2"/><span>{t('generateQuestions')}</span></>
                        )}
                    </button>
                </div>
                
                {error && <p className="text-red-400 text-center font-semibold">{error}</p>}
                
                {questions && (
                    <div className="mt-8 pt-6 border-t border-border space-y-4 max-h-[800px] overflow-y-auto pr-2">
                        {questions.map((q, index) => (
                            <QuestionCard key={index} question={q} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBankScreen;