import React, { useState, useEffect } from 'react';
import { Student, AdaptiveAction, LearningStreak } from '../types';
import { getLearningStreak, getWellbeingModuleStatus } from '../services/pineconeService';
import { getAdaptiveNextStep } from '../services/geminiService';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightIcon, BookOpenIcon, SparklesIcon, PuzzlePieceIcon, HeartIcon, TrophyIcon, MagnifyingGlassIcon, FireIcon, QuestionMarkCircleIcon, CubeIcon, UsersIcon, GlobeAltIcon, UserGroupIcon, ChatBubbleLeftRightIcon, BriefcaseIcon, Bars3Icon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';

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
    
    const progress = action.details.confidence ? Math.round(action.details.confidence * 100) : 75;

    return (
        <div className="p-6 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary">{t('todaysMission')}</h2>
                        <p className="text-text-secondary mt-1">{t('todaysMissionDesc')}</p>
                    </div>
                    <div className="power-core">
                        <div className="power-core-level" style={{ '--progress': `${progress}%` } as React.CSSProperties}></div>
                    </div>
                </div>
            
                <div className="mt-6 bg-slate-900/50 p-4 rounded-lg border border-border">
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
                >
                    <span>{t('launchMission')}</span>
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ElementType; title: string; description: string; onClick: () => void; }> = ({ icon: Icon, title, description, onClick }) => (
    <button onClick={onClick} className="command-card w-full p-4 rounded-xl flex items-center gap-4 text-left">
       <Icon className="h-6 w-6 text-primary flex-shrink-0" />
       <div className="flex-grow">
            <h3 className="font-bold text-text-primary text-base">{title}</h3>
            <p className="text-text-secondary text-xs">{description}</p>
       </div>
    </button>
);

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
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
    onStartPeerPedia
}) => {
    const { t } = useLanguage();
    const { currentUser: student } = useAuth();
    const [learningStreak, setLearningStreak] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        const imageUrl = `https://source.unsplash.com/random/1600x900/?study,library,desk,learning,technology&sig=${Date.now()}`;
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setBackgroundImageUrl(imageUrl);
            setImageLoaded(true);
        };
    }, []);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (student) {
                const streakData = await getLearningStreak(student.id);
                setLearningStreak(streakData?.count || 0);
            }
        };
        fetchDashboardData();

        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        const handleResize = () => setIsSidebarOpen(!mediaQuery.matches);
        handleResize();
        mediaQuery.addEventListener('change', handleResize);
        return () => mediaQuery.removeEventListener('change', handleResize);
    }, [student]);
    
    if (!student) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-text-primary">
                {t('welcomeBack', { name: student.name.split(' ')[0] })}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard icon={TrophyIcon} label="Total Points" value={student.points.toLocaleString()} colorClass="bg-accent" className="animate-fade-in" style={{ animationDelay: '0.2s' }} />
                <StatsCard icon={FireIcon} label="Learning Streak" value={`${learningStreak} Days`} colorClass="bg-red-500" className="animate-fade-in" style={{ animationDelay: '0.4s' }} />
                <StatsCard icon={BookOpenIcon} label="Completed" value={`${student.performance.length} Modules`} colorClass="bg-primary" className="animate-fade-in" style={{ animationDelay: '0.6s' }} />
            </div>

            <div>
                 <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`sidebar-toggle ${isSidebarOpen ? 'shifted' : ''}`}
                    aria-label="Toggle sidebar"
                 >
                     <ArrowRightIcon className="h-5 w-5 transition-transform" />
                 </button>

                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Mission Hub</h2>
                            <div className="mt-4 space-y-3">
                                <FeatureCard icon={MagnifyingGlassIcon} title="Syllabus Browser" description="Explore chapters, concepts, and practice." onClick={onBrowse} />
                                <FeatureCard icon={ChatBubbleLeftRightIcon} title="AI Tutor" description="Get instant help on any topic." onClick={onStartDoubtSolver} />
                                <FeatureCard icon={BriefcaseIcon} title={t('careerCompassTitle')} description={t('careerCompassDesc')} onClick={onStartCareerGuidance} />
                                <FeatureCard icon={TrophyIcon} title={t('competitionHubTitle')} description={t('competitionHubDesc')} onClick={onStartCompetitions} />

                            </div>
                        </div>
                        
                         <div>
                            <h2 className="text-2xl font-bold text-text-primary">Collaborate & Create</h2>
                             <div className="mt-4 space-y-3">
                                <FeatureCard icon={CubeIcon} title="Innovation Lab" description="Solve real-world problems." onClick={onStartInnovationLab} />
                                <FeatureCard icon={PuzzlePieceIcon} title={t('ctGymTitle')} description={t('ctGymDescription')} onClick={onStartCriticalThinking} />
                                <FeatureCard icon={UsersIcon} title={t('pblHubTitle')} description={t('pblHubDesc')} onClick={onStartProjectHub} />
                                <FeatureCard icon={UserGroupIcon} title={t('peerPediaTitle')} description={t('peerPediaDesc')} onClick={onStartPeerPedia} />
                                <FeatureCard icon={GlobeAltIcon} title="Global Prep" description="Practice for SAT, ACT, & more." onClick={onStartGlobalPrep} />
                                <FeatureCard icon={UserGroupIcon} title="Leadership Circle" description="Join debates & collaborations." onClick={onStartLeadershipCircle} />
                            </div>
                        </div>
                    </div>
                </aside>

                <main className={`main-content-area ${isSidebarOpen ? 'lg:shifted' : ''}`}>
                    <div className="mission-bg-container">
                        <div 
                            className={`mission-bg-image ${imageLoaded ? 'loaded' : ''}`} 
                            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                            aria-label="Inspiring background image of a study environment"
                        ></div>
                        <div className="mission-bg-overlay"></div>
                        <div className="mission-bg-content">
                             <MissionCard onStartMission={onStartMission} student={student} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default React.memo(StudentDashboard);