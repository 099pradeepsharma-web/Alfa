import React, { useState, useEffect, useMemo } from 'react';
import { Student, QuizQuestion, StudentQuestion, AIAnalysis, PerformanceRecord, AIFeedback } from '../types';
import { ArrowLeftIcon, DocumentTextIcon, SparklesIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, UserGroupIcon, ChatBubbleBottomCenterTextIcon, PencilSquareIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateTeacherReport, generateParentReport, generateQuiz, getChapterContent, analyzeStudentQuestionForTeacher } from '../services/geminiService';
import { getReport, saveReport, getStudentQuestions, getPerformanceRecords, saveAIFeedback } from '../services/pineconeService';
import Quiz from '../components/Quiz';
import { useLanguage } from '../contexts/Language-context';

type ActiveTab = 'performance' | 'studyPatterns' | 'questions' | 'reports';

// --- START: INTERNAL TAB COMPONENTS ---

const PerformanceTab: React.FC<{ performanceRecords: PerformanceRecord[] }> = ({ performanceRecords }) => {
    const { t, tCurriculum } = useLanguage();
    
    const getScoreColor = (score: number) => {
        if (score > 85) return 'text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800';
        if (score > 70) return 'text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800';
        return 'text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800';
    }

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
           {performanceRecords.length > 0 ? performanceRecords.map((record, index) => (
               <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700">
                   <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{tCurriculum(record.chapter)}</p>
                         <p className="text-sm text-slate-500 dark:text-slate-400">
                             {tCurriculum(record.subject)} - 
                             <span className="font-medium ml-1">
                                 {record.type === 'exercise' 
                                     ? t('practiceOn', { context: tCurriculum(record.context || '') })
                                     : t('quizType')}
                             </span>
                         </p>
                   </div>
                   <div className={`px-3 py-1 text-sm font-bold rounded-full border ${getScoreColor(record.score)}`}>
                        {record.score}%
                   </div>
               </div>
           )) : <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('noPerformanceData')}</p>}
        </div>
    );
};

const WeeklyActivityChart: React.FC<{ activityData: { [key: string]: number }, maxActivity: number }> = ({ activityData, maxActivity }) => {
    const { t } = useLanguage();
    const today = new Date();
    const days = [];
    for (let i = 34; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date);
    }
    const firstDayOfWeek = days[0].getDay();
    
    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-200 dark:bg-slate-700/50';
        const intensity = Math.min(1, count / (maxActivity || 1));
        const root = document.documentElement;
        const primaryColor = getComputedStyle(root).getPropertyValue('--c-primary').split(' ').join(',');
        if (intensity < 0.25) return `rgba(${primaryColor}, 0.2)`;
        if (intensity < 0.5) return `rgba(${primaryColor}, 0.4)`;
        if (intensity < 0.75) return `rgba(${primaryColor}, 0.7)`;
        return `rgba(${primaryColor}, 1)`;
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
             <div className="grid grid-cols-7 gap-1.5" style={{ gridTemplateRows: 'auto' }}>
                {weekDays.map(day => <div key={day} className="text-xs font-bold text-center text-slate-500 dark:text-slate-400">{day}</div>)}
             </div>
            <div className="grid grid-cols-7 gap-1.5 mt-2">
                {Array.from({ length: firstDayOfWeek }).map((_, index) => <div key={`empty-${index}`} />)}
                {days.map(date => {
                    const dateStr = date.toDateString();
                    const count = activityData[dateStr] || 0;
                    return <div key={dateStr} className="w-full aspect-square rounded-sm" style={{ backgroundColor: getColor(count) }} title={`${date.toLocaleDateString()}: ${count} activities`} />;
                })}
            </div>
            <div className="flex justify-end items-center text-xs mt-2 text-slate-500 dark:text-slate-400 gap-2">
                {t('lessActivity')}
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: getColor(0)}}></div>
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: getColor(Math.ceil(maxActivity * 0.4))}}></div>
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: getColor(Math.ceil(maxActivity * 0.7))}}></div>
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: getColor(maxActivity || 1)}}></div>
                {t('moreActivity')}
            </div>
        </div>
    );
};

