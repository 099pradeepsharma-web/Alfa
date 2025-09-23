import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, Chapter, Student, LearningModule } from './types';
import { getCurriculum } from './services/curriculumService';
import { MOCK_STUDENTS } from './data/mockData';
import { createTutorChat } from './services/geminiService';
import { Chat } from '@google/genai';

import Header from './components/Header';
import GradeSelector from './components/GradeSelector';
import SubjectSelector from './components/SubjectSelector';
import ChapterView from './components/ChapterView';
import RoleSelector from './screens/RoleSelector';
import TeacherDashboard from './screens/TeacherDashboard';
import ParentDashboard from './screens/ParentDashboard';
import StudentPerformanceView from './screens/StudentPerformanceView';
import StudentDashboard from './screens/StudentDashboard';
import LoginScreen from './screens/LoginScreen';
import PersonalizedPathScreen from './screens/PersonalizedPathScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import FAQScreen from './screens/FAQScreen';
import TutorSessionScreen from './screens/TutorSessionScreen';
import MicrolearningScreen from './screens/MicrolearningScreen';
import ProjectHubScreen from './screens/ProjectHubScreen';
import PeerPediaScreen from './screens/PeerPediaScreen';
import CompetitionScreen from './screens/CompetitionScreen';
import CareerGuidanceScreen from './screens/CareerGuidanceScreen';
import { useLanguage } from './contexts/Language-context';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import TutorialScreen from './screens/TutorialScreen';

type UserRole = 'student' | 'teacher' | 'parent';
type StudentView = 'dashboard' | 'path' | 'browse' | 'wellbeing' | 'tutor' | 'microlearning' | 'tutorial' | 'pbl_hub' | 'peer_pedia' | 'competitions' | 'career_guidance';
type AppState = 'role_selection' | 'student_flow' | 'teacher_flow' | 'parent_flow' | 'privacy_policy' | 'faq';

const App: React.FC = () => {
  // Global State
  const [appState, setAppState] = useState<AppState>('role_selection');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null); // For teacher/parent view
  const { language } = useLanguage();
  const { isLoggedIn, currentUser, loading: authLoading } = useAuth();

  // Curriculum State
  const [curriculum, setCurriculum] = useState<Grade[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);

  // Student-specific State
  const [studentView, setStudentView] = useState<StudentView>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [tutorChat, setTutorChat] = useState<Chat | null>(null);
  const [activeMicrolearningModule, setActiveMicrolearningModule] = useState<LearningModule | null>(null);


  useEffect(() => {
    const loadCurriculum = async () => {
        try {
            const data = await getCurriculum();
            setCurriculum(data);
        } catch (error) {
            console.error("Failed to load curriculum:", error);
            // In a real app, you might want to set an error state and show a message
        } finally {
            setIsLoadingCurriculum(false);
        }
    };
    loadCurriculum();
  }, []);

  useEffect(() => {
    // Apply age-adaptive theme
    const root = document.documentElement;
    if (appState === 'student_flow' && selectedGrade) {
        const gradeLevel = parseInt(selectedGrade.level.split(' ')[1]);
        if (gradeLevel <= 5) {
            root.classList.add('theme-young');
        } else {
            root.classList.remove('theme-young');
        }
    } else {
        root.classList.remove('theme-young');
    }
  }, [selectedGrade, appState]);

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

  const handleStartWellbeingModule = useCallback(() => {
    setStudentView('wellbeing');
  }, []);
  
  const handleStartTutorSession = useCallback(() => {
    if (!selectedGrade || !selectedSubject || !selectedChapter) return;
    const chatSession = createTutorChat(selectedGrade.level, selectedSubject.name, selectedChapter.title, language);
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

  const handleStartPBL = useCallback(() => {
    setStudentView('pbl_hub');
  }, []);

  const handleStartPeerPedia = useCallback(() => {
      setStudentView('peer_pedia');
  }, []);

  const handleStartCompetitions = useCallback(() => {
    setStudentView('competitions');
  }, []);

  const handleStartCareerGuidance = useCallback(() => {
    setStudentView('career_guidance');
  }, []);


  const renderStudentBrowseFlow = () => {
    if (!selectedGrade) {
      return <GradeSelector grades={curriculum} onSelect={handleGradeSelect} onBack={handleBackToDashboard} />;
    }
    if (!selectedSubject) {
        return <SubjectSelector grade={selectedGrade} onSubjectSelect={handleSubjectSelect} onChapterSelect={handleChapterSelect} onBack={handleBackToDashboard} />;
    }
    if (!selectedChapter) {
        return <SubjectSelector grade={selectedGrade} selectedSubject={selectedSubject} onSubjectSelect={handleSubjectSelect} onChapterSelect={handleChapterSelect} onBack={handleBackToSubjects} />;
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
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} onStartWellbeing={handleStartWellbeingModule} onStartTutorial={handleStartTutorial} onStartPBL={handleStartPBL} onStartPeerPedia={handleStartPeerPedia} onStartCompetitions={handleStartCompetitions} onStartCareerGuidance={handleStartCareerGuidance} />;
        case 'path':
            return <PersonalizedPathScreen onBack={handleBackToDashboard} />;
        case 'browse':
            return renderStudentBrowseFlow();
        case 'tutor':
            return <TutorSessionScreen student={currentUser} chat={tutorChat!} onBack={handleEndTutorSession} />;
        case 'microlearning':
            if (activeMicrolearningModule) {
                return <MicrolearningScreen learningModule={activeMicrolearningModule} onFinish={handleEndMicrolearningSession} />;
            }
            // Fallback if module isn't set, though this shouldn't happen
            return renderStudentBrowseFlow();
        case 'pbl_hub':
            return <ProjectHubScreen onBack={handleBackToDashboard} />;
        case 'peer_pedia':
            return <PeerPediaScreen onBack={handleBackToDashboard} />;
        case 'competitions':
            return <CompetitionScreen onBack={handleBackToDashboard} />;
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
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} onStartWellbeing={handleStartWellbeingModule} onStartTutorial={handleStartTutorial} onStartPBL={handleStartPBL} onStartPeerPedia={handleStartPeerPedia} onStartCompetitions={handleStartCompetitions} onStartCareerGuidance={handleStartCareerGuidance} />;
    }
  };

  const renderContent = () => {
    if (isLoadingCurriculum) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">Loading curriculum...</p>
            </div>
        );
    }
    
    if (appState === 'privacy_policy') {
      return <PrivacyPolicyScreen onBack={() => setAppState('role_selection')} />;
    }

    if (appState === 'faq') {
        return <FAQScreen onBack={() => setAppState('role_selection')} />;
    }

    switch(appState) {
      case 'role_selection':
        return <RoleSelector onSelectRole={handleRoleSelect} onShowPrivacyPolicy={() => setAppState('privacy_policy')} onShowFaq={() => setAppState('faq')} />;
      
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
        return <RoleSelector onSelectRole={handleRoleSelect} onShowPrivacyPolicy={() => setAppState('privacy_policy')} onShowFaq={() => setAppState('faq')} />;
    }
  };
  
  return (
    <>
      <Header 
        onGoHome={handleGoHome} 
        showHomeButton={appState !== 'role_selection'} 
      />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </>
  );
};

export default App;