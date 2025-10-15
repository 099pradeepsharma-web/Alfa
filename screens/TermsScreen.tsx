import React from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/solid';

interface TermsScreenProps {
  onBack: () => void;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();

  const sections = [
    { title: t('termsSection1Title'), content: t('termsSection1Content') },
    { title: t('termsSection2Title'), content: t('termsSection2Content') },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="dashboard-highlight-card p-8 md:p-12">
        <header className="text-center border-b border-border-color pb-6 mb-6">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-text-secondary"/>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-3">{t('termsTitle')}</h1>
        </header>
        
        <div className="prose prose-lg max-w-none prose-invert">
            <p className="lead text-xl">{t('termsIntro')}</p>
            {sections.map(section => (
                <div key={section.title} className="mt-8">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p>{section.content}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;