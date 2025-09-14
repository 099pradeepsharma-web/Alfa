import React from 'react';
import { UserIcon, AcademicCapIcon, HomeIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'teacher' | 'parent') => void;
  onShowPrivacyPolicy: () => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, onShowPrivacyPolicy }) => {
  const { t } = useLanguage();

  const roles = [
    { name: t('roleStudent'), description: t('roleStudentDesc'), icon: UserIcon, role: 'student' as const, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/50' },
    { name: t('roleTeacher'), description: t('roleTeacherDesc'), icon: AcademicCapIcon, role: 'teacher' as const, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: t('roleParent'), description: t('roleParentDesc'), icon: HomeIcon, role: 'parent' as const, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/50' },
  ];

  return (
    <div className="animate-fade-in flex flex-col min-h-[calc(100vh-150px)]">
      <div className="flex-grow">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-slate-700 dark:text-slate-200">{t('welcomeToPlatform')}</h2>
        <p className="text-lg text-center text-slate-500 dark:text-slate-400 mb-12">{t('selectRolePrompt')}</p>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => onSelectRole(role.role)}
              className="group bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 ease-in-out text-center flex flex-col items-center border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50"
              style={{borderColor: 'rgb(var(--c-border))'}}
            >
              <div className={`${role.bgColor} p-4 rounded-full mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  <role.icon aria-hidden="true" className={`h-12 w-12 ${role.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{role.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">{role.description}</p>
            </button>
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