
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, QuizQuestion, StudentQuestion, AIAnalysis, PerformanceRecord, AIFeedback, Chapter } from '../types';
import { ChevronRightIcon, DocumentTextIcon, SparklesIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, UserGroupIcon, ChatBubbleBottomCenterTextIcon, PencilSquareIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateTeacherReport, generateParentReport, generateQuiz, analyzeStudentQuestionForTeacher } from '../services/geminiService';
import { getChapterContent } from '../services/contentService';
import { getReport, saveReport, getStudentQuestions, getPerformanceRecords, saveAIFeedback } from '../services/pineconeService';
import Quiz from '../components/Quiz';
import { useLanguage } from '../contexts/Language-context';
import { CURRICULUM } from '../data/curriculum';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';

type ActiveTab = 'performance' | 'studyPatterns' | 'questions' | 'reports';

// --- START: INTERNAL TAB COMPONENTS ---

const PerformanceTab: React.FC<{ performanceRecords: PerformanceRecord[] }> = ({ performanceRecords }) => {
    const { t, tCurriculum } = useLanguage();
    
    const getScoreColor = (score: number) => {
        if (score > 85) return 'bg-status-success text-status-success';
        if (score > 70) return 'bg-yellow-900/50 text-yellow-300';
        return 'bg-status-danger text-status-danger';
    }

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
           {performanceRecords.length > 0 ? performanceRecords.map((record, index) => (
               <div key={index} className="bg-bg-primary p-3 rounded-lg flex justify-between items-center border border-border">
                   <div>
                        <p className="font-semibold text-text-primary">{tCurriculum(record.chapter)}</p>
                         <p className="text-sm text-text-secondary">
                             {tCurriculum(record.subject)} - 
                             <span className="font-medium ml-1">
                                 {record.type === 'exercise' 
                                     ? t('practiceOn', { context: tCurriculum(record.context || '') })
                                     : t('quizType')}
                             </span>
                         </p>
                   </div>
                   <div className={`px-3 py-1 text-sm font-bold rounded-full border border-current ${getScoreColor(record.score)}`}>
                        {record.score}%
                   </div>
               </div>
           )) : <p className="text-text-secondary text-center py-8">{t('noPerformanceData')}</p>}
        </div>
    );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg-primary p-2 border border-border rounded-md shadow-lg text-xs">
                <p className="font-bold text-text-primary">{label}</p>
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} style={{ color: pld.fill }}>
                        {pld.name}: {pld.value}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// FIX: Added explicit type definition for chart data to resolve TypeScript error.
type DailyActivity = {
    name: string;
    Sun: number;
    Mon: number;
    Tue: number;
    Wed: number;
    Thu: number;
    Fri: number;
    Sat: number;
};

