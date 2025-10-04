



import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Grade, Subject, Chapter, Student, LearningModule, Concept, NextStepRecommendation } from './types';
import { getCurriculum } from './services/curriculumService';
import { MOCK_STUDENTS } from './data/mockData';
import { createTutorChat } from './services/geminiService';
import { Chat } from '@google/genai';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useLanguage } from './contexts/Language-context';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// --- Lazy Loading Screens and Components for Performance Optimization ---
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const GradeSelector = lazy(() => import('./components/GradeSelector'));
const SubjectSelector = lazy(() => import('./components/SubjectSelector'));
const ChapterView = lazy(() => import('./components/ChapterView').then(module => ({ default: module.ChapterView })));
const RoleSelector = lazy(() => import('./screens/RoleSelector'));
const TeacherDashboard = lazy(() => import('./screens/TeacherDashboard'));
// FIX: Lazy load ParentDashboard as a named export to resolve the missing 'default' property error.
const ParentDashboard = lazy(() => import('./screens/ParentDashboard').then(module => ({ default: module.ParentDashboard })));
const StudentPerformanceView = lazy(() => import('./screens/StudentPerformanceView'));
const StudentDashboard = lazy(() => import('./screens/StudentDashboard'));
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const PersonalizedPathScreen = lazy(() => import('./screens/PersonalizedPathScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));
const FAQScreen = lazy(() => import('./screens/FAQScreen'));
// FIX: Lazy load TutorSessionScreen as a named export to resolve the missing 'default' property error.
const TutorSessionScreen = lazy(() => import('./screens/TutorSessionScreen').then(module => ({ default: module.TutorSessionScreen })));
const MicrolearningScreen = lazy(() => import('./screens/MicrolearningScreen'));
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


type UserRole = 'student' | 'teacher' | 'parent';
type StudentView = 'dashboard' | 'path' | 'browse' | 'wellbeing' | 'tutor' | 'microlearning' | 'tutorial' | 'competitions' | 'career_guidance' | 'innovation_lab' | 'critical_thinking' | 'global_prep' | 'leadership_circle' | 'ai_chatbot' | 'project_hub' | 'peer_pedia';
type AppState = 'role_selection' | 'student_flow' | 'teacher_flow' | 'parent_flow' | 'privacy_policy' | 'faq' | 'about' | 'terms';

const App: React.FC = () => {
  // Global State
  const [appState, setAppState] = useState<AppState>('role_selection');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null); // For teacher/parent view
  const { language, isLoaded: translationsLoaded } = useLanguage();
  const { isLoggedIn, currentUser, loading: authLoading } = useAuth();

  // Curriculum State
  const [curriculum, setCurriculum] = useState<Grade[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student-specific State
  const [studentView, setStudentView] = useState<StudentView>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [tutorChat, setTutorChat] = useState<Chat | null>(null);
  const [activeMicrolearningModule, setActiveMicrolearningModule] = useState<LearningModule | null>(null);
  const [postLoginDestination, setPostLoginDestination] = useState<{ grade: Grade, subject: Subject, chapter: Chapter } | null>(null);

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

  const handleRoleSelect = useCallback((role: UserRole) => {
    setAppState(`${role}_flow`);
    // Reset other states
    setStudentView('dashboard');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setActiveStudent(null);
  }, []);
  
  const handleGoHome = useCallback(() => {
    if (appState === 'student_flow') {
        setStudentView('dashboard');
    }
    setAppState('role_selection');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setActiveStudent(null);
  }, [appState]);

  const handleBackToGrades = useCallback(() => {
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
  }, []);
  
  const handleBackToDashboard = useCallback(() => {
    setStudentView('dashboard');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setActiveMicrolearningModule(null);
  }, []);

  const handleStudentSelect = useCallback((student: Student) => {
    setActiveStudent(student);
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

  const backToStudentList = useCallback(() => {
    setActiveStudent(null);
  }, []);

  const handleBackToSubjects = useCallback(() => {
    setSelectedSubject(null);
    setSelectedChapter(null);
  }, []);

  const handleBackToChapters = useCallback(() => {
    setSelectedChapter(null);
    setActiveMicrolearningModule(null);
  }, []);

  const handleStartBrowsing = useCallback(() => {
    if (currentUser) {
        const studentGrade = curriculum.find(g => g.level === currentUser.grade);
        if (studentGrade) {
            setSelectedGrade(studentGrade);
        }
        setStudentView('browse');
    }
  }, [currentUser, curriculum]);
  
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
  
  const handleStartMicrolearningSession = useCallback((module: LearningModule) => {
      setActiveMicrolearningModule(module);
      setStudentView('microlearning');
  }, []);
  
  const handleEndMicrolearningSession = useCallback(() => {
      setActiveMicrolearningModule(null);
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
    if (isLoggedIn && currentUser) {
        setSelectedGrade(grade);
        setSelectedSubject(subject);
        setSelectedChapter(chapter);
        setStudentView('browse');
        setActiveMicrolearningModule(null);
        if (appState !== 'student_flow') {
            setAppState('student_flow');
        }
    } else {
        // Not logged in, store destination and show login
        setPostLoginDestination({ grade, subject, chapter });
        setAppState('student_flow');
    }
  }, [isLoggedIn, currentUser, appState]);


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
            onStartTutorSession={handleStartTutorSession}
            onStartMicrolearningSession={handleStartMicrolearningSession}
        />;
    }
    return null; // Should not happen if currentUser is checked
  };
  
  const renderStudentFlow = () => {
    if (authLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }
    if (!isLoggedIn || !currentUser) {
        return <LoginScreen grades={curriculum} onBack={() => setAppState('role_selection')} />;
    }

    if (postLoginDestination) {
        setSelectedGrade(postLoginDestination.grade);
        setSelectedSubject(postLoginDestination.subject);
        setSelectedChapter(postLoginDestination.chapter);
        setStudentView('browse');
        setPostLoginDestination(null); // Clear destination
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }

    if (studentView === 'dashboard') {
        const hasSeenTutorial = localStorage.getItem('alfanumrik-tutorial-seen') === 'true';
        if (!hasSeenTutorial) {
            // Use an effect to change state after render to avoid warnings
            setTimeout(() => setStudentView('tutorial'), 0);
            return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>; // Show loader briefly
        }
    }

    switch(studentView) {
        case 'tutorial':
            return <TutorialScreen onFinish={handleFinishTutorial} />;
        case 'dashboard':
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} onStartWellbeing={handleStartWellbeingModule} onStartTutorial={handleStartTutorial} onStartInnovationLab={handleStartInnovationLab} onStartCriticalThinking={handleStartCriticalThinking} onStartGlobalPrep={handleStartGlobalPrep} onStartLeadershipCircle={handleStartLeadershipCircle} onStartCareerGuidance={handleStartCareerGuidance} onStartDoubtSolver={handleStartDoubtSolver} onStartCompetitions={handleStartCompetitions} onStartProjectHub={handleStartProjectHub} onStartPeerPedia={handleStartPeerPedia} />;
        case 'path':
            return <PersonalizedPathScreen onBack={handleBackToDashboard} />;
        case 'browse':
            return renderStudentBrowseFlow();
        case 'tutor':
            return <TutorSessionScreen student={currentUser} chat={tutorChat!} onBack={handleEndTutorSession} />;
        case 'ai_chatbot':
            return <AIChatbotScreen onBack={handleBackToDashboard} />;
        case 'microlearning':
            if (activeMicrolearningModule) {
                return <MicrolearningScreen learningModule={activeMicrolearningModule} onFinish={handleEndMicrolearningSession} />;
            }
            return renderStudentBrowseFlow();
        case 'innovation_lab':
            return <InnovationLabScreen onBack={handleBackToDashboard} />;
        case 'critical_thinking':
            return <CriticalThinkingScreen onBack={handleBackToDashboard} />;
        case 'global_prep':
            return <GlobalPrepScreen onBack={handleBackToDashboard} />;
        case 'leadership_circle':
            return <LeadershipCircleScreen onBack={handleBackToDashboard} />;
        case 'competitions':
            return <CompetitionScreen onBack={handleBackToDashboard} />;
        case 'project_hub':
            return <ProjectHubScreen onBack={handleBackToDashboard} />;
        case 'peer_pedia':
            return <PeerPediaScreen onBack={handleBackToDashboard} />;
        case 'career_guidance':
            return <CareerGuidanceScreen onBack={handleBackToDashboard} />;
        case 'wellbeing': {
            if (!currentUser) return null;
            const wellbeingChapter: Chapter = { title: 'The Great Transformation: Navigating Your Journey from Teen to Adult' };
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
                onStartTutorSession={() => {}} // Tutor not available for this module
                onStartMicrolearningSession={() => {}} // Microlearning not available
            />;
        }
        default:
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} onStartWellbeing={handleStartWellbeingModule} onStartTutorial={handleStartTutorial} onStartInnovationLab={handleStartInnovationLab} onStartCriticalThinking={handleStartCriticalThinking} onStartGlobalPrep={handleStartGlobalPrep} onStartLeadershipCircle={handleStartLeadershipCircle} onStartCareerGuidance={handleStartCareerGuidance} onStartDoubtSolver={handleStartDoubtSolver} onStartCompetitions={handleStartCompetitions} onStartProjectHub={handleStartProjectHub} onStartPeerPedia={handleStartPeerPedia} />;
    }
  };

  const renderContent = () => {
    // Enhanced loading state to wait for both curriculum and translations
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

    if (appState === 'privacy_policy') {
      return <PrivacyPolicyScreen onBack={() => setAppState('role_selection')} />;
    }

    if (appState === 'faq') {
        return <FAQScreen onBack={() => setAppState('role_selection')} />;
    }
    
    if (appState === 'about') {
        return <AboutScreen onBack={() => setAppState('role_selection')} />;
    }

    if (appState === 'terms') {
        return <TermsScreen onBack={() => setAppState('role_selection')} />;
    }

    switch(appState) {
      case 'role_selection':
        return <RoleSelector onSelectRole={handleRoleSelect} />;
      
      case 'student_flow':
        return renderStudentFlow();
      
      case 'teacher_flow':
        if (!activeStudent) {
          // If a student is logged in, show only them. Otherwise, show all mock students.
          const studentsToShow = isLoggedIn && currentUser ? [currentUser] : MOCK_STUDENTS;
          return <TeacherDashboard students={studentsToShow} onSelectStudent={handleStudentSelect} onBack={() => setAppState('role_selection')} />;
        }
        return <StudentPerformanceView userRole="teacher" student={activeStudent} language={language} onBack={backToStudentList} />;

      case 'parent_flow':
        // If a student is logged in, show them. Otherwise, default to the first mock student.
        const child = isLoggedIn && currentUser ? currentUser : MOCK_STUDENTS[0]; 
        if (!activeStudent) {
            return <ParentDashboard child={child} onSelectStudent={handleStudentSelect} onBack={() => setAppState('role_selection')} />;
        }
        return <StudentPerformanceView userRole="parent" student={activeStudent} language={language} onBack={backToStudentList} />;

      default:
        return <RoleSelector onSelectRole={handleRoleSelect} />;
    }
  };
  
  return (
    <>
      <Suspense fallback={<header className="h-[73px] bg-surface border-b border-border-color"></header>}>
          <Header 
            onGoHome={handleGoHome} 
            showHomeButton={appState !== 'role_selection'} 
            curriculum={curriculum}
            onSearchSelect={handleSearchSelect}
          />
      </Suspense>
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}>
            {renderContent()}
        </Suspense>
      </main>
      <Suspense fallback={null}>
          <Footer 
              onShowAbout={() => setAppState('about')}
              onShowPrivacyPolicy={() => setAppState('privacy_policy')}
              onShowTerms={() => setAppState('terms')}
              onShowFaq={() => setAppState('faq')}
          />
      </Suspense>
    </>
  );
};

export default App;