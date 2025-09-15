import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, Chapter, Student } from './types';
import { getCurriculum } from './services/curriculumService';
import { MOCK_STUDENTS } from './data/mockData';

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
import { useLanguage } from './contexts/Language-context';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

type UserRole = 'student' | 'teacher' | 'parent';
type StudentView = 'dashboard' | 'path' | 'browse';

const App: React.FC = () => {
  // Global State
  const [appState, setAppState] = useState<'role_selection' | 'student_flow' | 'teacher_flow' | 'parent_flow' | 'privacy_policy'>('role_selection');
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
            onBack={handleBackToChapters}
            onChapterSelect={handleChapterSelect}
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
    switch(studentView) {
        case 'dashboard':
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} />;
        case 'path':
            return <PersonalizedPathScreen onBack={handleBackToDashboard} />;
        case 'browse':
            return renderStudentBrowseFlow();
        default:
            return <StudentDashboard onStartMission={() => setStudentView('path')} onBrowse={handleStartBrowsing} />;
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

    switch(appState) {
      case 'role_selection':
        return <RoleSelector onSelectRole={handleRoleSelect} onShowPrivacyPolicy={() => setAppState('privacy_policy')} />;
      
      case 'student_flow':
        return renderStudentFlow();
      
      case 'teacher_flow':
        if (!activeStudent) {
          return <TeacherDashboard students={MOCK_STUDENTS} onSelectStudent={handleStudentSelect} onBack={() => setAppState('role_selection')} />;
        }
        return <StudentPerformanceView userRole="teacher" student={activeStudent} language={language} onBack={backToStudentList} />;

      case 'parent_flow':
        const child = MOCK_STUDENTS[0]; 
        if (!activeStudent) {
            return <ParentDashboard child={child} onSelectStudent={handleStudentSelect} onBack={() => setAppState('role_selection')} />;
        }
        return <StudentPerformanceView userRole="parent" student={activeStudent} language={language} onBack={backToStudentList} />;

      default:
        return <RoleSelector onSelectRole={handleRoleSelect} onShowPrivacyPolicy={() => setAppState('privacy_policy')} />;
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