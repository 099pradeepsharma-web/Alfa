import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, AcademicCapIcon, DocumentTextIcon, ClockIcon, PaperAirplaneIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, DocumentCheckIcon, FlagIcon, CpuChipIcon } from '@heroicons/react/24/solid';
import { Eye, PlayCircle, Send, CheckCircle } from 'lucide-react';
import { Student, BoardPaper, WrittenAnswerEvaluation, BoardPaperQuestion } from '../types';
import { BOARD_PAPERS } from '../data/boardPapers';
import StructuredText from '../components/StructuredText';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';

interface ExamPrepScreenProps {
  student: Student;
  onBack: () => void;
}

type QuestionStatus = 'unanswered' | 'answered' | 'review';

type FlattenedQuestion = {
    original: BoardPaperQuestion;
    sectionName: string;
    flatIndex: number;
};

const EvaluationCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="p-4 bg-bg-primary rounded-lg border border-border">
        <h5 className="font-bold text-lg text-primary mb-3 flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {title}
        </h5>
        <div className="prose max-w-none dark:prose-invert text-sm">{children}</div>
    </div>
);


const ExamPrepScreen: React.FC<ExamPrepScreenProps> = ({ student, onBack }) => {
    const { t, tCurriculum, language } = useLanguage();

    const [allPapers] = useState<BoardPaper[]>(BOARD_PAPERS);
    const [selectedYear, setSelectedYear] = useState<number>(2023);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedPaper, setSelectedPaper] = useState<BoardPaper | null>(null);
    const [generatedPaper, setGeneratedPaper] = useState<BoardPaper | null>(null);
    
    const [mode, setMode] = useState<'select' | 'generating' | 'practice' | 'view' | 'review'>('select');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [questionStatus, setQuestionStatus] = useState<Record<number, QuestionStatus>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    
    const [evaluations, setEvaluations] = useState<Record<number, WrittenAnswerEvaluation | null>>({});
    const [isEvaluating, setIsEvaluating] = useState<number | null>(null);
    const [scoreBreakdown, setScoreBreakdown] = useState<{
        mcq: { score: number; total: number };
        short: { attempted: number; total: number };
        long: { attempted: number; total: number };
    } | null>(null);

    const activePaper = generatedPaper || selectedPaper;

    // --- Data Memoization ---
    const availableYears = useMemo(() => [...new Set(allPapers.map(p => p.year))].sort((a, b) => b - a), [allPapers]);
    const availableSubjects = useMemo(() => ['all', ...Array.from(new Set(allPapers.filter(p => p.grade === student.grade).map(p => p.subject)))], [student.grade, allPapers]);
    const filteredPapers = useMemo(() => allPapers.filter(p => p.grade === student.grade && p.year === selectedYear && (selectedSubject === 'all' || p.subject === selectedSubject)), [student.grade, selectedYear, selectedSubject, allPapers]);

    const flattenedQuestions = useMemo((): FlattenedQuestion[] => {
        if (!activePaper) return [];
        const flatList: FlattenedQuestion[] = [];
        let flatIndex = 0;
        activePaper.sections.forEach(section => {
            section.questions.forEach(q => {
                flatList.push({ original: q, sectionName: section.name, flatIndex });
                flatIndex++;
            });
        });
        return flatList;
    }, [activePaper]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };
    
    const handleSelectPaper = async (paper: BoardPaper, practice: boolean) => {
        if (paper.sections && paper.sections.length > 0) {
            setSelectedPaper(paper);
            if (practice) handleStartPractice(paper); else setMode('view');
        } else {
            // Paper needs to be generated
            setMode('generating');
            try {
                const generated = await geminiService.generateBoardPaper(paper.year, paper.grade, paper.subject, language);
                setGeneratedPaper({ ...generated, isGenerated: true });
                if (practice) handleStartPractice({ ...generated, isGenerated: true }); else { setSelectedPaper({ ...generated, isGenerated: true }); setMode('view'); }
            } catch (error: any) {
                alert(`Failed to generate paper: ${error.message}`);
                setMode('select');
            }
        }
    };


    // --- Handlers ---
    const handleStartPractice = (paper: BoardPaper) => {
        setMode('practice');
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        const initialStatus: Record<number, QuestionStatus> = {};
        paper.sections.flatMap(s => s.questions).forEach((_, index) => {
            initialStatus[index] = 'unanswered';
        });
        setQuestionStatus(initialStatus);
        // FIX: Explicitly cast `paper.timeAllowed` to a Number to ensure it's not a string from the API response, resolving the arithmetic operation error.
        setTimeLeft(Number(paper.timeAllowed) * 60);
        setIsTimerRunning(true);
        setEvaluations({});
        setScoreBreakdown(null);
    };

    const handleViewPaper = (paper: BoardPaper) => {
        handleSelectPaper(paper, false);
    };

    const handleAnswerChange = (index: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: answer }));
        if (questionStatus[index] !== 'review') {
            setQuestionStatus(prev => ({ ...prev, [index]: 'answered' }));
        }
    };

    const handleToggleReview = (index: number) => {
        setQuestionStatus(prev => {
            const current = prev[index];
            const newStatus = current === 'review' ? (userAnswers[index] ? 'answered' : 'unanswered') : 'review';
            return { ...prev, [index]: newStatus };
        });
    };

    const handleFinishTest = useCallback(() => {
        if (!window.confirm(t('areYouSureSubmit'))) return;
        setIsTimerRunning(false);
        setMode('review');
        
        const breakdown = {
            mcq: { score: 0, total: 0 },
            short: { attempted: 0, total: 0 },
            long: { attempted: 0, total: 0 },
        };

        flattenedQuestions.forEach((fq) => {
            const userAnswer = userAnswers[fq.flatIndex];
            const q = fq.original;
            switch (q.type) {
                case 'MCQ':
                case 'ASSERTION_REASON':
                    breakdown.mcq.total++;
                    const solutionText = q.solution.toLowerCase();
                    const correctOptionMatch = solutionText.match(/\(.\)/);
                    if (correctOptionMatch && q.options) {
                        const correctLetter = correctOptionMatch[0].replace(/[()]/g, '');
                        const correctIndex = correctLetter.charCodeAt(0) - 'a'.charCodeAt(0);
                        if (q.options[correctIndex] === userAnswer) {
                            breakdown.mcq.score++;
                        }
                    } else if (q.solution.includes(userAnswer)) { // Fallback for direct answer check
                         breakdown.mcq.score++;
                    }
                    break;
                case 'VSA':
                case 'SA':
                    breakdown.short.total++;
                    if (userAnswer && userAnswer.trim()) breakdown.short.attempted++;
                    break;
                case 'LA':
                case 'CASE_BASED':
                    breakdown.long.total++;
                    if (userAnswer && userAnswer.trim()) breakdown.long.attempted++;
                    break;
            }
        });
        setScoreBreakdown(breakdown);
    }, [t, flattenedQuestions, userAnswers]);

    // --- Timer Logic ---
    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout>;
        if (isTimerRunning && timeLeft > 0) {
            timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0 && isTimerRunning) {
            handleFinishTest();
        }
        return () => clearTimeout(timerId);
    }, [timeLeft, isTimerRunning, handleFinishTest]);

    const handleGetAIFeedback = async (qIndex: number) => {
        const flatQ = flattenedQuestions[qIndex];
        const userAnswer = userAnswers[qIndex];
        if (!userAnswer || !activePaper) return;
        setIsEvaluating(qIndex);
        try {
            const result = await geminiService.evaluateWrittenAnswer(flatQ.original.text, userAnswer, student.grade, activePaper.subject, language);
            setEvaluations(prev => ({ ...prev, [qIndex]: result }));
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsEvaluating(null);
        }
    };

    const handleBack = () => {
        if (mode === 'select') {
            onBack();
        } else {
            setMode('select');
            setSelectedPaper(null);
            setGeneratedPaper(null);
        }
    };
    
    // --- Render Functions for different modes ---

    const renderSelectionMode = () => (
        <>
            <div className="text-center">
                <AcademicCapIcon className="h-12 w-12 mx-auto text-primary" />
                <h2 className="text-3xl font-bold text-text-primary mt-2">{t('examPrepCenterTitle')}</h2>
                <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('examPrepCenterDesc')}</p>
            </div>
            <div className="my-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-4">
                <div>
                    <label htmlFor="year-filter" className="block text-sm font-bold text-text-secondary mb-1">{t('filterByYear')}</label>
                    <select id="year-filter" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="min-w-[150px]">{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select>
                </div>
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-bold text-text-secondary mb-1">{t('filterBySubject')}</label>
                    <select id="subject-filter" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="min-w-[200px]">{availableSubjects.map(subject => <option key={subject} value={subject}>{subject === 'all' ? t('allSubjects') : tCurriculum(subject)}</option>)}</select>
                </div>
            </div>
            <div className="space-y-4">
                {filteredPapers.length > 0 ? (
                    filteredPapers.map((paper, index) => (
                        <div key={index} className="bg-surface p-4 rounded-lg border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center sm:text-left">
                                <div className="p-3 bg-primary-light rounded-lg"><DocumentTextIcon className="h-6 w-6 text-primary-dark"/></div>
                                <div>
                                    <p className="font-bold text-text-primary">{paper.paperTitle}</p>
                                    <p className="text-sm text-text-secondary">{tCurriculum(paper.subject)} - {paper.year}</p>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${paper.isGenerated ? 'bg-sky-900/50 text-sky-300' : 'bg-teal-900/50 text-teal-300'}`}>
                                        {paper.isGenerated ? t('aiGeneratedPaper', { year: paper.year }) : 'Original Board Paper'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button onClick={() => handleViewPaper(paper)} className="font-semibold text-primary text-sm px-4 py-2 rounded-md hover:bg-primary-light flex items-center gap-1.5"><Eye className="h-4 w-4"/> {t('viewPaper')}</button>
                                <button onClick={() => handleSelectPaper(paper, true)} className="btn-accent px-4 py-2 text-sm flex items-center gap-2"><PlayCircle className="h-5 w-5"/>{t('startTimedPractice')}</button>
                            </div>
                        </div>
                    ))
                ) : <p className="text-center text-text-secondary py-8">{t('noPapersFound')}</p>}
            </div>
        </>
    );

    const renderPracticeMode = () => {
        if (!activePaper || !flattenedQuestions[currentQuestionIndex]) return null;
        const currentQ = flattenedQuestions[currentQuestionIndex];
        const status = questionStatus[currentQuestionIndex];
        const section = activePaper.sections.find(s => s.name === currentQ.sectionName);

        const statusColor = (s: QuestionStatus) => {
            if (s === 'answered') return 'bg-green-500';
            if (s === 'review') return 'bg-purple-500';
            return 'bg-surface';
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-4 mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">{activePaper.paperTitle}</h2>
                            {activePaper.isGenerated && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-900/50 text-sky-300">{t('aiGeneratedPaper', { year: activePaper.year })}</span>}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-text-secondary">{t('timeLeft')}</p>
                            <div className="exam-timer">{formatTime(timeLeft)}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-bold text-primary">{currentQ.sectionName}</h3>
                        <p className="text-xs text-text-secondary">{section?.description}</p>
                    </div>

                    <div className="prose max-w-none prose-invert mb-6"><StructuredText text={`${currentQ.original.q_no}. ${currentQ.original.text}`} /></div>
                    
                    {currentQ.original.diagramSvg && (
                        <div className="my-4 flex justify-center bg-bg-primary p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: currentQ.original.diagramSvg }} />
                    )}

                    {(currentQ.original.type === 'MCQ' || currentQ.original.type === 'ASSERTION_REASON') && currentQ.original.options && (
                        <div className="space-y-3">
                            {currentQ.original.options.map((option, idx) => (
                                <button key={idx} onClick={() => handleAnswerChange(currentQuestionIndex, option)} className={`exam-mcq-option ${userAnswers[currentQuestionIndex] === option ? 'selected' : ''}`}>
                                    <div className="flex-shrink-0 mr-4 h-6 w-6 rounded-full border-2 border-current flex items-center justify-center">
                                        {userAnswers[currentQuestionIndex] === option && <div className="h-3 w-3 rounded-full bg-current"></div>}
                                    </div>
                                    <p>{option}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {['VSA', 'SA', 'LA', 'CASE_BASED'].includes(currentQ.original.type) && (
                        <textarea value={userAnswers[currentQuestionIndex] || ''} onChange={e => handleAnswerChange(currentQuestionIndex, e.target.value)} rows={10} className="w-full" placeholder={t('writeYourAnswerHere')} />
                    )}

                    <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 justify-between items-center">
                        <button onClick={() => handleToggleReview(currentQuestionIndex)} className="flex items-center gap-2 px-4 py-2 font-semibold bg-surface border border-border rounded-lg text-sm">
                            <FlagIcon className={`h-5 w-5 ${status === 'review' ? 'text-purple-400' : ''}`} /> {status === 'review' ? t('unmarkForReview') : t('markForReview')}
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-4 py-2 font-semibold bg-surface border border-border rounded-lg disabled:opacity-50"><ChevronLeftIcon className="h-5 w-5" /> {t('previous')}</button>
                            <button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={currentQuestionIndex === flattenedQuestions.length - 1} className="flex items-center gap-2 px-4 py-2 font-semibold bg-surface border border-border rounded-lg disabled:opacity-50">{t('next')} <ChevronRightIcon className="h-5 w-5" /></button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-bg-primary p-4 rounded-xl">
                    <h3 className="font-bold text-text-primary mb-4">{t('questionPalette')}</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {flattenedQuestions.map((q, index) => (
                            <button key={index} onClick={() => setCurrentQuestionIndex(index)} className={`w-10 h-10 flex items-center justify-center rounded font-bold border-2 ${currentQuestionIndex === index ? 'border-primary text-primary' : 'border-transparent'}`}>
                                <span className={`w-8 h-8 flex items-center justify-center rounded ${statusColor(questionStatus[index])}`}>{index + 1}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={handleFinishTest} className="w-full mt-6 btn-accent flex items-center justify-center gap-2 text-sm"><Send className="h-4 w-4"/>{t('endExam')}</button>
                </div>
            </div>
        );
    };
    
    const renderReviewMode = () => (
         <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">{t('reviewYourAttempt')}</h2>
            <p className="text-text-secondary mb-6">{activePaper?.paperTitle}</p>
            
            {scoreBreakdown && (
                <div className="mb-8 p-6 bg-bg-primary rounded-xl border border-border">
                    <h3 className="text-xl font-bold text-text-primary mb-4">{t('examSummary')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center bg-surface p-4 rounded-lg">
                            <p className="font-bold text-2xl text-primary">{`${scoreBreakdown.mcq.score}/${scoreBreakdown.mcq.total}`}</p>
                            <p className="text-sm font-semibold text-text-secondary">{t('mcqScore')}</p>
                        </div>
                        <div className="text-center bg-surface p-4 rounded-lg">
                            <p className="font-bold text-2xl text-primary">{`${scoreBreakdown.short.attempted}/${scoreBreakdown.short.total}`}</p>
                            <p className="text-sm font-semibold text-text-secondary">{t('shortAnswers')} {t('attempted')}</p>
                        </div>
                        <div className="text-center bg-surface p-4 rounded-lg">
                            <p className="font-bold text-2xl text-primary">{`${scoreBreakdown.long.attempted}/${scoreBreakdown.long.total}`}</p>
                            <p className="text-sm font-semibold text-text-secondary">{t('longAnswers')} {t('attempted')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {flattenedQuestions.map((fq, index) => (
                    <div key={index} className="exam-review-card">
                        <p className="font-bold text-text-primary mb-2">{`Question ${fq.original.q_no}`}</p>
                        <div className="prose prose-sm max-w-none prose-invert mb-4"><StructuredText text={fq.original.text} /></div>
                         {fq.original.diagramSvg && (
                            <div className="my-4 flex justify-center bg-bg-primary p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: fq.original.diagramSvg }} />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-text-secondary mb-2">{t('yourAnswer')}</h4>
                                <div className="exam-review-your-answer"><p className="text-sm whitespace-pre-wrap">{userAnswers[index] || 'Not Answered'}</p></div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-text-secondary mb-2">{t('modelSolution')}</h4>
                                <div className="exam-review-solution prose prose-sm max-w-none prose-invert"><StructuredText text={fq.original.solution} /></div>
                            </div>
                        </div>

                        {['VSA', 'SA', 'LA', 'CASE_BASED'].includes(fq.original.type) && userAnswers[index] && (
                            <div className="mt-4">
                                {evaluations[index] ? (
                                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <EvaluationCard title={t('markingScheme')} icon={DocumentCheckIcon}><StructuredText text={evaluations[index]!.markingScheme}/></EvaluationCard>
                                        <EvaluationCard title={t('personalizedFeedback')} icon={SparklesIcon}><StructuredText text={evaluations[index]!.personalizedFeedback}/></EvaluationCard>
                                    </div>
                                ) : (
                                    <button onClick={() => handleGetAIFeedback(index)} disabled={isEvaluating === index} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-surface border border-border rounded-lg font-semibold hover:bg-bg-primary disabled:opacity-50">
                                        {isEvaluating === index ? <><LoadingSpinner/> {t('aiIsEvaluating')}...</> : <><SparklesIcon className="h-4 w-4 mr-2"/>{t('aiFeedback')}</>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
             <div className="mt-6 text-center">
                <button onClick={handleBack} className="btn-accent px-6 py-2 flex items-center justify-center mx-auto gap-2"><CheckCircle className="h-5 w-5"/>{t('finishReview')}</button>
            </div>
        </div>
    );
    
    const renderViewMode = () => (
        <div>
             <h2 className="text-2xl font-bold text-text-primary">{activePaper?.paperTitle}</h2>
             {activePaper?.isGenerated && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-900/50 text-sky-300">{t('aiGeneratedPaper', { year: activePaper.year })}</span>}
             <div className="mt-6 prose max-w-none prose-invert">
                 <h3 className="font-bold text-text-primary">{t('questionPaper')}</h3>
                 {activePaper?.sections.map(section => (
                     <div key={section.name} className="mt-4">
                         <h4>{section.name}</h4>
                         <p className="text-sm italic">{section.description}</p>
                         {section.questions.map(q => (
                             <div key={q.q_no} className="mb-4">
                                 <StructuredText text={`**${q.q_no}.** ${q.text}`} />
                                 {q.diagramSvg && <div className="my-2" dangerouslySetInnerHTML={{ __html: q.diagramSvg }} />}
                             </div>
                         ))}
                     </div>
                 ))}
                 <h3 className="mt-8 font-bold text-text-primary">{t('modelSolution')}</h3>
                 {activePaper?.sections.map(section => (
                     <div key={`sol-${section.name}`} className="mt-4">
                         <h4>{section.name}</h4>
                         {section.questions.map(q => <div key={`sol-${q.q_no}`} className="mb-4"><StructuredText text={`**${q.q_no}.** ${q.solution}`} /></div>)}
                     </div>
                 ))}
             </div>
        </div>
    );

    const renderGeneratingMode = () => (
        <div className="flex flex-col items-center justify-center h-96">
            <LoadingSpinner/>
            <p className="mt-4 text-text-secondary text-lg font-semibold">AI is generating the {selectedYear} paper...</p>
            <p className="text-sm text-text-secondary mt-1">This may take a moment.</p>
        </div>
    );

    const renderContent = () => {
        switch (mode) {
            case 'generating': return renderGeneratingMode();
            case 'practice': return renderPracticeMode();
            case 'review': return renderReviewMode();
            case 'view': return renderViewMode();
            case 'select':
            default: return renderSelectionMode();
        }
    };

    return (
        <div className="animate-fade-in">
            <button onClick={handleBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {mode === 'select' ? t('backToDashboard') : t('back')}
            </button>
            <div className="dashboard-highlight-card p-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default ExamPrepScreen;