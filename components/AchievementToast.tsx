import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { getIcon } from './IconMap';
import Confetti from './Confetti';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const Icon = getIcon(achievement.icon);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for animation to finish before calling onClose
            setTimeout(onClose, 500);
        }, 5000); // Disappear after 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!isVisible) return null;

    return (
        <div className="achievement-toast">
            <Confetti />
            <div className="relative max-w-sm w-full bg-white dark:bg-slate-800 shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg">
                                <Icon className="h-8 w-8 text-white" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('achievementUnlocked')}</p>
                            <p className="mt-1 text-lg font-bold text-primary dark:text-primary-light" style={{color: 'rgb(var(--c-primary))'}}>{t(achievement.name)}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(achievement.description)}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                onClick={onClose}
                                className="inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementToast;
