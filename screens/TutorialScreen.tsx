import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftRightIcon, BeakerIcon, TrophyIcon, RocketLaunchIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import FittoAvatar from '../components/FittoAvatar';

interface TutorialScreenProps {
  onFinish: () => void;
}

const TutorialStep: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => {
    return (
        <div className="flex flex-col items-center text-center p-6 animate-fade-in">
            <div className="mb-6">{icon}</div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400 max-w-md">{description}</p>
        </div>
    );
};

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onFinish }) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: <RocketLaunchIcon className="h-20 w-20 text-primary" style={{color: 'rgb(var(--c-primary))'}} />,
            title: t('tutorialTitle1'),
            description: t('tutorialDesc1'),
        },
        {
            icon: <FittoAvatar state="speaking" size={80} />,
            title: t('tutorialTitle2'),
            description: t('tutorialDesc2'),
        },
        {
            icon: (
                <div className="flex space-x-4">
                    <BeakerIcon className="h-20 w-20 text-green-500" />
                    <ChatBubbleLeftRightIcon className="h-20 w-20 text-purple-500" />
                </div>
            ),
            title: t('tutorialTitle3'),
            description: t('tutorialDesc3'),
        },
        {
            icon: <TrophyIcon className="h-20 w-20 text-amber-500" />,
            title: t('tutorialTitle4'),
            description: t('tutorialDesc4'),
        },
        {
            icon: <UserCircleIcon className="h-20 w-20 text-sky-500" />,
            title: t('tutorialTitle5'),
            description: t('tutorialDesc5'),
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col justify-between min-h-[500px]">
                <div className="flex-grow flex items-center justify-center">
                    <TutorialStep {...steps[currentStep]} />
                </div>

                <div className="flex items-center justify-between">
                    {/* Progress Dots */}
                    <div className="flex items-center gap-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                                    currentStep === index ? 'w-6 bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                                style={{backgroundColor: currentStep === index ? 'rgb(var(--c-primary))' : ''}}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-4">
                         <button onClick={onFinish} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            {t('skipTutorial')}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 text-white font-bold rounded-lg btn-primary-gradient"
                            >
                                <span>{isLastStep ? t('startLearning') : t('next')}</span>
                                {!isLastStep && <ArrowRightIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialScreen;
