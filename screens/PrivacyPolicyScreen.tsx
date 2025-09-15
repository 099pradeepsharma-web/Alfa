import React from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();

  const sections = [
    { title: t('whatInfoWeCollectTitle'), content: t('whatInfoWeCollectContent') },
    { title: t('howWeUseInfoTitle'), content: t('howWeUseInfoContent') },
    { title: t('infoSafetyTitle'), content: t('infoSafetyContent') },
    { title: t('yourChoicesTitle'), content: t('yourChoicesContent') },
    { title: t('changesToPolicyTitle'), content: t('changesToPolicyContent') },
    { title: t('contactUsTitle'), content: t('contactUsContent') },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <header className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
            <ShieldCheckIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mt-3">{t('privacyPolicyTitle')}</h1>
        </header>
        
        <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
            <p className="lead text-xl">{t('privacyIntro')}</p>
            {sections.map(section => (
                <div key={section.title} className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{section.title}</h2>
                    <p>{section.content}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;