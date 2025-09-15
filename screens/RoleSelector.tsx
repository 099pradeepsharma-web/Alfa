import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'teacher' | 'parent') => void;
  onShowPrivacyPolicy: () => void;
}

// --- Custom Illustrations for each role ---

const StudentIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(10, 5)">
            <rect x="20" y="40" width="100" height="70" rx="8" fill="#F0F9FF" className="dark:fill-slate-700" />
            <rect x="25" y="45" width="90" height="50" rx="3" fill="#E0F2FE" className="dark:fill-slate-600" />
            <path d="M20 110 H 120 L 130 118 H 10 L 20 110 Z" fill="#E0F2FE" className="dark:fill-slate-700" />
            <circle cx="80" cy="50" r="25" fill="#3B82F6" />
            <path d="M70 50 A 10 10 0 0 1 90 50" stroke="white" strokeWidth="3" fill="none" />
            <circle cx="72" cy="45" r="3" fill="white" />
            <circle cx="88" cy="45" r="3" fill="white" />
            <path d="M60 90 Q 80 70 100 90" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round" />
            <g className="animate-pulse">
                <path d="M120 10 L 130 20 L 120 30 L 110 20 Z" fill="#FBBF24" />
                <path d="M120,10 C130,0 140,10 130,20 S110,30 120,30" fill="#FBBF24" opacity="0.6"/>
            </g>
        </g>
    </svg>
);

const TeacherIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(5, 5)">
            <rect x="10" y="10" width="130" height="90" rx="8" fill="#F0F9FF" className="dark:fill-slate-700" />
            <rect x="15" y="15" width="120" height="80" rx="3" fill="#1E293B" className="dark:fill-slate-900" />
            <path d="M30 70 L 50 50 L 70 65 L 90 45 L 110 60" stroke="#34D399" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="110" cy="60" r="4" fill="#34D399" />
            <rect x="30" y="80" width="15" height="10" fill="#4F46E5" />
            <rect x="55" y="75" width="15" height="15" fill="#6366F1" />
            <rect x="80" y="70" width="15" height="20" fill="#818CF8" />
            <path d="M130 50 L 145 60 L 130 70" fill="#A78BFA" />
        </g>
    </svg>
);

const ParentIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(15, 10)">
            <rect x="10" y="20" width="110" height="80" rx="10" ry="10" fill="#F0FDF4" className="dark:fill-slate-700"/>
            <rect x="15" y="25" width="100" height="70" rx="5" ry="5" fill="#EBFBEE" className="dark:fill-slate-600"/>
            <path d="M30 80 C 50 40, 80 40, 100 80" stroke="#10B981" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <g>
                <circle cx="65" cy="45" r="5" fill="#10B981"/>
                <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="1s" repeatCount="indefinite" />
            </g>
            <path d="M10,20 A 40 40 0 0 1 50 0 L 80 0 A 40 40 0 0 1 120 20" fill="#34D399" opacity="0.8"/>
            <path d="M20,100 L 110,100" stroke="#A7F3D0" strokeWidth="4" strokeLinecap="round"/>
        </g>
    </svg>
);


const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, onShowPrivacyPolicy }) => {
  const { t } = useLanguage();

  const roles = [
    { 
      role: 'student' as const, 
      title: t('roleStudent'), 
      description: t('roleStudentDescModern'), 
      illustration: <StudentIllustration />, 
      accent: 'sky' 
    },
    { 
      role: 'teacher' as const, 
      title: t('roleTeacher'), 
      description: t('roleTeacherDescModern'), 
      illustration: <TeacherIllustration />, 
      accent: 'indigo'
    },
    { 
      role: 'parent' as const, 
      title: t('roleParent'), 
      description: t('roleParentDescModern'), 
      illustration: <ParentIllustration />, 
      accent: 'emerald'
    },
  ];

  const accentColors: { [key: string]: { border: string, text: string, bg: string } } = {
    sky: { border: 'group-hover:border-sky-400 dark:group-hover:border-sky-500', text: 'text-sky-600 dark:text-sky-400', bg: 'group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20' },
    indigo: { border: 'group-hover:border-indigo-400 dark:group-hover:border-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bg: 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20' },
    emerald: { border: 'group-hover:border-emerald-400 dark:group-hover:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20' },
  }

  return (
    <div className="animate-fade-in flex flex-col min-h-[calc(100vh-150px)]">
      <div className="flex-grow">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">{t('welcomeToPlatformModern')}</h2>
        <p className="text-lg text-center text-slate-500 dark:text-slate-400 mb-12">{t('selectRolePromptModern')}</p>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <div
              key={role.role}
              className={`group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 ease-in-out border-2 border-transparent ${accentColors[role.accent].border} ${accentColors[role.accent].bg}`}
            >
              <button
                onClick={() => onSelectRole(role.role)}
                className="w-full h-full text-center p-6 flex flex-col items-center"
              >
                  <div className="h-32 w-full mb-4 transform transition-transform duration-300 group-hover:scale-105">
                      {role.illustration}
                  </div>
                  <h3 className={`text-2xl font-bold text-slate-800 dark:text-slate-100`}>{role.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed flex-grow">{role.description}</p>
                  <div className={`mt-6 font-semibold flex items-center transition-colors duration-300 ${accentColors[role.accent].text}`}>
                      {t('selectRoleButton')}
                      <ArrowRightIcon className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
              </button>
            </div>
          ))}
        </div>
      </div>
      <footer className="text-center mt-12 py-4">
        <button
          onClick={onShowPrivacyPolicy}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors"
          style={{textDecorationColor: 'rgb(var(--c-primary))'}}
        >
          {t('viewPrivacyPolicy')}
        </button>
      </footer>
    </div>
  );
};

export default RoleSelector;