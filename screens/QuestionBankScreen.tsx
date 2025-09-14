import React, { useState, useMemo } from 'react';
import { QuestionBankItem, Grade, Subject, Chapter } from '../types';
import { generateQuestionBankQuestions } from '../services/questionBankService';
import { CURRICULUM } from '../data/curriculum';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, SparklesIcon, DocumentMagnifyingGlassIcon, CheckBadgeIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface QuestionBankScreenProps {
  onBack: () => void;
}

const Tag: React.FC<{ text: string, color: string }> = ({ text, color }) => (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
        {text}
    </span>
);

const QuestionCard: React.FC<{ question: QuestionBankItem }> = ({ question }) => {
    const { t } = useLanguage();

    const difficultyColors: { [key: string]: string } = {
        Easy: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
        Medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
        Hard: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    };

    const bloomColors: { [key: string]: string } = {
        Remembering: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
        Understanding: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
        Applying: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
        Analyzing: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
        Evaluating: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300',
        Creating: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-800 dark:text-slate-100 mb-3">{question.questionText}</p>
            
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                <Tag text={t(question.questionType.toLowerCase().replace(' ', ''))} color="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200" />
                <Tag text={t(question.difficulty.toLowerCase())} color={difficultyColors[question.difficulty]} />
                <Tag text={t(question.bloomTaxonomy.toLowerCase())} color={bloomColors[question.bloomTaxonomy]} />
                {question.isCompetencyBased && <Tag text={t('competencyBased')} color="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300" />}
                {question.isPreviousYearQuestion && <Tag text={t('previousYearQuestion')} color="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" />}
            </div>

            {question.questionType === 'MCQ' && (
                <div className="space-y-2">
                    {question.options.map(opt => (
                        <p key={opt} className={`px-3 py-1.5 rounded-md text-sm border ${
                            opt === question.correctAnswer 
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 font-semibold text-green-800 dark:text-green-200' 
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`
                        }>{opt}</p>
                    ))}
                     <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>{t('explanation')}</summary>
                        <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                            <p>{question.explanation}</p>
                        </div>
                    </details>
                </div>
            )}

            {(question.questionType === 'Short Answer' || question.questionType === 'Long Answer') && (
                <div className="space-y-3">
                     <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>{t('modelAnswer')}</summary>
                        <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                            <p className="whitespace-pre-wrap">{question.modelAnswer}</p>
                        </div>
                    </details>
                     <details className="text-sm">
                        <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>{t('markingScheme')}</summary>
                        <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                             <p className="whitespace-pre-wrap">{question.markingScheme}</p>
                        </div>
                    </details>
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
             <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                    <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{t('questionBankTitle')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">{t('questionBankPrompt')}</p>
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
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
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
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50"
                    >
                        <option value="" disabled>{t('selectSubjectPrompt')}</option>
                        {selectedGrade?.subjects.map(s => <option key={s.name} value={s.name}>{tCurriculum(s.name)}</option>)}
                    </select>

                    {/* Chapter Selector */}
                    <select
                        value={selectedChapter?.title || ''}
                        disabled={!selectedSubject}
                        onChange={(e) => setSelectedChapter(selectedSubject?.chapters.find(c => c.title === e.target.value) || null)}
                         className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50"
                    >
                        <option value="" disabled>{t('selectChapterPlaceholder')}</option>
                        {selectedSubject?.chapters.map(c => <option key={c.title} value={c.title}>{tCurriculum(c.title)}</option>)}
                    </select>
                </div>
                
                <div className="text-center mb-6">
                     <button
                        onClick={handleGenerate}
                        disabled={!selectedChapter || isLoading}
                        className="flex items-center justify-center w-full md:w-auto md:mx-auto px-8 py-3 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <><LoadingSpinner /><span className="ml-2">{t('generatingQuestions')}</span></>
                        ) : (
                             <><SparklesIcon className="h-5 w-5 mr-2"/><span>{t('generateQuestions')}</span></>
                        )}
                    </button>
                </div>
                
                {error && <p className="text-red-500 dark:text-red-400 text-center font-semibold">{error}</p>}
                
                {questions && (
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4 max-h-[800px] overflow-y-auto pr-2">
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