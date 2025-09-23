import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { getIcon } from './IconMap';
import Confetti from './Confetti';
import { ShareIcon } from '@heroicons/react/24/solid';

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
    
    const handleShare = () => {
        const achievementName = t(achievement.name);
        const shareHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Achievement Unlocked!</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-100 flex items-center justify-center h-screen font-sans">
                <div class="w-full max-w-sm aspect-[16/9] bg-white rounded-2xl shadow-2xl p-6 flex flex-col justify-between border-2 border-amber-400">
                    <div>
                        <p class="text-sm font-bold text-slate-500">Achievement Unlocked!</p>
                        <h1 class="text-2xl font-bold text-amber-500">${achievementName}</h1>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-slate-800">Alfanumrik</p>
                        <p class="text-xs text-slate-400">Unlock Your Brilliance</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(shareHtml);
            newWindow.document.close();
        }
    };


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
                            <button onClick={handleShare} className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                                <ShareIcon className="h-3 w-3" />
                                Share
                            </button>
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