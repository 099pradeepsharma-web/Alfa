import React from 'react';
import { useLanguage } from '../contexts/Language-context';
// FIX: Import `SparklesIcon` to resolve reference error.
import { ArrowLeftIcon, LightBulbIcon, SparklesIcon } from '@heroicons/react/24/solid';
import Logo from '../components/Logo';

interface AboutScreenProps {
  onBack: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="dashboard-highlight-card p-8 md:p-12">
        <header className="text-center border-b border-border-color pb-8 mb-8">
            <Logo size={64} />
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-4">{t('aboutTitle')}</h1>
            <p className="text-lg text-text-secondary mt-2 max-w-2xl mx-auto">{t('aboutSubtitle')}</p>
        </header>
        
        <div className="space-y-10">
            <div>
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <LightBulbIcon className="h-7 w-7 text-primary" />
                    {t('aboutSection1Title')}
                </h2>
                <p className="mt-3 text-text-secondary text-lg leading-relaxed">{t('aboutSection1Content')}</p>
            </div>
             <div>
                <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <SparklesIcon className="h-7 w-7 text-primary" />
                    {t('aboutSection2Title')}
                </h2>
                <p className="mt-3 text-text-secondary text-lg leading-relaxed">{t('aboutSection2Content')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;