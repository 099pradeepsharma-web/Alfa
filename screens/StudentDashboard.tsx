import React, { useState, useEffect } from 'react';
import { Student, AdaptiveAction, LearningStreak, StudyGoal } from '../types';
import { getLearningStreak } from '../services/pineconeService';
import { getAdaptiveNextStep, generateStudyGoalSuggestions } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, PuzzlePieceIcon, HeartIcon, TrophyIcon, MagnifyingGlassIcon, FireIcon, QuestionMarkCircleIcon, CubeIcon, UsersIcon, GlobeAltIcon, UserGroupIcon, ChatBubbleLeftRightIcon, BriefcaseIcon, Bars3Icon, ClipboardDocumentCheckIcon, PlusIcon, XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSound } from '../hooks/useSound';

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
  onAddGoal: (text: string) => Promise<void>;
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
                    <span>{t('launchMission')}</span>
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
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
    onAddGoal,
    onToggleGoal,
    onRemoveGoal
}) => {
    const { t, language } = useLanguage();
    const { playSound } = useSound();
    const [learningStreak, setLearningStreak] = useState(0);
    const [newGoalText, setNewGoalText] = useState('');
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);


    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        setIsAddingGoal(true);
        try {
            await onAddGoal(newGoalText);
            setNewGoalText('');
            setGoalSuggestions([]); // Clear suggestions after adding a goal
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
    
    // Placeholder for overall progress
    const overallProgress = (student.performance.length / 50) * 100; // Assuming 50 total modules for the quest

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-text-primary">
                    {t('welcomeBack', { name: student.name.split(' ')[0] })}
                </h1>
                <p className="text-lg text-text-secondary mt-1">{t('dashboardSubtitle')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard icon={TrophyIcon} label="Total XP" value={student.points.toLocaleString()} colorClass="bg-amber-500" className="animate-fade-in" style={{ animationDelay: '0.2s' }} />
                <StatsCard icon={FireIcon} label="Learning Streak" value={`${learningStreak} Days`} colorClass="bg-red-500" className="animate-fade-in" style={{ animationDelay: '0.4s' }} />
                <StatsCard icon={BookOpenIcon} label="Missions Completed" value={`${student.performance.length}`} colorClass="bg-teal-500" className="animate-fade-in" style={{ animationDelay: '0.6s' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Main Content Area (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="dashboard-highlight-card">
                        <MissionCard onStartMission={onStartMission} student={student} />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">The Alfanumrik Advantage</h2>
                        <p className="text-text-secondary text-sm mb-4">Explore our exclusive AI-powered tools to accelerate your learning.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <FeatureCard icon={PuzzlePieceIcon} title={t('ctGymTitle')} description={t('ctGymDescription')} onClick={onStartCriticalThinking} />
                           <FeatureCard icon={GlobeAltIcon} title={t('globalPrepTitle')} description={t('globalPrepDescription')} onClick={onStartGlobalPrep} />
                           <FeatureCard icon={BriefcaseIcon} title={t('careerCompassTitle')} description={t('careerCompassDesc')} onClick={onStartCareerGuidance} />
                           <FeatureCard icon={CubeIcon} title={t('alfanumrikLabTitle')} description={t('adaptiveStoryGeneratorDesc')} onClick={onStartInnovationLab} />
                           <FeatureCard icon={UserGroupIcon} title={t('leadershipCircleTitle')} description={t('leadershipCircleDesc')} onClick={onStartLeadershipCircle} />
                           <FeatureCard icon={UsersIcon} title={t('pblHubTitle')} description={t('pblHubDesc')} onClick={onStartProjectHub} />
                           <FeatureCard icon={TrophyIcon} title={t('competitionHubTitle')} description={t('competitionHubDesc')} onClick={onStartCompetitions} />
                           <FeatureCard icon={SparklesIcon} title={t('peerPediaTitle')} description={t('peerPediaDesc')} onClick={onStartPeerPedia} />
                        </div>
                    </div>
                </div>

                {/* Sidebar Area (Right) */}
                <div className="lg:col-span-1 space-y-8">
                    {/* NEW "My Study Goals" To-Do List */}
                    <div className="todo-card">
                        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3 mb-4">
                            <ClipboardDocumentCheckIcon className="h-7 w-7 text-primary"/>
                            My Study Goals
                        </h2>
                        <form onSubmit={handleAddGoal} className="flex gap-2">
                            <input 
                                type="text" 
                                value={newGoalText}
                                onChange={(e) => setNewGoalText(e.target.value)}
                                placeholder="e.g., Master the mirror formula"
                                className="flex-grow"
                                aria-label="New study goal"
                            />
                            <button type="submit" className="btn-accent p-3 flex-shrink-0" disabled={isAddingGoal || !newGoalText.trim()} aria-label="Set Goal" data-sound="click">
                                {isAddingGoal ? <LoadingSpinner /> : <PlusIcon className="h-5 w-5"/>}
                            </button>
                        </form>

                        <div className="my-4 pt-4 border-t border-dashed border-border text-center">
                            <button onClick={handleSuggestGoals} disabled={isSuggesting} className="flex items-center justify-center mx-auto px-4 py-2 text-sm bg-surface border border-border text-text-primary font-semibold rounded-lg hover:bg-bg-primary transition shadow-sm disabled:opacity-50" data-sound="click">
                                {isSuggesting ? (
                                    <><LoadingSpinner /><span className="ml-2">Getting suggestions...</span></>
                                ) : (
                                    <><SparklesIcon className="h-4 w-4 mr-2" /><span>Suggest Goals with AI</span></>
                                )}
                            </button>
                            {goalSuggestions.length > 0 && (
                                <div className="mt-3 space-y-2 text-left animate-fade-in">
                                    <p className="text-xs font-semibold text-text-secondary">Click a suggestion to add it:</p>
                                    {goalSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setNewGoalText(suggestion)}
                                            className="w-full text-left p-2 text-sm bg-bg-primary rounded-md hover:bg-surface border border-transparent hover:border-border transition"
                                            data-sound="click"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                            {student?.studyGoals && student.studyGoals.length > 0 ? (
                                student.studyGoals.map(goal => (
                                    <div key={goal.id} className={`todo-item ${goal.isCompleted ? 'completed' : ''}`}>
                                        <input 
                                            type="checkbox"
                                            checked={goal.isCompleted}
                                            onChange={() => handleToggleGoal(goal)}
                                            id={`goal-${goal.id}`}
                                            className="todo-checkbox mr-3"
                                        />
                                        <label htmlFor={`goal-${goal.id}`} className="flex-grow cursor-pointer text-text-primary">
                                            {goal.text}
                                        </label>
                                        <button onClick={() => handleRemoveGoal(goal)} className="todo-delete-btn" aria-label={`Remove goal: ${goal.text}`} data-sound="click">
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-text-secondary py-4">Set a goal to get started!</p>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-highlight-card p-6">
                        <h2 className="text-2xl font-bold text-text-primary">Study Library</h2>
                        <p className="text-text-secondary text-sm mt-1 mb-4">Explore your curriculum.</p>
                        <FeatureCard icon={MagnifyingGlassIcon} title="Browse Syllabus" description="Explore chapters, concepts, and practice." onClick={onBrowse} />
                        <FeatureCard icon={ChatBubbleLeftRightIcon} title="AI Doubt Solver" description="Get instant help on any topic." onClick={onStartDoubtSolver} />
                        <FeatureCard icon={AcademicCapIcon} title={t('examPrepCenterTitle')} description={t('examPrepCenterDesc')} onClick={onStartExamPrep} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(StudentDashboard);