const StudyPatternsTab: React.FC<{ performanceRecords: PerformanceRecord[] }> = ({ performanceRecords }) => {
    const { t, tCurriculum } = useLanguage();
    
    const chartData = useMemo(() => {
        const activityByDate: { [key: string]: number } = {};
        performanceRecords.forEach(rec => {
            const dateStr = new Date(rec.completedDate).toDateString();
            activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
        });
        const maxActivity = Math.max(...Object.values(activityByDate), 0);

        const subjectData: { [key: string]: { totalScore: number, count: number } } = {};
        performanceRecords.forEach(rec => {
            if (rec.type === 'quiz' || rec.type === 'exercise') {
                if (!subjectData[rec.subject]) subjectData[rec.subject] = { totalScore: 0, count: 0 };
                subjectData[rec.subject].totalScore += rec.score;
                subjectData[rec.subject].count += 1;
            }
        });
        const subjectPerformance = Object.entries(subjectData).map(([subject, data]) => ({
            subject, averageScore: Math.round(data.totalScore / data.count),
        })).sort((a, b) => b.averageScore - a.averageScore);

        const learningStyle = performanceRecords.reduce((acc, rec) => {
            if (rec.type === 'quiz') acc.quizzes += 1;
            if (rec.type === 'exercise') acc.exercises += 1;
            return acc;
        }, { quizzes: 0, exercises: 0 });

        return { activityByDate, maxActivity, subjectPerformance, learningStyle };
    }, [performanceRecords]);

    if (!performanceRecords.length) return <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('noPerformanceData')}</p>;

    return (
        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
            <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">{t('weeklyActivity')}</h3>
                <WeeklyActivityChart activityData={chartData.activityByDate} maxActivity={chartData.maxActivity} />
            </div>
            
            {chartData.subjectPerformance.length > 0 && <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">{t('performanceBySubject')}</h3>
                <div className="space-y-3">
                    {chartData.subjectPerformance.map(({ subject, averageScore }) => (
                        <div key={subject}>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{tCurriculum(subject)}</span>
                                <span className="text-sm font-bold text-primary" style={{color: 'rgb(var(--c-primary))'}}>{averageScore}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3.5">
                                <div className="h-3.5 rounded-full progress-bar-gradient" style={{ width: `${averageScore}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>}

            {(chartData.learningStyle.quizzes > 0 || chartData.learningStyle.exercises > 0) && <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-3">{t('learningStyle')}</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-3xl font-bold text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{chartData.learningStyle.quizzes}</p>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('quizzesTaken')}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-3xl font-bold text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{chartData.learningStyle.exercises}</p>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('practiceSessions')}</p>
                    </div>
                </div>
            </div>}
        </div>
    );
};

const StudentQuestionsTab: React.FC<{ questions: StudentQuestion[], student: Student, onSetError: (e: string | null) => void }> = ({ questions, student, onSetError }) => {
    const { t, tCurriculum, language } = useLanguage();
    const [analysis, setAnalysis] = useState<{[questionId: string]: AIAnalysis | null}>({});
    const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

    const handleGetAnalysis = async (question: StudentQuestion) => {
        setIsAnalyzing(question.id);
        onSetError(null);
        try {
            const result = await analyzeStudentQuestionForTeacher(question, language);
            setAnalysis(prev => ({ ...prev, [question.id]: result }));
        } catch (err: any) {
            onSetError(err.message);
        } finally {
            setIsAnalyzing(null);
        }
    };
    
    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {questions.length > 0 ? questions.map(q => (
                 <div key={q.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(q.timestamp).toLocaleString()}</p>
                    <p className="font-semibold my-1 text-slate-800 dark:text-slate-100">"{q.questionText}"</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t('context')}: {tCurriculum(q.chapter)} &gt; <span className="font-medium">{tCurriculum(q.concept)}</span></p>

                    {q.fittoResponse && (
                        <div className="mt-4 bg-slate-200 dark:bg-slate-700 p-3 rounded-lg">
                            <h5 className="font-bold text-sm text-slate-600 dark:text-slate-200 flex items-center"><SparklesIcon className="h-4 w-4 mr-1.5 text-primary" style={{color: 'rgb(var(--c-primary))'}} />{t('fittoResponseTitle')}</h5>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{q.fittoResponse.responseText}</p>
                        </div>
                    )}

                    {analysis[q.id] ? (
                        <div className="mt-4 space-y-3 animate-fade-in">
                            <div className="bg-primary-light/60 dark:bg-slate-900/50 p-3 rounded"><h5 className="font-bold text-sm text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('modelAnswer')}</h5><p className="text-sm text-slate-700 dark:text-slate-300">{analysis[q.id]?.modelAnswer}</p></div>
                            <div className="bg-primary-light/60 dark:bg-slate-900/50 p-3 rounded"><h5 className="font-bold text-sm text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('pedagogicalNotes')}</h5><p className="text-sm text-slate-700 dark:text-slate-300">{analysis[q.id]?.pedagogicalNotes}</p></div>
                        </div>
                    ) : (
                        <div className="mt-3 text-right">
                            <button onClick={() => handleGetAnalysis(q)} disabled={isAnalyzing === q.id} className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm disabled:opacity-50 flex items-center">
                                {isAnalyzing === q.id ? <><LoadingSpinner /> <span className="ml-2">{t('analyzing')}...</span></> : t('getAIAnswerSuggestion')}
                            </button>
                        </div>
                    )}
                 </div>
             )) : <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('noQuestionsSubmitted')}</p>}
        </div>
    );
};

const ReportsTab: React.FC<{ student: Student; userRole: 'teacher' | 'parent'; performanceRecords: PerformanceRecord[], onSetError: (e: string | null) => void }> = ({ student, userRole, performanceRecords, onSetError }) => {
    const { t, language } = useLanguage();
    const [report, setReport] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isReportFromDB, setIsReportFromDB] = useState(false);
    const [practiceSheet, setPracticeSheet] = useState<QuizQuestion[] | null>(null);
    const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const formatReportText = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.match(/^\s*\d*\.?\s*\*\*(.+?):\*\*/)) {
                const headingText = line.replace(/^\s*\d*\.?\s*\*\*(.+?):\*\*/, '$1');
                return <h4 key={index} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">{headingText}</h4>;
            }
            if (line.match(/^\s*[-*]\s/)) return <li key={index} className="ml-5 list-disc text-slate-600 dark:text-slate-300 mb-1">{line.replace(/^\s*[-*]\s/, '')}</li>;
            if (line.trim()) return <p key={index} className="text-slate-600 dark:text-slate-300 mb-2">{line}</p>;
            return null;
        });
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true); setReport(null); onSetError(null); setIsReportFromDB(false);
        setFeedbackRating(null); setFeedbackComment(''); setFeedbackSubmitted(false);
        try {
            const studentWithFullPerformance = { ...student, performance: performanceRecords };
            const cachedReport = await getReport(student.id, userRole, language);
            if (cachedReport) {
                setReport(cachedReport); setIsReportFromDB(true); return;
            }
            const generatedReport = userRole === 'teacher' ? await generateTeacherReport(studentWithFullPerformance, language) : await generateParentReport(studentWithFullPerformance, language);
            setReport(generatedReport); await saveReport(student.id, userRole, generatedReport, language);
        } catch (err: any) {
            onSetError(err.message);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackRating) return;
        const reportIdentifier = `report-${userRole}-${student.id}-${language}`;
        const feedbackData: AIFeedback = { id: `feedback-${Date.now()}`, userRole, studentId: student.id, contentIdentifier: reportIdentifier, rating: feedbackRating, comment: feedbackComment, timestamp: new Date().toISOString() };
        try {
            await saveAIFeedback(feedbackData); setFeedbackSubmitted(true);
        } catch (e) {
            onSetError('Failed to save feedback. Please try again.');
        }
    };

    const handleGeneratePracticeSheet = async () => {
        setIsGeneratingSheet(true); setPracticeSheet(null); onSetError(null);
        try {
            if (performanceRecords.length === 0) { onSetError(t('noPerformanceDataError')); return; }
            const lowestScoreRecord = [...performanceRecords].sort((a, b) => a.score - b.score)[0];
            const moduleContent = await getChapterContent(student.grade, lowestScoreRecord.subject, lowestScoreRecord.chapter, student.name, language);
            const quiz = await generateQuiz(moduleContent.keyConcepts, language);
            setPracticeSheet(quiz);
        } catch (err: any) {
            onSetError(err.message);
        } finally {
            setIsGeneratingSheet(false);
        }
    };

    if (practiceSheet) return <Quiz questions={practiceSheet} onBack={() => setPracticeSheet(null)} chapterTitle={t('practiceSheet')} />;

    return (
        <div className="space-y-4">
           <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="w-full flex items-center justify-center px-4 py-3 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed">
               {isGeneratingReport ? <><LoadingSpinner /> <span className="ml-2">{t('generatingReport')}</span></> : <><DocumentTextIcon className="h-5 w-5 mr-2"/>{t('generateAnalysisReport')}</>}
           </button>
           {userRole === 'teacher' && (
                <button onClick={handleGeneratePracticeSheet} disabled={isGeneratingSheet} className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition disabled:bg-teal-400 disabled:cursor-not-allowed">
                {isGeneratingSheet ? <><LoadingSpinner /> <span className="ml-2">{t('assigningSheet')}</span></> : <><ClipboardDocumentListIcon className="h-5 w-5 mr-2"/>{t('assignPracticeSheet')}</>}
            </button>
           )}
           {report && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in max-h-[450px] overflow-y-auto">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center"><SparklesIcon className="h-5 w-5 mr-2 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>{t('aiGeneratedReport')}</h4>
                        {isReportFromDB && <div className="flex items-center bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-medium px-2 py-0.5 rounded-full"><ArchiveBoxIcon className="h-3 w-3 mr-1" />{t('loadedFromDB')}</div>}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">{formatReportText(report)}</div>
                </div>
            )}
            {report && !isGeneratingReport && (
                <div className="mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                    {feedbackSubmitted ? (
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300 font-semibold animate-fade-in">{t('feedbackThanks')}</div>
                    ) : (
                        <div className="animate-fade-in">
                            <h5 className="font-bold text-slate-700 dark:text-slate-200">{t('feedbackOnReport')}</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('helpUsImprove')}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setFeedbackRating('up')} className={`p-2 rounded-full transition ${feedbackRating === 'up' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{feedbackRating === 'up' ? <HandThumbUpSolid className="h-6 w-6" /> : <HandThumbUpIcon className="h-6 w-6" />}</button>
                                <button onClick={() => setFeedbackRating('down')} className={`p-2 rounded-full transition ${feedbackRating === 'down' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{feedbackRating === 'down' ? <HandThumbDownSolid className="h-6 w-6" /> : <HandThumbDownIcon className="h-6 w-6" />}</button>
                                <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder={t('commentOptional')} className="flex-grow p-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 rounded-md focus:ring-1 focus:ring-primary" rows={1}/>
                            </div>
                            {feedbackRating && <div className="text-right mt-3"><button onClick={handleFeedbackSubmit} className="px-4 py-1.5 text-sm bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark transition" style={{backgroundColor: 'rgb(var(--c-primary))'}}>{t('submitFeedback')}</button></div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- END: INTERNAL TAB COMPONENTS ---


interface StudentPerformanceViewProps {
  userRole: 'teacher' | 'parent';
  student: Student;
  language: string;
  onBack: () => void;
}

const StudentPerformanceView: React.FC<StudentPerformanceViewProps> = ({ userRole, student, language, onBack }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('performance');
    const { t, tCurriculum } = useLanguage();
    
    const [allPerformance, setAllPerformance] = useState<PerformanceRecord[]>(student.performance);
    const [questions, setQuestions] = useState<StudentQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch performance records
                const storedRecords = await getPerformanceRecords(student.id);
                const combined = [...student.performance, ...storedRecords];
                const uniqueRecords = Array.from(new Map(combined.map(item => [`${item.subject}-${item.chapter}-${item.completedDate}-${item.score}-${item.type}-${item.context}`, item])).values());
                uniqueRecords.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
                setAllPerformance(uniqueRecords);

                // Fetch student questions if teacher
                if (userRole === 'teacher') {
                    const fetchedQuestions = await getStudentQuestions(student.id, language);
                    setQuestions(fetchedQuestions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load student data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [student.id, student.performance, language, userRole]);

    const tabs = [
        { id: 'performance', name: t('performance'), icon: UserGroupIcon },
        { id: 'studyPatterns', name: t('studyPatterns'), icon: ChartBarIcon },
        ...(userRole === 'teacher' ? [{ id: 'questions', name: t('studentQuestions'), icon: ChatBubbleBottomCenterTextIcon }] : []),
        { id: 'reports', name: t('aiReports'), icon: PencilSquareIcon }
    ];

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
        }
        switch(activeTab) {
            case 'performance':
                return <PerformanceTab performanceRecords={allPerformance} />;
            case 'studyPatterns':
                 return <StudyPatternsTab performanceRecords={allPerformance} />;
            case 'questions':
                return userRole === 'teacher' ? <StudentQuestionsTab questions={questions} student={student} onSetError={setError} /> : null;
            case 'reports':
                return <ReportsTab student={student} userRole={userRole} performanceRecords={allPerformance} onSetError={setError} />;
        }
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                    <img src={student.avatarUrl} alt={student.name} className="h-16 w-16 rounded-full mr-5" />
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{student.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">{tCurriculum(student.grade)}</p>
                    </div>
                </div>

                <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ActiveTab)}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap
                            ${ activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                            style={{borderColor: activeTab === tab.id ? 'rgb(var(--c-primary))' : 'transparent', color: activeTab === tab.id ? 'rgb(var(--c-primary))' : ''}}
                        >
                            <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                            <span>{tab.name}</span>
                        </button>
                        ))}
                    </nav>
                </div>
                
                <div className="animate-fade-in">
                    {error && <p className="text-red-500 dark:text-red-400 mb-4 text-center">{error}</p>}
                    {renderTabContent()}
                </div>

            </div>
        </div>
    );
};

export default StudentPerformanceView;