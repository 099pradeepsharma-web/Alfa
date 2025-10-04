import React from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, GlobeAltIcon } from '@heroicons/react/24/solid';

interface GlobalPrepScreenProps {
  onBack: () => void;
}

const GlobalPrepScreen: React.FC<GlobalPrepScreenProps> = ({ onBack }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <GlobeAltIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">Global Prep Zone</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">
                        Prepare for international entrance and proficiency exams. Access simulators for tests like SAT, ACT, TOEFL, and IELTS, and see how your skills map to global standards.
                    </p>
                    <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="font-bold text-slate-700 dark:text-slate-200">Feature Coming Soon!</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Your gateway to global opportunities is under construction.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPrepScreen;