const WeeklyActivityChart: React.FC<{ activityData: { [key: string]: number } }> = ({ activityData }) => {
    const { t } = useLanguage();

    const weeklyData = useMemo(() => {
        const today = new Date();
        const data: DailyActivity[] = Array.from({ length: 5 }, (_, i) => {
            const weekName = i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`;
            return { name: weekName, Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        }).reverse();

        for (let i = 0; i < 35; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const weekIndex = 4 - Math.floor(i / 7);
            const dayIndex = date.getDay();
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex] as keyof Omit<DailyActivity, 'name'>;
            const count = activityData[date.toDateString()] || 0;
            if (data[weekIndex]) {
                data[weekIndex][dayName] += count;
            }
        }
        return data;
    }, [activityData]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayColors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'
    ];

    return (
        <div className="chart-container-notebook" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--c-border-color), 0.3)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgb(var(--c-text-secondary))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgb(var(--c-text-secondary))', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', color: 'rgb(var(--c-text-secondary))' }}/>
                    {daysOfWeek.map((day, index) => (
                        <Bar key={day} dataKey={day} fill={dayColors[index]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
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
        
        const BENCHMARKS: { [key: string]: { indian: number, global: number } } = {
            'Mathematics': { indian: 78, global: 85 }, 'Physics': { indian: 75, global: 82 },
            'Chemistry': { indian: 76, global: 84 }, 'Biology': { indian: 80, global: 88 },
            'History': { indian: 72, global: 75 }, 'Geography': { indian: 74, global: 78 },
            'Political Science': { indian: 75, global: 79 }, 'Economics': { indian: 77, global: 81 },
        };
        
        const benchmarkData = subjectPerformance.map(perf => ({
            subject: tCurriculum(perf.subject),
            'Your Score': perf.averageScore,
            'Indian Avg.': BENCHMARKS[perf.subject]?.indian || 70,
            'Global Avg.': BENCHMARKS[perf.subject]?.global || 75,
        }));


        return { activityByDate, subjectPerformance, learningStyle, benchmarkData };
    }, [performanceRecords, tCurriculum]);

    const learningStyleData = [
        { name: t('quizzesTaken'), value: chartData.learningStyle.quizzes },
        { name: t('practiceSessions'), value: chartData.learningStyle.exercises },
    ].filter(d => d.value > 0);
    
    const COLORS = ['rgb(var(--c-primary))', 'rgb(var(--c-accent))'];

    if (!performanceRecords.length) return <p className="text-text-secondary text-center py-8">{t('noPerformanceData')}</p>;

    return (
        <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
            <div>
                <h3 className="text-lg font-bold text-text-primary mb-3">{t('weeklyActivity')}</h3>
                <WeeklyActivityChart activityData={chartData.activityByDate} />
            </div>
            
            {learningStyleData.length > 0 && <div>
                <h3 className="text-lg font-bold text-text-primary mb-3">{t('learningStyle')}</h3>
                <div className="bg-bg-primary p-4 rounded-lg chart-container-notebook flex flex-col sm:flex-row items-center gap-6" style={{ height: 180 }}>
                    <ResponsiveContainer width={150} height="100%">
                        <PieChart>
                            <Pie
                                data={learningStyleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {learningStyleData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                <Label 
                                    value={`${chartData.learningStyle.quizzes + chartData.learningStyle.exercises}`} 
                                    position="center" 
                                    className="text-2xl font-bold"
                                    style={{ fill: 'rgb(var(--c-text-primary))', fontFamily: 'Poppins' }}
                                />
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                         {learningStyleData.map((entry, index) => (
                             <div key={entry.name} className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <div>
                                    <p className="font-bold text-text-primary">{entry.value}</p>
                                    <p className="text-xs text-text-secondary">{entry.name}</p>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </div>}

            {chartData.benchmarkData.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-3">{t('performanceBenchmarking')}</h3>
                    <div className="bg-bg-primary p-4 rounded-lg chart-container-notebook" style={{ height: 300 }}>
                        <p className="text-sm text-text-secondary mb-6">{t('performanceBenchmarkingDesc')}</p>
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.benchmarkData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--c-border-color), 0.3)" />
                                <XAxis dataKey="subject" tick={{ fill: 'rgb(var(--c-text-secondary))', fontSize: 10 }} angle={-25} textAnchor="end" />
                                <YAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--c-text-secondary))', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', color: 'rgb(var(--c-text-secondary))', paddingTop: '20px' }}/>
                                <Bar dataKey="Your Score" fill="rgb(var(--c-accent))" />
                                <Bar dataKey="Indian Avg." fill="rgb(var(--c-primary))" />
                                <Bar dataKey="Global Avg." fill="rgb(var(--c-border-color))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
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
                 <div key={q.id} className="bg-bg-primary p-4 rounded-lg border border-border">
                    <p className="text-xs text-text-secondary">{new Date(q.timestamp).toLocaleString()}</p>
                    <p className="font-semibold my-1 text-text-primary">"{q.questionText}"</p>
                    <p className="text-sm text-text-secondary">{t('context')}: {tCurriculum(q.chapter)} &gt; <span className="font-medium">{tCurriculum(q.concept)}</span></p>

                    {q.fittoResponse && (
                        <div className="mt-4 bg-surface p-3 rounded-lg">
                            <h5 className="font-bold text-sm text-text-secondary flex items-center"><SparklesIcon className="h-4 w-4 mr-1.5 text-text-secondary" />{t('fittoResponseTitle')}</h5>
                            <p className="text-sm text-text-primary mt-1">{q.fittoResponse.responseText}</p>
                        </div>
                    )}

                    {analysis[q.id] ? (
                        <div className="mt-4 space-y-3 animate-fade-in">
                            <div className="bg-surface p-3 rounded"><h5 className="font-bold text-sm text-text-primary">{t('modelAnswer')}</h5><p className="text-sm text-text-primary">{analysis[q.id]?.modelAnswer}</p></div>
                            <div className="bg-surface p-3 rounded"><h5 className="font-bold text-sm text-text-primary">{t('pedagogicalNotes')}</h5><p className="text-sm text-text-primary">{analysis[q.id]?.pedagogicalNotes}</p></div>
                        </div>
                    ) : (
                        <div className="mt-3 text-right">
                            <button onClick={() => handleGetAnalysis(q)} disabled={isAnalyzing === q.id} className="px-3 py-1.5 text-xs font-semibold bg-surface border border-border text-text-primary rounded-lg hover:bg-bg-primary transition shadow-sm disabled:opacity-50 flex items-center">
                                {isAnalyzing === q.id ? <><LoadingSpinner /> <span className="ml-2">{t('analyzing')}...</span></> : t('getAIAnswerSuggestion')}
                            </button>
                        </div>
                    )}
                 </div>
             )) : <p className="text-text-secondary text-center py-8">{t('noQuestionsSubmitted')}</p>}
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
            if (line.startsWith('HEADING: ')) {
                const headingText = line.substring('HEADING: '.length).replace(/:$/, ''); // Remove prefix and trailing colon
                return <h4 key={index} className="text-lg font-bold text-text-primary mt-4 mb-2">{headingText}</h4>;
            }
            if (line.match(/^\s*[-*]\s/)) return <li key={index} className="ml-5 list-disc text-text-secondary mb-1">{line.replace(/^\s*[-*]\s/, '')}</li>;
            if (line.trim()) return <p key={index} className="text-text-secondary mb-2">{line}</p>;
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
            
            const gradeData = CURRICULUM.find(g => g.level === student.grade);
            const subjectData = gradeData?.subjects?.find(s => s.name === lowestScoreRecord.subject);
            const chapterObject = subjectData?.chapters?.find(c => c.title === lowestScoreRecord.chapter);

            if (!chapterObject) {
                onSetError(`Could not find chapter data for "${lowestScoreRecord.chapter}".`);
                setIsGeneratingSheet(false);
                return;
            }

            const { content: moduleContent } = await getChapterContent(student.grade, lowestScoreRecord.subject, chapterObject, student, language);
            const quiz = await generateQuiz(moduleContent.coreConceptTraining.map(c => c.title), language);
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
           <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="w-full flex items-center justify-center px-4 py-3 btn-accent disabled:opacity-70 disabled:cursor-not-allowed">
               {isGeneratingReport ? <><LoadingSpinner /> <span className="ml-2">{t('generatingReport')}</span></> : <><DocumentTextIcon className="h-5 w-5 mr-2"/>{t('generateAnalysisReport')}</>}
           </button>
           {userRole === 'teacher' && (
                <button onClick={handleGeneratePracticeSheet} disabled={isGeneratingSheet} className="w-full flex items-center justify-center px-4 py-3 bg-slate-600 text-white font-bold rounded-lg shadow-md hover:bg-slate-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed">
                {isGeneratingSheet ? <><LoadingSpinner /> <span className="ml-2">{t('assigningSheet')}</span></> : <><ClipboardDocumentListIcon className="h-5 w-5 mr-2"/>{t('assignPracticeSheet')}</>}
            </button>
           )}
           {report && (
                <div className="mt-6 p-4 bg-bg-primary border border-border rounded-lg animate-fade-in max-h-[450px] overflow-y-auto">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-text-primary text-lg flex items-center"><SparklesIcon className="h-5 w-5 mr-2 text-text-secondary"/>{t('aiGeneratedReport')}</h4>
                        {isReportFromDB && <div className="flex items-center bg-surface text-text-secondary text-xs font-medium px-2 py-0.5 rounded-full"><ArchiveBoxIcon className="h-3 w-3 mr-1" />{t('loadedFromDB')}</div>}
                    </div>
                    <div className="prose prose-sm max-w-none prose-invert">{formatReportText(report)}</div>
                </div>
            )}
            {report && !isGeneratingReport && (
                <div className="mt-6 pt-4 border-t border-dashed border-border">
                    {feedbackSubmitted ? (
                        <div className="text-center p-4 bg-surface rounded-lg text-text-primary font-semibold animate-fade-in">{t('feedbackThanks')}</div>
                    ) : (
                        <div className="animate-fade-in">
                            <h5 className="font-bold text-text-primary">{t('feedbackOnReport')}</h5>
                            <p className="text-sm text-text-secondary mb-3">{t('helpUsImprove')}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setFeedbackRating('up')} className={`p-2 rounded-full transition ${feedbackRating === 'up' ? 'bg-surface text-text-primary' : 'bg-bg-primary hover:bg-surface text-text-secondary'}`}><HandThumbUpIcon className="h-6 w-6" /></button>
                                <button onClick={() => setFeedbackRating('down')} className={`p-2 rounded-full transition ${feedbackRating === 'down' ? 'bg-surface text-text-primary' : 'bg-bg-primary hover:bg-surface text-text-secondary'}`}><HandThumbDownIcon className="h-6 w-6" /></button>
                                <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder={t('commentOptional')} className="flex-grow p-2 text-sm border-border bg-bg-primary rounded-md focus:ring-1 focus:ring-primary" rows={1}/>
                            </div>
                            {feedbackRating && <div className="text-right mt-3"><button onClick={handleFeedbackSubmit} className="px-4 py-1.5 text-sm bg-surface text-text-primary font-semibold rounded-lg shadow-sm hover:bg-bg-primary transition">{t('submitFeedback')}</button></div>}
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

const StudentPerformanceView: React.FC<StudentPerformanceViewProps> = React.memo(({ userRole, student, language, onBack }) => {
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
        { id: 'performance', name: t('performance'), icon: UserGroupIcon, animation: 'bounce-icon' },
        { id: 'studyPatterns', name: t('studyPatterns'), icon: ChartBarIcon, animation: 'bounce-icon' },
        ...(userRole === 'teacher' ? [{ id: 'questions', name: t('studentQuestions'), icon: ChatBubbleBottomCenterTextIcon, animation: 'bounce-icon' }] : []),
        { id: 'reports', name: t('aiReports'), icon: PencilSquareIcon, animation: 'bounce-icon' }
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
            <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-semibold text-text-secondary mb-8">
                <button onClick={onBack} className="hover:text-text-primary transition-colors flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1.5" />
                    {userRole === 'teacher' ? t('teacherDashboard') : t('parentDashboard')}
                </button>
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
                <span className="text-text-primary truncate" aria-current="page">
                    {student.name}
                </span>
            </nav>
            <div className="dashboard-highlight-card p-8">
                <div className="flex items-center border-b border-border pb-4 mb-6">
                    <img src={student.avatarUrl} alt={student.name} className="h-16 w-16 rounded-full mr-5" />
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary">{student.name}</h2>
                        <p className="text-text-secondary text-lg">{tCurriculum(student.grade)}</p>
                    </div>
                </div>

                <div className="tab-bar">
                    <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ActiveTab)}
                            className={`tab-button ${ activeTab === tab.id ? 'active' : '' }`}
                        >
                            <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${ activeTab === tab.id ? `animate-${tab.animation}` : '' }`} />
                            <span>{tab.name}</span>
                        </button>
                        ))}
                    </nav>
                </div>
                
                <div className="animate-fade-in mt-6">
                    {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
                    {renderTabContent()}
                </div>

            </div>
        </div>
    );
});

export default StudentPerformanceView;
