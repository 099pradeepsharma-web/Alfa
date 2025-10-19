import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import { Grade, Subject, Chapter, Student, NextStepRecommendation, Concept, StudyGoal, AdaptiveAction, Teacher, Parent, Achievement } from './types';
import { getCurriculum } from './services/curriculumService';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useLanguage } from './contexts/Language-context';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import { ALL_ACHIEVEMENTS } from './data/achievements';
import { useSound } from './hooks/useSound';
import { createTutorChat } from './services/geminiService';
import { createLazyComponent } from './utils/componentLoader';

// --- Lazy Loading Screens and Components for Performance Optimization ---
// FIX: The lazy import for components with named exports (like ChapterView) must be handled with `.then()`. This was causing type signature errors.
const Header = createLazyComponent(() => import('./components/Header'), <header className="h-[73px] bg-surface border-b border-border"></header>);
const Footer = createLazyComponent(() => import('./components/Footer'), null);
const GradeSelector = createLazyComponent(() => import('./components/GradeSelector'));
const SubjectSelector = createLazyComponent(() => import('./components/SubjectSelector'));
const ChapterView = createLazyComponent(() => import('./components/ChapterView').then(module => ({ default: module.ChapterView })));
const AuthScreen = createLazyComponent(() => import('./screens/AuthScreen'));
const StudentDashboard = createLazyComponent(() => import('./screens/StudentDashboard'));
const PersonalizedPathScreen = createLazyComponent(() => import('./screens/PersonalizedPathScreen'));
const PrivacyPolicyScreen = createLazyComponent(() => import('./screens/PrivacyPolicyScreen'));
const FAQScreen = createLazyComponent(() => import('./screens/FAQScreen'));
const TutorSessionScreen = createLazyComponent(() => import('./screens/TutorSessionScreen').then(module => ({ default: module.TutorSessionScreen })));
const CompetitionScreen = createLazyComponent(() => import('./screens/CompetitionScreen'));
const CareerGuidanceScreen = createLazyComponent(() => import('./screens/CareerGuidanceScreen'));
const InnovationLabScreen = createLazyComponent(() => import('./screens/InnovationLabScreen'));
const CriticalThinkingScreen = createLazyComponent(() => import('./screens/CriticalThinkingScreen'));
const GlobalPrepScreen = createLazyComponent(() => import('./screens/GlobalPrepScreen'));
const LeadershipCircleScreen = createLazyComponent(() => import('./screens/LeadershipCircleScreen'));
const AIChatbotScreen = createLazyComponent(() => import('./screens/AIChatbotScreen'));
const ProjectHubScreen = createLazyComponent(() => import('./screens/ProjectHubScreen'));
const PeerPediaScreen = createLazyComponent(() => import('./screens/PeerPediaScreen'));
const TutorialScreen = createLazyComponent(() => import('./screens/TutorialScreen'));
const AboutScreen = createLazyComponent(() => import('./screens/AboutScreen'));
const TermsScreen = createLazyComponent(() => import('./screens/TermsScreen'));
const LandingPage = createLazyComponent(() => import('./screens/LandingPage'));
const ContactScreen = createLazyComponent(() => import('./screens/ContactScreen'));
const TeacherDashboard = createLazyComponent(() => import('./screens/TeacherDashboard'));
const ParentDashboard = createLazyComponent(() => import('./screens/ParentDashboard').then(module => ({ default: module.ParentDashboard })));
const StudentPerformanceView = createLazyComponent(() => import('./screens/StudentPerformanceView'));
const AchievementToast = createLazyComponent(() => import('./components/AchievementToast'), null);
const PointsToast = createLazyComponent(() => import('./components/PointsToast'), null);
const ExamPrepScreen = createLazyComponent(() => import('./screens/ExamPrepScreen'));
const CognitiveTwinScreen = createLazyComponent(() => import('./screens/CognitiveTwinScreen'));
const MathMentorScreen = createLazyComponent(() => import('./screens/MathMentorScreen'));


type StudentView = 'dashboard' | 'path' | 'browse' | 'wellbeing' | 'tutor' | 'tutorial' | 'competitions' | 'career_guidance' | 'innovation_lab' | 'critical_thinking' | 'global_prep' | 'leadership_circle' | 'ai_chatbot' | 'project_hub' | 'peer_pedia' | 'exam_prep' | 'cognitive_twin' | 'math_mentor';
type AppView = 'student_flow' | 'privacy_policy' | 'faq' | 'about' | 'terms' | 'contact';

