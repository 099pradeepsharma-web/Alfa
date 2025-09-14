import React, { useState } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CircleStackIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import QuestionBankScreen from './QuestionBankScreen';
import CurriculumGeneratorScreen from './CurriculumGeneratorScreen';

interface TeacherDashboardProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ students, onSelectStudent, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const [view, setView] = useState<'students' | 'questionBank' | 'curriculumGenerator'>('students');

  if (view === 'questionBank') {
    return <QuestionBankScreen onBack={() => setView('students')} />;
  }
  
  if (view === 'curriculumGenerator') {
    return <CurriculumGeneratorScreen onBack={() => setView('students')} />;
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition mb-6">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToRoleSelection')}
      </button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
        <div className="border-b dark:border-slate-600 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('teacherDashboard')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mt-1">{t('teacherDashboardPrompt')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setView('questionBank')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
              style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
            >
              <CircleStackIcon className="h-5 w-5 mr-2" />
              {t('accessQuestionBank')}
            </button>
            <button 
              onClick={() => setView('curriculumGenerator')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
              style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {t('curriculumGenerator')}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-600 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center">
                <img src={student.avatarUrl} alt={student.name} className="h-12 w-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{student.name}</p>
                  <p className="text-slate-500 dark:text-slate-400">{tCurriculum(student.grade)}</p>
                </div>
              </div>
              <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;