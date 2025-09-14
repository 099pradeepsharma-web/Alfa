import React from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface ParentDashboardProps {
  child: Student;
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ child, onSelectStudent, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToRoleSelection')}
        </button>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-600 pb-4 mb-6">{t('parentDashboard')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{t('parentDashboardPrompt')}</p>
            <div className="space-y-4">
                <button
                onClick={() => onSelectStudent(child)}
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-600 hover:shadow-sm transition-all duration-200"
                >
                <div className="flex items-center">
                    <img src={child.avatarUrl} alt={child.name} className="h-12 w-12 rounded-full mr-4" />
                    <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{child.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{tCurriculum(child.grade)}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ParentDashboard;