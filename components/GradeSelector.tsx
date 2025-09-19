import React from 'react';
import { Grade } from '../types';
import { AcademicCapIcon, BeakerIcon, BookOpenIcon, CalculatorIcon, ComputerDesktopIcon, GlobeAltIcon, PaintBrushIcon, PencilIcon, RocketLaunchIcon, ScaleIcon, SparklesIcon, TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';

interface GradeSelectorProps {
  grades: Grade[];
  onSelect: (grade: Grade) => void;
  onBack: () => void;
}

const gradeIcons: { [key: string]: React.ElementType } = {
    "1": PencilIcon,
    "2": PaintBrushIcon,
    "3": SparklesIcon,
    "4": BookOpenIcon,
    "5": GlobeAltIcon,
    "6": ScaleIcon,
    "7": BeakerIcon,
    "8": CalculatorIcon,
    "9": ComputerDesktopIcon,
    "10": AcademicCapIcon,
    "11": TrophyIcon,
    "12": RocketLaunchIcon,
}

const GradeCard: React.FC<{ grade: Grade; onSelect: () => void; }> = React.memo(({ grade, onSelect }) => {
    const { tCurriculum } = useLanguage();
    const gradeNumber = grade.level.match(/\d+/)?.[0] || '1';
    const Icon = gradeIcons[gradeNumber] || PencilIcon;
    
    return (
        <button
            onClick={onSelect}
            className="group dashboard-highlight-card p-6 rounded-2xl text-left flex flex-col justify-between items-start"
            style={{ minHeight: '150px' }}
        >
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-dark transition-colors" style={{color: 'rgb(var(--c-primary-dark))'}}>{tCurriculum(grade.level)}</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{tCurriculum(grade.description)}</p>
            </div>
            <div className="relative z-10 w-full flex justify-end mt-2">
                <Icon aria-hidden="true" className="h-10 w-10 text-slate-300 dark:text-slate-500 group-hover:text-primary transition-colors duration-300 group-hover:scale-110" style={{color: 'rgb(var(--c-primary))'}} />
            </div>
        </button>
    )
});

const GradeSelector: React.FC<GradeSelectorProps> = ({ grades, onSelect, onBack }) => {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition" style={{color: 'rgb(var(--c-primary))', textDecorationColor: 'rgb(var(--c-primary-dark))'}}>
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToDashboard')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-slate-700 dark:text-slate-200">{t('welcomeLearner')}</h2>
        <p className="text-lg text-center text-slate-500 dark:text-slate-400 mb-10">{t('selectGradePrompt')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {grades.map((grade) => (
            <GradeCard
              key={grade.level}
              grade={grade}
              onSelect={() => onSelect(grade)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(GradeSelector);