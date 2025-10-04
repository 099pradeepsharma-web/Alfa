import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, AcademicCapIcon, CheckBadgeIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'teacher' | 'parent') => void;
}

// --- Custom Illustrations for each role ---
const StudentIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(10, 5)">
            <rect x="20" y="40" width="100" height="70" rx="8" fill="rgba(var(--c-primary), 0.2)"/>
            <rect x="25" y="45" width="90" height="50" rx="3" fill="rgba(var(--c-primary), 0.3)" />
            <path d="M20 110 H 120 L 130 118 H 10 L 20 110 Z" fill="rgba(var(--c-primary), 0.25)"/>
            <circle cx="80" cy="50" r="25" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-primary))" strokeWidth="2" />
            <path d="M70 50 A 10 10 0 0 1 90 50" stroke="rgb(var(--c-primary))" strokeWidth="2" fill="none" />
            <circle cx="72" cy="45" r="2" fill="rgb(var(--c-primary))" />
            <circle cx="88" cy="45" r="2" fill="rgb(var(--c-primary))" />
            <path d="M60 90 Q 80 70 100 90" stroke="rgb(var(--c-primary))" strokeWidth="3" fill="none" strokeLinecap="round" />
            <g className="animate-pulse">
                 <path d="M120 10 L 130 20 L 120 30 L 110 20 Z" fill="rgb(var(--c-accent))" />
                 <path d="M120,10 C130,0 140,10 130,20 S110,30 120,30" fill="rgb(var(--c-accent))" opacity="0.6"/>
            </g>
        </g>
    </svg>
);


const TeacherIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(5, 5)">
            <rect x="10" y="10" width="130" height="90" rx="8" fill="rgba(var(--c-primary), 0.2)" />
            <rect x="15" y="15" width="120" height="80" rx="3" fill="rgb(var(--c-bg-primary))" />
            <path d="M30 70 L 50 50 L 70 65 L 90 45 L 110 60" stroke="rgb(var(--c-primary))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="110" cy="60" r="4" fill="rgb(var(--c-accent))" />
            <rect x="30" y="80" width="15" height="10" fill="rgba(var(--c-primary), 0.4)" />
            <rect x="55" y="75" width="15" height="15" fill="rgba(var(--c-primary), 0.6)" />
            <rect x="80" y="70" width="15" height="20" fill="rgba(var(--c-primary), 0.8)" />
            <path d="M130 50 L 145 60 L 130 70" fill="rgb(var(--c-accent))" />
        </g>
    </svg>
);


const ParentIllustration = () => (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g transform="translate(15, 10)">
            <path d="M10,20 A 40 40 0 0 1 50 0 L 80 0 A 40 40 0 0 1 120 20" fill="rgb(var(--c-text-secondary))" opacity="0.8"/>
            <rect x="10" y="20" width="110" height="80" rx="10" ry="10" fill="rgba(var(--c-text-secondary), 0.1)"/>
            <rect x="15" y="25" width="100" height="70" rx="5" ry="5" fill="rgba(var(--c-text-secondary), 0.05)"/>
            <path d="M30 80 C 50 40, 80 40, 100 80" stroke="rgb(var(--c-accent))" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <g>
                <circle cx="65" cy="45" r="5" fill="rgb(var(--c-primary))"/>
                <animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="1s" repeatCount="indefinite" />
            </g>
            <path d="M20,100 L 110,100" stroke="rgba(var(--c-text-secondary), 0.3)" strokeWidth="4" strokeLinecap="round"/>
        </g>
    </svg>
);


const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  const { t } = useLanguage();
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const targetCount = 12543;
    let start = 0;
    const duration = 2000; // 2 seconds
    // Calculate increment for a smooth animation (~60fps)
    const increment = targetCount / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= targetCount) {
            setStudentCount(targetCount);
            clearInterval(timer);
        } else {
            setStudentCount(Math.ceil(start));
        }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  const roles = [
    { 
      role: 'student' as const, 
      title: t('roleStudent'), 
      description: t('roleStudentDescModern'), 
      illustration: <StudentIllustration />, 
    },
    { 
      role: 'teacher' as const, 
      title: t('roleTeacher'), 
      description: t('roleTeacherDescModern'), 
      illustration: <TeacherIllustration />, 
    },
    { 
      role: 'parent' as const, 
      title: t('roleParent'), 
      description: t('roleParentDescModern'), 
      illustration: <ParentIllustration />, 
    },
  ];

  return (
    <div className="animate-fade-in flex flex-col min-h-[calc(100vh-150px)]">
      <div className="flex-grow">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-text-primary">{t('welcomeToPlatformModern')}</h2>
        <p className="text-lg text-center text-text-secondary mb-8">{t('selectRolePromptModern')}</p>
        
        <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary">
                {studentCount.toLocaleString('en-IN')}+
            </h3>
            <p className="text-text-secondary font-semibold">{t('joinStudents')}</p>
        </div>

        <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-2xl font-bold text-text-primary">{t('alignedWithGoals')}</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="dashboard-highlight-card p-4 flex items-center gap-3">
                    <CheckBadgeIcon className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-text-primary">{t('cbseSyllabus')}</p>
                        <p className="text-sm text-text-secondary">2024-25 Syllabus</p>
                    </div>
                </div>
                 <div className="dashboard-highlight-card p-4 flex items-center gap-3">
                    <AcademicCapIcon className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-text-primary">{t('nep2020')}</p>
                         <p className="text-sm text-text-secondary">Skill-based Learning</p>
                    </div>
                </div>
                 <div className="dashboard-highlight-card p-4 flex items-center gap-3">
                    <TrophyIcon className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-text-primary">{t('examPrep')}</p>
                        <p className="text-sm text-text-secondary">{t('boardsAndCompetitive')}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="dashboard-highlight-card p-6">
                <div className="flex items-center gap-4 mb-4">
                    <img src="https://i.pravatar.cc/150?u=indian-boy-12" alt={t('testimonialStudent1')} className="w-12 h-12 rounded-full" />
                    <div>
                        <cite className="font-bold text-text-primary not-italic">{t('testimonialStudent1')}</cite>
                        <span className="block text-sm text-text-secondary">{t('testimonialGrade1')}</span>
                    </div>
                </div>
                <blockquote className="text-text-secondary border-l-3 pl-4 border-primary">
                    {t('testimonialQuote1')}
                </blockquote>
            </div>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <div
              key={role.role}
              className={`group dashboard-highlight-card transition-all duration-300 ease-in-out hover:-translate-y-2`}
            >
              <button
                onClick={() => onSelectRole(role.role)}
                className="w-full h-full text-center p-6 flex flex-col items-center"
              >
                  <div className="h-32 w-full mb-4 transform transition-transform duration-300 group-hover:scale-105">
                      {role.illustration}
                  </div>
                  <h3 className={`text-2xl font-bold text-text-primary`}>{role.title}</h3>
                  <p className="text-text-secondary mt-2 text-sm leading-relaxed flex-grow">{role.description}</p>
                  <div className={`mt-6 font-semibold flex items-center transition-colors duration-300 text-primary`}>
                      {t('selectRoleButton')}
                      <ArrowRightIcon className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;