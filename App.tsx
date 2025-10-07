



import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Grade, Subject, Chapter, Student, NextStepRecommendation, Concept, StudyGoal, AdaptiveAction, Teacher, Parent, Achievement } from './types';
import { getCurriculum } from './services/curriculumService';
import { MOCK_STUDENTS } from './data/mockData';
import { createTutorChat } from './services/geminiService';
import { Chat } from '@google/genai';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useLanguage } from './contexts/Language-context';
import LoadingSpinner from './components/LoadingSpinner';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { useAuth } from './contexts/AuthContext';
import { ALL_ACHIEVEMENTS } from './data/achievements';

// --- Lazy Loading Screens and Components for Performance Optimization ---
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const GradeSelector = lazy(() => import('./components/GradeSelector'));
const SubjectSelector = lazy(() => import('./components/SubjectSelector'));
const ChapterView = lazy(() => import('./components/ChapterView').then(module => ({ default: module.ChapterView })));
const AuthScreen = lazy(() => import('./screens/AuthScreen'));
const StudentDashboard = lazy(() => import('./screens/StudentDashboard'));
const PersonalizedPathScreen = lazy(() => import('./screens/PersonalizedPathScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));
const FAQScreen = lazy(() => import('./screens/FAQScreen'));
const TutorSessionScreen = lazy(() => import('./screens/TutorSessionScreen').then(module => ({ default: module.TutorSessionScreen })));
const CompetitionScreen = lazy(() => import('./screens/CompetitionScreen'));
const CareerGuidanceScreen = lazy(() => import('./screens/CareerGuidanceScreen'));
const InnovationLabScreen = lazy(() => import('./screens/InnovationLabScreen'));
const CriticalThinkingScreen = lazy(() => import('./screens/CriticalThinkingScreen'));
const GlobalPrepScreen = lazy(() => import('./screens/GlobalPrepScreen'));
const LeadershipCircleScreen = lazy(() => import('./screens/LeadershipCircleScreen'));
const AIChatbotScreen = lazy(() => import('./screens/AIChatbotScreen'));
const ProjectHubScreen = lazy(() => import('./screens/ProjectHubScreen'));
const PeerPediaScreen = lazy(() => import('./screens/PeerPediaScreen'));
const TutorialScreen = lazy(() => import('./screens/TutorialScreen'));
const AboutScreen = lazy(() => import('./screens/AboutScreen'));
const TermsScreen = lazy(() => import('./screens/TermsScreen'));
const LandingPage = lazy(() => import('./screens/LandingPage'));
const ContactScreen = lazy(() => import('./screens/ContactScreen'));
const TeacherDashboard = lazy(() => import('./screens/TeacherDashboard'));
const ParentDashboard = lazy(() => import('./screens/ParentDashboard').then(module => ({ default: module.ParentDashboard })));
const StudentPerformanceView = lazy(() => import('./screens/StudentPerformanceView'));
const AchievementToast = lazy(() => import('./components/AchievementToast'));
const PointsToast = lazy(() => import('./components/PointsToast'));


type StudentView = 'dashboard' | 'path' | 'browse' | 'wellbeing' | 'tutor' | 'tutorial' | 'competitions' | 'career_guidance' | 'innovation_lab' | 'critical_thinking' | 'global_prep' | 'leadership_circle' | 'ai_chatbot' | 'project_hub' | 'peer_pedia';
type AppView = 'student_flow' | 'privacy_policy' | 'faq' | 'about' | 'terms' | 'contact';
type UserRole = 'student' | 'teacher' | 'parent' | null;

const App: React.FC = () => {
  // Global State
  const { currentUser, users, logout: studentLogout, updateUser, addStudyGoal, toggleStudyGoal, removeStudyGoal, addAchievement } = useAuth();
  const [appView, setAppView] = useState<AppView>('student_flow');
  const { language, isLoaded: translationsLoaded } = useLanguage();

  // Curriculum State
  const [curriculum, setCurriculum] = useState<Grade[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth & Role State
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<Teacher | Parent | null>(null);
  const [loggedInRole, setLoggedInRole] = useState<UserRole>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Student-specific State
  const [studentView, setStudentView] = useState<StudentView>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [tutorChat, setTutorChat] = useState<Chat | null>(null);
  
  // Profile update state
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);
  
  // Gamification UI State
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);

  const loadCurriculum = useCallback(async () => {
    setIsLoadingCurriculum(true);
    setError(null);
    try {
        const data = await getCurriculum();
        setCurriculum(data);
    } catch (error) {
        console.error("Failed to load curriculum:", error);
        setError("We couldn't load the learning curriculum. Please check your internet connection and try again.");
    } finally {
        setIsLoadingCurriculum(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const handleLogout = useCallback(() => {
    studentLogout();
    setLoggedInUser(null);
    setLoggedInRole(null);
    setViewingStudent(null);
    setStudentView('dashboard');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setShowAuthScreen(false);
  }, [studentLogout]);

  const handleNonStudentLogin = useCallback((user: Teacher | Parent, role: 'teacher' | 'parent') => {
      setLoggedInUser(user);
      setLoggedInRole(role);
      setShowAuthScreen(false);
  }, []);
  
  const handleBackToDashboard = useCallback(() => {
    setStudentView('dashboard');
    setViewingStudent(null);
    if(loggedInRole) setLoggedInRole(loggedInRole); // stay in teacher/parent view
  }, [loggedInRole]);
  
  const handleGoHome = useCallback(() => {
    setStudentView('dashboard');
    setAppView('student_flow');
    setShowAuthScreen(false);
    setViewingStudent(null);
    // For teacher/parent, going "home" means back to their dashboard, not student's
    if (loggedInRole === 'teacher' || loggedInRole === 'parent') {
        // Nothing to do, they are already on their dashboard. viewingStudent is cleared.
    }
  }, [loggedInRole]);

  const handleNavigateToContact = useCallback(() => setAppView('contact'), []);

  const handleBackToGrades = useCallback(() => {
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
  }, []);

  const handleGradeSelect = useCallback((grade: Grade) => {
    setSelectedGrade(grade);
    setSelectedSubject(null);
    setSelectedChapter(null);
  }, []);

  const handleSubjectSelect = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
  }, []);
  
  const handleChapterSelect = useCallback((chapter: Chapter) => {
    setSelectedChapter(chapter);
  }, []);

  const handleBackToSubjects = useCallback(() => {
    setSelectedSubject(null);
    setSelectedChapter(null);
  }, []);

  const handleBackToChapters = useCallback(() => {
    setSelectedChapter(null);
  }, []);

  const handleStartBrowsing = useCallback(() => {
    if (currentUser) {
        if (!selectedGrade) {
            const studentGrade = curriculum.find(g => g.level === currentUser.grade);
            if (studentGrade) {
                setSelectedGrade(studentGrade);
            }
        }
        setStudentView('browse');
    }
  }, [currentUser, curriculum, selectedGrade]);
  
  const handleRecommendation = useCallback((recommendation: NextStepRecommendation) => {
    switch (recommendation.action) {
        case 'START_CRITICAL_THINKING':
            setStudentView('critical_thinking');
            break;
        case 'START_WELLBEING':
            setStudentView('wellbeing');
            break;
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


  const handleStartWellbeingModule = useCallback(() => {
    setStudentView('wellbeing');
  }, []);
  
  const handleStartTutorSession = useCallback((concepts: Concept[]) => {
    if (!selectedGrade || !selectedSubject || !selectedChapter) return;
    const chatSession = createTutorChat(selectedGrade.level, selectedSubject.name, selectedChapter.title, language, concepts);
    setTutorChat(chatSession);
    setStudentView('tutor');
}, [selectedGrade, selectedSubject, selectedChapter, language]);

  const handleEndTutorSession = useCallback(() => {
      setTutorChat(null);
      setStudentView('browse'); // Go back to the chapter view
  }, []);
  
  const handleStartTutorial = useCallback(() => {
      setStudentView('tutorial');
  }, []);

  const handleFinishTutorial = useCallback(() => {
      try {
          localStorage.setItem('alfanumrik-tutorial-seen', 'true');
      } catch (e) {
          console.error("Failed to save tutorial status to localStorage:", e);
      }
      setStudentView('dashboard');
  }, []);

  const handleStartInnovationLab = useCallback(() => setStudentView('innovation_lab'), []);
  const handleStartCriticalThinking = useCallback(() => setStudentView('critical_thinking'), []);
  const handleStartGlobalPrep = useCallback(() => setStudentView('global_prep'), []);
  const handleStartLeadershipCircle = useCallback(() => setStudentView('leadership_circle'), []);
  const handleStartCareerGuidance = useCallback(() => setStudentView('career_guidance'), []);
  const handleStartDoubtSolver = useCallback(() => setStudentView('ai_chatbot'), []);
  const handleStartCompetitions = useCallback(() => setStudentView('competitions'), []);
  const handleStartProjectHub = useCallback(() => setStudentView('project_hub'), []);
  const handleStartPeerPedia = useCallback(() => setStudentView('peer_pedia'), []);

  const handleSearchSelect = useCallback((grade: Grade, subject: Subject, chapter: Chapter) => {
    setSelectedGrade(grade);
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    setStudentView('browse');
    setAppView('student_flow');
  }, []);
  
  const handleAddAchievement = useCallback((achievementId: string) => {
    if (!currentUser || currentUser.achievements.some(a => a.id === achievementId)) return;
    
    const achievementData = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievementData) {
        addAchievement(achievementId);
        const achievementWithTimestamp: Achievement = {
            ...achievementData,
            timestamp: new Date().toISOString()
        };
        setShowAchievement(achievementWithTimestamp);
    }
  }, [addAchievement, currentUser]);

  const updateStudentPoints = useCallback((pointsToAdd: number) => {
    if (!currentUser) return;
    updateUser({ ...currentUser, points: currentUser.points + pointsToAdd });
    if (pointsToAdd > 0) {
        setAwardedPoints(pointsToAdd);
    }
  }, [currentUser, updateUser]);

  const updateUserProfile = useCallback(async (updatedData: { name: string; grade: string; school: string; city: string; board: string; avatarSeed: string; }) => {
    if (!currentUser) return;
    setProfileUpdateLoading(true);
    setProfileUpdateError(null);
    try {
        const seed = updatedData.avatarSeed.trim() || updatedData.name.trim();
        const avatar = createAvatar(lorelei, { seed });
        const newAvatarUrl = await avatar.toDataUri();

        updateUser({
            ...currentUser,
            name: updatedData.name,
            grade: updatedData.grade,
            school: updatedData.school,
            city: updatedData.city,
            board: updatedData.board,
            avatarSeed: updatedData.avatarSeed,
            avatarUrl: newAvatarUrl,
        });
    } catch (err: any) {
        setProfileUpdateError(err.message);
        throw err; // Re-throw for the modal to catch
    } finally {
        setProfileUpdateLoading(false);
    }
  }, [currentUser, updateUser]);

  const handleMissionComplete = useCallback((action: AdaptiveAction) => {
    if (action.details.subject && action.details.chapter) {
        const grade = curriculum.find(g => g.level === currentUser?.grade);
        const subject = grade?.subjects.find(s => s.name === action.details.subject);
        const chapter = subject?.chapters.find(c => c.title === action.details.chapter);
        
        if (grade && subject && chapter) {
            setSelectedGrade(grade);
            setSelectedSubject(subject);
            setSelectedChapter(chapter);
            setStudentView('browse'); // Set the view to browse, which will render ChapterView
        } else {
            console.warn("Could not find chapter from mission, returning to dashboard.");
            setStudentView('dashboard'); // Fallback to dashboard
        }
    } else {
        setStudentView('dashboard'); // Fallback for non-academic missions
    }
  }, [curriculum, currentUser]);

  const renderStudentBrowseFlow = () => {
    if (!selectedGrade) {
      return <GradeSelector grades={curriculum} onSelect={handleGradeSelect} onBack={handleBackToDashboard} />;
    }
    if (!selectedSubject) {
        return <SubjectSelector grade={selectedGrade} onSubjectSelect={handleSubjectSelect} onBack={handleBackToGrades} onRecommendation={handleRecommendation} />;
    }
    if (!selectedChapter) {
        return <SubjectSelector grade={selectedGrade} selectedSubject={selectedSubject} onSubjectSelect={handleSubjectSelect} onChapterSelect={handleChapterSelect} onBack={handleBackToSubjects} onRecommendation={handleRecommendation} />;
    }
     if (currentUser) {
        return <ChapterView 
            grade={selectedGrade} 
            subject={selectedSubject} 
            chapter={selectedChapter}
            student={currentUser}
            language={language}
            onBackToChapters={handleBackToChapters}
            onBackToSubjects={handleBackToSubjects}
            onChapterSelect={handleChapterSelect}
            onUpdatePoints={updateStudentPoints}
            onAddAchievement={handleAddAchievement}
        />;
    }
    return null;
  };
  
  const renderStudentFlow = () => {
    if (!currentUser) return null;

    if (studentView === 'dashboard') {
        const hasSeenTutorial = localStorage.getItem('alfanumrik-tutorial-seen') === 'true';
        if (!hasSeenTutorial) {
            setTimeout(() => setStudentView('tutorial'), 0);
            return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
        }
    }

    switch(studentView) {
        case 'tutorial':
            return <TutorialScreen onFinish={handleFinishTutorial} />;
        case 'dashboard':
            return <StudentDashboard 
                        student={currentUser}
                        // FIX: Removed unused 'users' prop
                        onStartMission={() => setStudentView('path')} 
                        onBrowse={handleStartBrowsing} 
                        onStartWellbeing={handleStartWellbeingModule} 
                        onStartTutorial={handleStartTutorial} 
                        onStartInnovationLab={handleStartInnovationLab} 
                        onStartCriticalThinking={handleStartCriticalThinking} 
                        onStartGlobalPrep={handleStartGlobalPrep} 
                        onStartLeadershipCircle={handleStartLeadershipCircle} 
                        onStartCareerGuidance={handleStartCareerGuidance} 
                        onStartDoubtSolver={handleStartDoubtSolver} 
                        onStartCompetitions={handleStartCompetitions} 
                        onStartProjectHub={handleStartProjectHub} 
                        onStartPeerPedia={handleStartPeerPedia}
                        onAddGoal={addStudyGoal}
                        onToggleGoal={toggleStudyGoal}
                        onRemoveGoal={removeStudyGoal}
                    />;
        case 'path':
            return <PersonalizedPathScreen student={currentUser} onBack={handleBackToDashboard} onMissionComplete={handleMissionComplete} />;
        case 'browse':
            return renderStudentBrowseFlow();
        case 'tutor':
            return <TutorSessionScreen student={currentUser} chat={tutorChat!} onBack={handleEndTutorSession} />;
        case 'ai_chatbot':
            return <AIChatbotScreen student={currentUser} onBack={handleBackToDashboard} />;
        case 'innovation_lab':
            return <InnovationLabScreen onBack={handleBackToDashboard} />;
        case 'critical_thinking':
            return <CriticalThinkingScreen onBack={handleBackToDashboard} />;
        case 'global_prep':
            return <GlobalPrepScreen onBack={handleBackToDashboard} />;
        case 'leadership_circle':
            return <LeadershipCircleScreen student={currentUser} onBack={handleBackToDashboard} />;
        case 'competitions':
            return <CompetitionScreen onBack={handleBackToDashboard} />;
        case 'project_hub':
            return <ProjectHubScreen student={currentUser} onBack={handleBackToDashboard} />;
        case 'peer_pedia':
            return <PeerPediaScreen student={currentUser} onBack={handleBackToDashboard} />;
        case 'career_guidance':
            return <CareerGuidanceScreen student={currentUser} onBack={handleBackToDashboard} />;
        case 'wellbeing': {
            if (!currentUser) return null;
            const wellbeingChapter: Chapter = { title: 'The Great Transformation: Navigating Your Journey from Teen to Adult', topics: [] };
            const wellbeingSubject: Subject = {
                name: 'Personal Growth & Well-being',
                icon: 'SparklesIcon',
                chapters: [wellbeingChapter]
            };
            const wellbeingGrade: Grade = {
                level: currentUser.grade,
                description: 'Special Module',
                subjects: [wellbeingSubject]
            };
            return <ChapterView 
                grade={wellbeingGrade} 
                subject={wellbeingSubject} 
                chapter={wellbeingChapter}
                student={currentUser}
                language={language}
                onBackToChapters={handleBackToDashboard}
                onBackToSubjects={handleBackToDashboard}
                onChapterSelect={() => {}}
                onUpdatePoints={updateStudentPoints}
                onAddAchievement={handleAddAchievement}
            />;
        }
        default:
            return <StudentDashboard 
                        student={currentUser}
                        // FIX: Removed unused 'users' prop
                        onStartMission={() => setStudentView('path')} 
                        onBrowse={handleStartBrowsing} 
                        onStartWellbeing={handleStartWellbeingModule} 
                        onStartTutorial={handleStartTutorial} 
                        onStartInnovationLab={handleStartInnovationLab} 
                        onStartCriticalThinking={handleStartCriticalThinking} 
                        onStartGlobalPrep={handleStartGlobalPrep} 
                        onStartLeadershipCircle={handleStartLeadershipCircle} 
                        onStartCareerGuidance={handleStartCareerGuidance} 
                        onStartDoubtSolver={handleStartDoubtSolver} 
                        onStartCompetitions={handleStartCompetitions} 
                        onStartProjectHub={handleStartProjectHub} 
                        onStartPeerPedia={handleStartPeerPedia}
                        onAddGoal={addStudyGoal}
                        onToggleGoal={toggleStudyGoal}
                        onRemoveGoal={removeStudyGoal}
                    />;
    }
  };

  const renderContent = () => {
    const isUserLoggedIn = !!currentUser || !!loggedInUser;

    // --- Global Views (accessible before and after login) ---
    switch(appView) {
      case 'privacy_policy':
        return <PrivacyPolicyScreen onBack={handleGoHome} />;
      case 'faq':
        return <FAQScreen onBack={handleGoHome} />;
      case 'about':
        return <AboutScreen onBack={handleGoHome} />;
      case 'terms':
        return <TermsScreen onBack={handleGoHome} />;
      case 'contact':
        return <ContactScreen onBack={handleGoHome} />;
      case 'student_flow':
      default:
        // Fall through to main logic
        break;
    }

    // --- Logged-Out Flow ---
    if (!isUserLoggedIn) {
        if(showAuthScreen) {
            return <AuthScreen onBack={() => setShowAuthScreen(false)} onNonStudentLogin={handleNonStudentLogin} />;
        }
        return <LandingPage 
            onNavigateToAuth={() => setShowAuthScreen(true)} 
            onNavigateToContact={handleNavigateToContact} 
            onNavigateToAbout={() => setAppView('about')} 
        />;
    }
    
    // --- Logged-In Flow ---
    if (isLoadingCurriculum || !translationsLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary text-lg">Loading curriculum...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center p-8 bg-status-danger rounded-lg max-w-2xl mx-auto">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-status-danger" />
                <h3 className="text-xl font-bold text-status-danger mt-4">Could Not Load App Content</h3>
                <p className="text-status-danger mt-2">{error}</p>
                <button 
                    onClick={loadCurriculum} 
                    className="mt-6 flex items-center justify-center mx-auto px-6 py-2 bg-status-danger text-white font-bold rounded-lg shadow-md hover:opacity-80 transition"
                    style={{ backgroundColor: 'rgb(var(--c-error))' }}
                >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Retry
                </button>
            </div>
        );
    }
    
    if (viewingStudent) {
        return <StudentPerformanceView 
                    userRole={loggedInRole as 'teacher' | 'parent'} 
                    student={viewingStudent} 
                    language={language} 
                    onBack={() => setViewingStudent(null)} 
                />;
    }

    if (loggedInRole === 'teacher' && loggedInUser) {
        const teacher = loggedInUser as Teacher;
        const myStudents = MOCK_STUDENTS.filter(s => teacher.studentIds.includes(s.id));
        return <TeacherDashboard students={myStudents} onSelectStudent={setViewingStudent} onBack={handleLogout} />;
    }
    
    if (loggedInRole === 'parent' && loggedInUser) {
        const parent = loggedInUser as Parent;
        const myChild = MOCK_STUDENTS.find(s => parent.childIds.includes(s.id));
        if (!myChild) return <p>Child data not found.</p>;
        return <ParentDashboard child={myChild} onSelectStudent={setViewingStudent} onBack={handleLogout} />;
    }

    // Default to student flow if a student is logged in
    if (currentUser) {
        return renderStudentFlow();
    }
    
    // Fallback if something is wrong with login state
    return <LandingPage onNavigateToAuth={() => setShowAuthScreen(true)} onNavigateToContact={handleNavigateToContact} onNavigateToAbout={() => setAppView('about')} />;
  };
  
  const isAnyUserLoggedIn = !!currentUser || !!loggedInUser;
  const userForHeader = currentUser || loggedInUser;
  const userRoleForHeader = currentUser ? 'student' : loggedInRole;

  return (
    <div className={`flex flex-col min-h-screen ${!isAnyUserLoggedIn ? 'landing-page' : ''}`}>
      {isAnyUserLoggedIn && userForHeader && (
        <Suspense fallback={<header className="h-[73px] bg-surface border-b border-border-color"></header>}>
            <Header 
              onGoHome={handleGoHome} 
              showHomeButton={true}
              curriculum={curriculum}
              onSearchSelect={handleSearchSelect}
              isLoggedIn={isAnyUserLoggedIn}
              user={userForHeader}
              userRole={userRoleForHeader}
              onUpdateProfile={updateUserProfile}
              profileUpdateLoading={profileUpdateLoading}
              profileUpdateError={profileUpdateError}
              onLogout={handleLogout}
            />
        </Suspense>
      )}
      <main className={`${isAnyUserLoggedIn ? 'container mx-auto p-4 md:p-8' : ''} flex-grow`}>
        <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}>
            {renderContent()}
        </Suspense>
      </main>
      {isAnyUserLoggedIn && (
        <Suspense fallback={null}>
            <Footer 
                onShowAbout={() => setAppView('about')}
                onShowPrivacyPolicy={() => setAppView('privacy_policy')}
                onShowTerms={() => setAppView('terms')}
                onShowFaq={() => setAppView('faq')}
            />
        </Suspense>
      )}
      {showAchievement && (
        <Suspense fallback={null}>
            <AchievementToast achievement={showAchievement} onClose={() => setShowAchievement(null)} />
        </Suspense>
      )}
       {awardedPoints && (
        <Suspense fallback={null}>
            <PointsToast points={awardedPoints} onClose={() => setAwardedPoints(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default App;