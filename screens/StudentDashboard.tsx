import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, AdaptiveAction, LearningStreak, StudyGoal } from '../types';
import { getLearningStreak } from '../services/pineconeService';
import { getAdaptiveNextStep, generateStudyGoalSuggestions } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { 
    Library, HelpCircle, GraduationCap, Briefcase, Trophy, FolderKanban, 
    Users, BrainCircuit, Globe, Lightbulb, UserCog, Heart, Plus, Trash2, Sparkles as SparklesLucide,
    Rocket, Flame, ClipboardCheck, BarChart3, CalendarDays
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSound } from '../hooks/useSound';
import { CURRICULUM } from '../data/curriculum';
import { getIcon } from '../components/IconMap';

const StatsCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; colorClass: string; className?: string, style?: React.CSSProperties }> = ({ icon: Icon, label, value, colorClass, className, style }) => (
    <div className={`dashboard-highlight-card p-4 flex items-center gap-4 ${className}`} style={style}>
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
            <p className="text-sm font-semibold text-text-secondary">{label}</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{value}</p>
        </div>
    </div>
);

interface StudentDashboardProps {
  student: Student;
  users: Student[];
  onStartMission: () => void;
  onBrowse: () => void;
  onStartWellbeing: () => void;
  onStartTutorial: () => void;
  onStartInnovationLab: () => void;
  onStartCriticalThinking: () => void;
  onStartGlobalPrep: () => void;
  onStartLeadershipCircle: () => void;
  onStartCareerGuidance: () => void;
  onStartDoubtSolver: () => void;
  onStartCompetitions: () => void;
  onStartProjectHub: () => void;
  onStartPeerPedia: () => void;
  onStartExamPrep: () => void;
  onStartCognitiveTwin: () => void;
  onAddGoal: (text: string, dueDate?: string) => Promise<void>;
  onToggleGoal: (goal: StudyGoal) => Promise<void>;
  onRemoveGoal: (goal: StudyGoal) => Promise<void>;
}