const App: React.FC = () => {
  // Global State from Contexts
  const { 
    currentUser, currentRole, isAuthenticated, users, 
    logout, updateUser, addStudyGoal, toggleStudyGoal, removeStudyGoal, addAchievement 
  } = useAuth();
  const [appView, setAppView] = useState<AppView>('student_flow');
  const { language, isLoaded: translationsLoaded } = useLanguage();
  const { playSound } = useSound();

  // Curriculum State
  const [curriculum, setCurriculum] = useState<Grade[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Student-specific State
  const [studentView, setStudentView] = useState<StudentView>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Chat state
  const [tutorChat, setTutorChat] = useState<Chat | null>(null);
  
  // Profile update state
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);
  
  // Gamification UI State
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController>();

  // --- Sound Effect Integration ---
  useEffect(() => {
    const handleInteractionSound = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const soundElement = target.closest('[data-sound]');
      if (soundElement) {
        const soundName = soundElement.getAttribute('data-sound');
        if (soundName === 'click' || soundName === 'complete' || soundName === 'swoosh') {
          playSound(soundName as any);
        }
      }
    };
    document.addEventListener('click', handleInteractionSound);
    return () => document.removeEventListener('click', handleInteractionSound);
  }, [playSound]);

  const loadCurriculum = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingCurriculum(true);
    setError(null);
    try {
        const data = await getCurriculum(controller.signal);
        setCurriculum(data);
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Failed to load curriculum:", error);
            setError("We couldn't load the learning curriculum. Please check your internet connection and try again.");
        }
    } finally {
        if (!controller.signal.aborted) {
            setIsLoadingCurriculum(false);
        }
    }
  }, []);

  useEffect(() => {
    loadCurriculum();
    return () => {
        abortControllerRef.current?.abort();
    }
  }, [loadCurriculum]);
  
  const handleBackToDashboard = useCallback(() => {
    setStudentView('dashboard');
    setViewingStudent(null); // Clear any student being viewed by a teacher/parent
  }, []);
  
  const handleGoHome = useCallback(() => {
    setStudentView('dashboard');
    setAppView('student_flow');
    setShowAuthScreen(false);
    setViewingStudent(null);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setStudentView('dashboard');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setShowAuthScreen(false);
  }, [logout]);
  
  // --- Navigation Handlers ---
  const handleNavigateToContact = useCallback(() => setAppView('contact'), []);
  const handleBackToGrades = useCallback(() => { setSelectedGrade(null); setSelectedSubject(null); setSelectedChapter(null); }, []);
  const handleGradeSelect = useCallback((grade: Grade) => { setSelectedGrade(grade); setSelectedSubject(null); setSelectedChapter(null); }, []);
  const handleSubjectSelect = useCallback((subject: Subject) => { setSelectedSubject(subject); setSelectedChapter(null); }, []);
  const handleChapterSelect = useCallback((chapter: Chapter) => { setSelectedChapter(chapter); }, []);
  const handleBackToSubjects = useCallback(() => { setSelectedSubject(null); setSelectedChapter(null); }, []);
  const handleBackToChapters = useCallback(() => { setSelectedChapter(null); }, []);

  const handleStartBrowsing = useCallback(() => {
    if (currentRole === 'student') {
        const student = currentUser as Student;
        if (!selectedGrade) {
            const studentGrade = curriculum.find(g => g.level === student.grade);
            if (studentGrade) setSelectedGrade(studentGrade);
        }
        setStudentView('browse');
    }
  }, [currentUser, currentRole, curriculum, selectedGrade]);
  
  const handleRecommendation = useCallback((recommendation: NextStepRecommendation) => {
    switch (recommendation.action) {
        case 'START_CRITICAL_THINKING': setStudentView('critical_thinking'); break;
        case 'START_WELLBEING': setStudentView('wellbeing'); break;
        case 'REVISE_PREREQUISITE':
            if (recommendation.prerequisiteChapterTitle && selectedSubject) {
                const chapter = selectedSubject.chapters.find(c => c.title === recommendation.prerequisiteChapterTitle);
                if (chapter) setSelectedChapter(chapter);
            }
            break;
        case 'CONTINUE':
        case 'REVIEW':
        default:
            if (recommendation.nextChapterTitle && selectedSubject) {
                const chapter = selectedSubject.chapters.find(c => c.title === recommendation.nextChapterTitle);
                if (chapter) setSelectedChapter(chapter);
            }
            break;
    }
  }, [selectedSubject]);

  const handleStartTutorSession = useCallback((concepts: Concept[]) => {
    if (!selectedGrade || !selectedSubject || !selectedChapter || !currentUser || currentRole !== 'student') return;
    const newChat = createTutorChat(selectedGrade.level, selectedSubject.name, selectedChapter.title, concepts, currentUser as Student, language);
    setTutorChat(newChat);
    setStudentView('tutor');
  }, [selectedGrade, selectedSubject, selectedChapter, currentUser, currentRole, language]);

  const handleEndTutorSession = useCallback(() => { setTutorChat(null); setStudentView('browse'); }, []);
  const handleFinishTutorial = useCallback(() => { try { localStorage.setItem('alfanumrik-tutorial-seen', 'true'); } catch (e) { console.error("Failed to save tutorial status:", e); } setStudentView('dashboard'); }, []);
  
  const handleStartStudentView = useCallback((view: StudentView) => setStudentView(view), []);
  const handleSearchSelect = useCallback((grade: Grade, subject: Subject, chapter: Chapter) => {
    setSelectedGrade(grade);
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    setStudentView('browse');
    setAppView('student_flow');
  }, []);
  
  const handleAddAchievement = useCallback((achievementId: string) => {
    if (currentRole !== 'student') return;
    const student = currentUser as Student;
    if (student.achievements.some(a => a.id === achievementId)) return;
    
    const achievementData = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievementData) {
        addAchievement(achievementId);
        const achievementWithTimestamp: Achievement = { ...achievementData, timestamp: new Date().toISOString() };
        setShowAchievement(achievementWithTimestamp);
    }
  }, [addAchievement, currentUser, currentRole]);

  const updateStudentPoints = useCallback((pointsToAdd: number) => {
    if (currentRole !== 'student' || !currentUser) return;
    updateUser({ ...(currentUser as Student), points: (currentUser as Student).points + pointsToAdd });
    if (pointsToAdd > 0) setAwardedPoints(pointsToAdd);
  }, [currentUser, currentRole, updateUser]);

  const updateUserProfile = useCallback(async (updatedData: Partial<Student>) => {
    if (currentRole !== 'student' || !currentUser) return;
    setProfileUpdateLoading(true);
    setProfileUpdateError(null);
    try {
        await updateUser({ ...currentUser, ...updatedData } as Student);
    } catch (err: any) {
        setProfileUpdateError(err.message);
        throw err;
    } finally {
        setProfileUpdateLoading(false);
    }
  }, [currentUser, currentRole, updateUser]);

  const handleMissionComplete = useCallback((action: AdaptiveAction) => {
    if (action.details.subject && action.details.chapter && currentRole === 'student') {
        const student = currentUser as Student;
        const grade = curriculum.find(g => g.level === student.grade);
        const subject = grade?.subjects?.find(s => s.name === action.details.subject);
        const chapter = subject?.chapters?.find(c => c.title === action.details.chapter);
        
        if (grade && subject && chapter) {
            setSelectedGrade(grade);
            setSelectedSubject(subject);
            setSelectedChapter(chapter);
            setStudentView('browse');
        } else {
            setStudentView('dashboard');
        }
    } else {
        setStudentView('dashboard');
    }
  }, [curriculum, currentUser, currentRole]);

  const renderStudentBrowseFlow = () => {
    const student = currentUser as Student;
    if (!selectedGrade) return <GradeSelector grades={curriculum} onSelect={handleGradeSelect} onBack={handleBackToDashboard} />;
    if (!selectedSubject) return <SubjectSelector grade={selectedGrade} onSubjectSelect={handleSubjectSelect} onBack={handleBackToGrades} onRecommendation={handleRecommendation} />;
    if (!selectedChapter) return <SubjectSelector grade={selectedGrade} selectedSubject={selectedSubject} onSubjectSelect={handleSubjectSelect} onChapterSelect={handleChapterSelect} onBack={handleBackToSubjects} onRecommendation={handleRecommendation} />;
    
    return <ChapterView 
        grade={selectedGrade} subject={selectedSubject} chapter={selectedChapter} student={student} language={language}
        onBackToChapters={handleBackToChapters} onBackToSubjects={handleBackToSubjects} onChapterSelect={handleChapterSelect}
        onUpdatePoints={updateStudentPoints} onAddAchievement={handleAddAchievement}
    />;
  };
  
  const renderStudentFlow = () => {
    const student = currentUser as Student;
    if (!student) return null;

    if (studentView === 'dashboard') {
        const hasSeenTutorial = localStorage.getItem('alfanumrik-tutorial-seen') === 'true';
        if (!hasSeenTutorial) {
            setTimeout(() => setStudentView('tutorial'), 0);
            return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
        }
    }
    
    const commonDashboardProps = {
        student: student, users: users,
        onStartMission: () => handleStartStudentView('path'), onBrowse: handleStartBrowsing,
        onStartWellbeing: () => handleStartStudentView('wellbeing'), onStartTutorial: () => handleStartStudentView('tutorial'),
        onStartInnovationLab: () => handleStartStudentView('innovation_lab'), onStartCriticalThinking: () => handleStartStudentView('critical_thinking'),
        onStartGlobalPrep: () => handleStartStudentView('global_prep'), onStartLeadershipCircle: () => handleStartStudentView('leadership_circle'),
        onStartCareerGuidance: () => handleStartStudentView('career_guidance'), onStartDoubtSolver: () => handleStartStudentView('ai_chatbot'),
        onStartCompetitions: () => handleStartStudentView('competitions'), onStartProjectHub: () => handleStartStudentView('project_hub'),
        onStartPeerPedia: () => handleStartStudentView('peer_pedia'), onStartExamPrep: () => handleStartStudentView('exam_prep'),
        onStartCognitiveTwin: () => handleStartStudentView('cognitive_twin'),
        onAddGoal: addStudyGoal, onToggleGoal: toggleStudyGoal, onRemoveGoal: removeStudyGoal,
    };

    switch(studentView) {
        case 'tutorial': return <TutorialScreen onFinish={handleFinishTutorial} />;
        case 'dashboard': return <StudentDashboard {...commonDashboardProps} />;
        case 'path': return <PersonalizedPathScreen student={student} onBack={handleBackToDashboard} onMissionComplete={handleMissionComplete} />;
        case 'browse': return renderStudentBrowseFlow();
        case 'tutor': return tutorChat ? <TutorSessionScreen student={student} chat={tutorChat} onBack={handleEndTutorSession} /> : null;
        case 'ai_chatbot': return <AIChatbotScreen student={student} onBack={handleBackToDashboard} />;
        case 'innovation_lab': return <InnovationLabScreen onBack={handleBackToDashboard} />;
        case 'critical_thinking': return <CriticalThinkingScreen onBack={handleBackToDashboard} />;
        case 'global_prep': return <GlobalPrepScreen onBack={handleBackToDashboard} />;
        case 'leadership_circle': return <LeadershipCircleScreen student={student} onBack={handleBackToDashboard} />;
        case 'competitions': return <CompetitionScreen onBack={handleBackToDashboard} />;
        case 'project_hub': return <ProjectHubScreen student={student} onBack={handleBackToDashboard} />;
        case 'peer_pedia': return <PeerPediaScreen student={student} onBack={handleBackToDashboard} />;
        case 'career_guidance': return <CareerGuidanceScreen student={student} onBack={handleBackToDashboard} />;
        case 'exam_prep': return <ExamPrepScreen student={student} onBack={handleBackToDashboard} />;
        case 'cognitive_twin': return <CognitiveTwinScreen student={student} onBack={handleBackToDashboard} onStartCalibration={() => handleStartStudentView('critical_thinking')} />;
        case 'math_mentor': return <MathMentorScreen onBack={handleBackToDashboard} />;
        case 'wellbeing': {
            const wellbeingChapter: Chapter = { title: 'The Great Transformation: Navigating Your Journey from Teen to Adult', topics: [], tags: [] };
            const wellbeingSubject: Subject = { name: 'Personal Growth & Well-being', icon: 'SparklesIcon', chapters: [wellbeingChapter] };
            const wellbeingGrade: Grade = { level: student.grade, description: 'Special Module', subjects: [wellbeingSubject] };
            return <ChapterView grade={wellbeingGrade} subject={wellbeingSubject} chapter={wellbeingChapter} student={student} language={language} onBackToChapters={handleBackToDashboard} onBackToSubjects={handleBackToDashboard} onChapterSelect={() => {}} onUpdatePoints={updateStudentPoints} onAddAchievement={handleAddAchievement} />;
        }
        default: return <StudentDashboard {...commonDashboardProps} />;
    }
  };

  const renderContent = () => {
    switch(appView) {
      case 'privacy_policy': return <PrivacyPolicyScreen onBack={handleGoHome} />;
      case 'faq': return <FAQScreen onBack={handleGoHome} />;
      case 'about': return <AboutScreen onBack={handleGoHome} />;
      case 'terms': return <TermsScreen onBack={handleGoHome} />;
      case 'contact': return <ContactScreen onBack={handleGoHome} />;
      default: break;
    }

    if (!isAuthenticated) {
        if(showAuthScreen) return <AuthScreen onBack={() => setShowAuthScreen(false)} />;
        return <LandingPage onNavigateToAuth={() => setShowAuthScreen(true)} onNavigateToContact={handleNavigateToContact} onNavigateToAbout={() => setAppView('about')} />;
    }
    
    if (isLoadingCurriculum || !translationsLoaded) {
        return <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"><LoadingSpinner /><p className="mt-4 text-text-secondary text-lg">Loading curriculum...</p></div>;
    }
    
    if (error) {
        return <div className="text-center p-8 bg-status-danger rounded-lg max-w-2xl mx-auto"><ExclamationTriangleIcon className="h-12 w-12 mx-auto text-status-danger" /><h3 className="text-xl font-bold text-status-danger mt-4">Could Not Load App Content</h3><p className="text-status-danger mt-2">{error}</p><button onClick={loadCurriculum} className="mt-6 flex items-center justify-center mx-auto px-6 py-2 bg-status-danger text-white font-bold rounded-lg shadow-md hover:opacity-80 transition" style={{ backgroundColor: 'rgb(var(--c-error))' }}><ArrowPathIcon className="h-5 w-5 mr-2" />Retry</button></div>;
    }
    
    if (viewingStudent) {
        return <StudentPerformanceView userRole={currentRole as 'teacher' | 'parent'} student={viewingStudent} language={language} onBack={() => setViewingStudent(null)} />;
    }

    if (currentRole === 'teacher') {
        const teacher = currentUser as Teacher;
        return <TeacherDashboard students={users.filter(s => teacher.studentIds.includes(s.id))} onSelectStudent={setViewingStudent} onBack={handleLogout} />;
    }
    
    if (currentRole === 'parent') {
        const parent = currentUser as Parent;
        const myChild = users.find(s => parent.childIds.includes(s.id));
        if (!myChild) return <p>Child data not found.</p>;
        return <ParentDashboard child={myChild} onSelectStudent={setViewingStudent} onBack={handleLogout} />;
    }

    if (currentRole === 'student') return renderStudentFlow();
    
    return <LandingPage onNavigateToAuth={() => setShowAuthScreen(true)} onNavigateToContact={handleNavigateToContact} onNavigateToAbout={() => setAppView('about')} />;
  };

  return (
    <div className={`flex flex-col min-h-screen bg-bg-primary ${!isAuthenticated ? 'landing-page' : ''}`}>
      {isAuthenticated && currentUser && (
        <Header 
          onGoHome={handleGoHome} showHomeButton={true} curriculum={curriculum} onSearchSelect={handleSearchSelect}
          isLoggedIn={isAuthenticated} user={currentUser} userRole={currentRole}
          onUpdateProfile={updateUserProfile} profileUpdateLoading={profileUpdateLoading} profileUpdateError={profileUpdateError}
          onLogout={handleLogout}
        />
      )}
      <main className={`${isAuthenticated ? 'container mx-auto p-4 md:p-8' : ''} flex-grow`}>
        {renderContent()}
      </main>
      {!showAuthScreen && (
        <Footer onShowAbout={() => setAppView('about')} onShowPrivacyPolicy={() => setAppView('privacy_policy')} onShowTerms={() => setAppView('terms')} onShowFaq={() => setAppView('faq')} />
      )}
      {showAchievement && (
        <AchievementToast achievement={showAchievement} onClose={() => setShowAchievement(null)} />
      )}
       {awardedPoints !== null && (
        <PointsToast points={awardedPoints} onClose={() => setAwardedPoints(null)} />
      )}
    </div>
  );
};

export default App;