const MissionCard: React.FC<{ onStartMission: () => void, student: Student }> = ({ onStartMission, student }) => {
    const { t, language } = useLanguage();
    const [action, setAction] = useState<AdaptiveAction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAction = async () => {
            setIsLoading(true);
            try {
                const adaptiveAction = await getAdaptiveNextStep(student, language);
                setAction(adaptiveAction);
            } catch (error) {
                console.error("Failed to fetch adaptive action:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAction();
    }, [student, language]);

    if (isLoading) {
        return (
            <div className="p-6 min-h-[220px] flex flex-col items-center justify-center text-center">
                 <LoadingSpinner />
                 <p className="font-semibold text-text-secondary mt-3">{t('craftingYourPath')}</p>
            </div>
        );
    }
    
    if (!action) return null;

    return (
        <div className="p-6 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary">{t('todaysMission')}</h2>
                        <p className="text-text-secondary mt-1">{t('todaysMissionDesc')}</p>
                    </div>
                </div>
            
                <div className="mt-6 bg-surface p-4 rounded-lg border border-border">
                    <p className="font-semibold text-sm text-primary mb-1 flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5"/>
                        AI Recommendation
                    </p>
                    <p className="text-text-secondary italic">"{action.details.reasoning}"</p>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={onStartMission}
                    className="flex items-center justify-center w-full md:w-auto px-6 py-3 btn-accent"
                    data-sound="swoosh"
                >
                    <Rocket className="h-5 w-5 mr-2" />
                    <span>{t('launchMission')}</span>
                </button>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ElementType; title: string; description: string; onClick: () => void; }> = ({ icon: Icon, title, description, onClick }) => (
    <button onClick={onClick} className="command-card w-full p-4 rounded-xl flex items-center gap-4 text-left" data-sound="click">
       <Icon className="h-6 w-6 text-primary flex-shrink-0" />
       <div className="flex-grow">
            <h3 className="font-bold text-text-primary text-base">{title}</h3>
            <p className="text-text-secondary text-xs">{description}</p>
       </div>
    </button>
);

const LearningJourney: React.FC<{ student: Student }> = ({ student }) => {
    const { t, tCurriculum } = useLanguage();
    
    const studentGradeData = useMemo(() => CURRICULUM.find(g => g.level === student.grade), [student.grade]);

    const subjectProgress = useMemo(() => {
        if (!studentGradeData) return [];

        const completedChapters = new Set(
            student.performance
                .filter(p => p.score >= 80) // Define "mastered" as >= 80%
                .map(p => p.chapter)
        );

        return studentGradeData.subjects.map(subject => {
            const totalChapters = subject.chapters.length;
            if (totalChapters === 0) return { name: subject.name, icon: subject.icon, progress: 0 };

            const completedCount = subject.chapters.filter(ch => completedChapters.has(ch.title)).length;
            const progress = Math.round((completedCount / totalChapters) * 100);
            return { name: subject.name, icon: subject.icon, progress };
        });
    }, [student.performance, studentGradeData]);

    if (!studentGradeData) return null;

    return (
        <div className="dashboard-highlight-card p-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-primary"/>
                My Learning Journey
            </h2>
            <div className="space-y-4">
                {subjectProgress.map(subject => {
                    const Icon = getIcon(subject.icon);
                    return (
                        <div key={subject.name}>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-text-secondary"/>
                                    <span className="font-semibold text-text-secondary">{tCurriculum(subject.name)}</span>
                                </div>
                                <span className="font-bold text-sm text-text-primary">{subject.progress}%</span>
                            </div>
                            <div className="w-full bg-bg-primary rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${subject.progress}%`, backgroundColor: 'rgb(var(--c-primary))' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
    student,
    users,
    onStartMission, 
    onBrowse, 
    onStartWellbeing, 
    onStartTutorial,
    onStartInnovationLab,
    onStartCriticalThinking,
    onStartGlobalPrep,
    onStartLeadershipCircle,
    onStartCareerGuidance,
    onStartDoubtSolver,
    onStartCompetitions,
    onStartProjectHub,
    onStartPeerPedia,
    onStartExamPrep,
    onStartCognitiveTwin,
    onAddGoal,
    onToggleGoal,
    onRemoveGoal
}) => {
    const { t, language } = useLanguage();
    const { playSound } = useSound();
    const [learningStreak, setLearningStreak] = useState(0);
    
    // === New Calendar and Goals State ===
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
    const [newGoalText, setNewGoalText] = useState('');
    const [newGoalDate, setNewGoalDate] = useState('');
    const [newGoalTime, setNewGoalTime] = useState('');
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const notificationTimeouts = useRef<Record<string, number>>({});

    // === Notification Logic ===
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        // Clear existing timeouts to avoid duplicates on re-render
        Object.values(notificationTimeouts.current).forEach(clearTimeout);
        notificationTimeouts.current = {};

        student.studyGoals.forEach(goal => {
            if (goal.dueDate) {
                const dueDate = new Date(goal.dueDate);
                const msUntilDue = dueDate.getTime() - Date.now();

                if (msUntilDue > 0) {
                    const timeoutId = window.setTimeout(() => {
                        if (Notification.permission === 'granted') {
                            new Notification('Alfanumrik Study Goal Reminder', {
                                body: goal.text,
                                icon: '/vite.svg' 
                            });
                        }
                    }, msUntilDue);
                    notificationTimeouts.current[goal.id] = timeoutId;
                }
            }
        });

        return () => {
            Object.values(notificationTimeouts.current).forEach(clearTimeout);
        };
    }, [student.studyGoals]);
    
    // === Goal Handlers ===
    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        setIsAddingGoal(true);
        try {
            const dueDateISO = newGoalDate && newGoalTime ? new Date(`${newGoalDate}T${newGoalTime}`).toISOString() : undefined;
            await onAddGoal(newGoalText, dueDateISO);
            setNewGoalText('');
            setNewGoalDate('');
            setNewGoalTime('');
            setGoalSuggestions([]);
        } catch(err) {
            console.error("Failed to add goal:", err);
        } finally {
            setIsAddingGoal(false);
        }
    };

    const handleSuggestGoals = async () => {
        setIsSuggesting(true);
        setGoalSuggestions([]);
        try {
            const suggestions = await generateStudyGoalSuggestions(student, language);
            setGoalSuggestions(suggestions);
        } catch (err) {
            console.error("Failed to get suggestions:", err);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleToggleGoal = async (goal: StudyGoal) => {
        if (!goal.isCompleted) {
            playSound('complete');
        }
        await onToggleGoal(goal);
    };

    const handleRemoveGoal = async (goal: StudyGoal) => {
        await onRemoveGoal(goal);
    };

    const goalsByDate = useMemo(() => {
        return student.studyGoals.reduce((acc, goal) => {
            const dateStr = goal.dueDate ? new Date(goal.dueDate).toDateString() : 'No Date';
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(goal);
            return acc;
        }, {} as Record<string, StudyGoal[]>);
    }, [student.studyGoals]);

    const goalsForSelectedDate = goalsByDate[selectedDate.toDateString()] || [];

    // === Calendar Logic ===
    const renderCalendar = () => {
        const year = currentDisplayDate.getFullYear();
        const month = currentDisplayDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const paddingDays = Array.from({ length: firstDay }, () => null);
        const allCells = [...paddingDays, ...days];

        return (
            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={() => setCurrentDisplayDate(new Date(year, month - 1, 1))} className="calendar-nav-btn"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <h3 className="calendar-title">{currentDisplayDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => setCurrentDisplayDate(new Date(year, month + 1, 1))} className="calendar-nav-btn"><ChevronRightIcon className="h-5 w-5"/></button>
                </div>
                <div className="calendar-grid">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="calendar-day-header">{day}</div>)}
                </div>
                <div className="calendar-grid">
                    {allCells.map((day, index) => (
                        <div key={index} className="calendar-cell">
                            {day && (
                                <button
                                    onClick={() => setSelectedDate(day)}
                                    className={`calendar-day-btn ${day.toDateString() === today.toDateString() ? 'today' : ''} ${day.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`}
                                >
                                    {day.getDate()}
                                    {goalsByDate[day.toDateString()] && <div className="calendar-task-dot"></div>}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (student) {
                const streakData = await getLearningStreak(student.id);
                setLearningStreak(streakData?.count || 0);
            }
        };
        fetchDashboardData();
    }, [student]);
    
    if (!student) return null;
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-text-primary">
                    {t('welcomeBack', { name: student.name.split(' ')[0] })}
                </h1>
                <p className="text-lg text-text-secondary mt-1">{t('dashboardSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard icon={Trophy} label="Total XP" value={student.points.toLocaleString()} colorClass="bg-amber-500" className="animate-fade-in" style={{ animationDelay: '0.2s' }} />
                <StatsCard icon={Flame} label="Learning Streak" value={`${learningStreak} Days`} colorClass="bg-red-500" className="animate-fade-in" style={{ animationDelay: '0.4s' }} />
                <StatsCard icon={ClipboardCheck} label="Missions Completed" value={`${student.performance.length}`} colorClass="bg-teal-500" className="animate-fade-in" style={{ animationDelay: '0.6s' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Main Content Area (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="dashboard-highlight-card">
                        <MissionCard onStartMission={onStartMission} student={student} />
                    </div>
                    
                    <LearningJourney student={student} />
                    
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">The Alfanumrik Advantage</h2>
                        <p className="text-text-secondary text-sm mb-4">Explore our exclusive AI-powered tools to accelerate your learning.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FeatureCard icon={BrainCircuit} title={t('cognitiveTwin')} description={t('cognitiveTwinDesc')} onClick={onStartCognitiveTwin} />
                           <FeatureCard icon={BrainCircuit} title={t('ctGymTitle')} description={t('ctGymDescription')} onClick={onStartCriticalThinking} />
                           <FeatureCard icon={Globe} title={t('globalPrepTitle')} description={t('globalPrepDescription')} onClick={onStartGlobalPrep} />
                           <FeatureCard icon={Briefcase} title={t('careerCompassTitle')} description={t('careerCompassDesc')} onClick={onStartCareerGuidance} />
                           <FeatureCard icon={Lightbulb} title={t('alfanumrikLabTitle')} description={t('adaptiveStoryGeneratorDesc')} onClick={onStartInnovationLab} />
                           <FeatureCard icon={UserCog} title={t('leadershipCircleTitle')} description={t('leadershipCircleDesc')} onClick={onStartLeadershipCircle} />
                           <FeatureCard icon={FolderKanban} title={t('pblHubTitle')} description={t('pblHubDesc')} onClick={onStartProjectHub} />
                           <FeatureCard icon={Trophy} title={t('competitionHubTitle')} description={t('competitionHubDesc')} onClick={onStartCompetitions} />
                           <FeatureCard icon={Users} title={t('peerPediaTitle')} description={t('peerPediaDesc')} onClick={onStartPeerPedia} />
                           <FeatureCard icon={GraduationCap} title={t('examPrepTitle')} description={t('examPrepCenterDesc')} onClick={onStartExamPrep} />
                           <FeatureCard icon={Heart} title={"Personal Growth"} description={"Build resilience and a positive mindset."} onClick={onStartWellbeing} />
                        </div>
                    </div>
                </div>

                {/* Sidebar Area (Right) */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="todo-card">
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3 mb-4">
                            <CalendarDays className="h-7 w-7 text-primary"/>
                            Study Planner
                        </h2>
                        {renderCalendar()}
                        <div className="mt-4 pt-4 border-t border-dashed border-border">
                            <form onSubmit={handleAddGoal} className="space-y-3">
                                <input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="e.g., Master the mirror formula" className="w-full" required />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)} className="w-full" />
                                    <input type="time" value={newGoalTime} onChange={(e) => setNewGoalTime(e.target.value)} className="w-full" />
                                </div>
                                <button type="submit" className="w-full btn-accent flex items-center justify-center" disabled={isAddingGoal}>
                                    {isAddingGoal ? <LoadingSpinner /> : <><Plus className="h-5 w-5 mr-2"/> Add Goal</>}
                                </button>
                            </form>
                             <div className="my-4 text-center">
                                <button onClick={handleSuggestGoals} disabled={isSuggesting} className="flex items-center justify-center mx-auto px-4 py-2 text-sm bg-surface border border-border text-text-primary font-semibold rounded-lg hover:bg-bg-primary transition shadow-sm disabled:opacity-50" data-sound="click">
                                    {isSuggesting ? <><LoadingSpinner /><span className="ml-2">Getting suggestions...</span></> : <><SparklesLucide className="h-4 w-4 mr-2" /><span>Suggest Goals with AI</span></>}
                                </button>
                                {goalSuggestions.length > 0 && (
                                    <div className="mt-3 space-y-2 text-left animate-fade-in">
                                        <p className="text-xs font-semibold text-text-secondary">Click a suggestion to add it:</p>
                                        {goalSuggestions.map((suggestion, index) => (<button key={index} onClick={() => setNewGoalText(suggestion)} className="w-full text-left p-2 text-sm bg-bg-primary rounded-md hover:bg-surface border border-transparent hover:border-border transition" data-sound="click">{suggestion}</button>))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-dashed border-border">
                            <h3 className="font-bold text-text-primary mb-2">Tasks for {selectedDate.toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {goalsForSelectedDate.length > 0 ? (
                                    goalsForSelectedDate.map(goal => (
                                        <div key={goal.id} className={`todo-item ${goal.isCompleted ? 'completed' : ''}`}>
                                            <input type="checkbox" checked={goal.isCompleted} onChange={() => handleToggleGoal(goal)} id={`goal-${goal.id}`} className="todo-checkbox mr-3" />
                                            <label htmlFor={`goal-${goal.id}`} className="flex-grow cursor-pointer text-text-primary">{goal.text}</label>
                                            <button onClick={() => handleRemoveGoal(goal)} className="todo-delete-btn" aria-label={`Remove goal: ${goal.text}`} data-sound="click"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))
                                ) : <p className="text-center text-text-secondary text-sm py-4">No goals scheduled for this day.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-highlight-card p-6">
                        <h2 className="text-2xl font-bold text-text-primary">Study Library</h2>
                        <p className="text-text-secondary text-sm mt-1 mb-4">Explore your curriculum.</p>
                        <FeatureCard icon={Library} title="Browse Syllabus" description="Explore chapters, concepts, and practice." onClick={onBrowse} />
                        <FeatureCard icon={HelpCircle} title="AI Doubt Solver" description="Get instant help on any topic." onClick={onStartDoubtSolver} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(StudentDashboard);