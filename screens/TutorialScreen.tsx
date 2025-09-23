import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface TutorialScreenProps {
  onFinish: () => void;
}

// --- START: Custom SVG Illustrations for Tutorial Steps ---
const AdvantageIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <defs><linearGradient id="adv-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="rgb(var(--c-primary-dark))" /><stop offset="100%" stopColor="rgb(var(--c-primary))" /></linearGradient></defs>
        <path d="M50 5 L95 25 V 55 L50 75 L5 55 V 25 Z" fill="url(#adv-grad)" opacity="0.1" />
        <path d="M50 10 L90 30 V 50 L50 70 L10 50 V 30 Z" stroke="url(#adv-grad)" strokeWidth="3" fill="none" />
        <path d="M50 25 L65 35 L50 45 L35 35 Z" fill="rgb(var(--c-surface))" stroke="url(#adv-grad)" strokeWidth="2" className="animate-pulse" style={{animationDuration: '3s'}} />
        <path d="M50 46 L60 52 M50 46 L40 52 M50 46 V 60" stroke="url(#adv-grad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const MissionIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <path d="M10 70 Q 30 20, 50 40 T 90 20" stroke="rgb(var(--c-border))" strokeDasharray="4" strokeWidth="2" fill="none"><animate attributeName="stroke-dashoffset" values="20;0" dur="2s" repeatCount="indefinite" /></path>
        <path d="M15 65 L20 60 L15 55" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(-10 -5)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M10 70 Q 30 20, 50 40 T 90 20" />
        </path>
        <circle cx="90" cy="20" r="5" fill="rgb(var(--c-success))" className="animate-pulse" />
    </svg>
);
const DoubtResolutionIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <path d="M20,75 C20,55 30,55 30,45 A10,10 0 1 1 50,45 C50,55 60,55 60,75 Z" fill="rgba(var(--c-primary-light), 0.5)" />
        <text x="40" y="35" fontSize="20" fill="rgb(var(--c-primary-dark))" className="animate-bounce font-bold">?</text>
        <path d="M60 40 C 70 20, 90 20, 95 40 S 80 60, 70 50" fill="none" stroke="rgb(var(--c-success))" strokeWidth="3" strokeLinecap="round"><animate attributeName="d" values="M60 40 C 70 20, 90 20, 95 40 S 80 60, 70 50;M60 40 C 70 25, 85 25, 95 40 S 80 55, 70 50;M60 40 C 70 20, 90 20, 95 40 S 80 60, 70 50" dur="2s" repeatCount="indefinite"/></path>
    </svg>
);
const CultureIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <path d="M10 10 L 50 5 L 90 10 L 90 70 L 50 75 L 10 70 Z" fill="rgb(var(--c-bg-card-hover))" />
        <line x1="50" y1="5" x2="50" y2="75" stroke="rgb(var(--c-border))" />
        <circle cx="30" cy="30" r="3" fill="rgb(var(--c-primary))" /><path d="M25 40 A 10 8 0 0 1 35 40" stroke="rgb(var(--c-primary))" strokeWidth="1.5" fill="none" />
        <path d="M70 30 C 65 40, 75 40, 70 50 M70 30 C 75 40, 65 40, 70 50" fill="rgba(255,165,0,0.7)" />
        <path d="M70 25 L 70 30" stroke="rgba(255,165,0,0.9)" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const CareerIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <circle cx="50" cy="40" r="30" fill="none" stroke="rgb(var(--c-border))" strokeWidth="2" />
        <path d="M50 10 L 50 70 M20 40 L 80 40" stroke="rgb(var(--c-border))" strokeWidth="1" />
        <path d="M50 10 L45 20 M50 10 L55 20" stroke="rgb(var(--c-primary))" strokeWidth="3" strokeLinecap="round" />
        <g transform="translate(42 5)" fill="rgb(var(--c-primary))"><animateTransform attributeName="transform" type="rotate" from="0 50 40" to="360 50 40" dur="8s" repeatCount="indefinite" /><path d="M50 12 L 47 20 L 53 20 Z" /></g>
    </svg>
);
const CompeteIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <path d="M30 20 H 70 L 65 70 H 35 Z" fill="gold" stroke="darkgoldenrod" strokeWidth="2" />
        <path d="M40 10 A 10 10 0 0 1 60 10" fill="none" stroke="darkgoldenrod" strokeWidth="2" />
        <path d="M20 30 L 30 35 M80 30 L 70 35" stroke="darkgoldenrod" strokeWidth="2" fill="none" />
        <path d="M15,5 L25,15" stroke="white" strokeWidth="3" strokeLinecap="round"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0s"/></path>
        <path d="M85,5 L75,15" stroke="white" strokeWidth="3" strokeLinecap="round"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/></path>
    </svg>
);
const ReadyIllustration = () => (
    <svg viewBox="0 0 100 80" className="h-24 w-auto">
        <circle cx="50" cy="45" r="20" fill="rgb(var(--c-primary))" />
        <path d="M40 45 A 10 10 0 0 1 60 45" stroke="white" strokeWidth="2" fill="none" />
        <path d="M35,15 L50,5 L65,15 L50,25 Z" fill="gold" stroke="darkgoldenrod" strokeWidth="1.5" />
        <path d="M50 25 V 25"><animate attributeName="d" values="M50 25 V 25; M50 25 V 30" dur="1s" fill="freeze" begin="0.5s" /></path>
    </svg>
);
// --- END: Custom SVG Illustrations ---

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
            illustration: <AdvantageIllustration />,
            titleKey: 'tutorialTitle_Advantage',
            descKey: 'tutorialDesc_Advantage',
        },
        {
            illustration: <MissionIllustration />,
            titleKey: 'tutorialTitle_Mission',
            descKey: 'tutorialDesc_Mission',
        },
        {
            illustration: <DoubtResolutionIllustration />,
            titleKey: 'tutorialTitle_DoubtResolution',
            descKey: 'tutorialDesc_DoubtResolution',
        },
        {
            illustration: <CultureIllustration />,
            titleKey: 'tutorialTitle_Cultural',
            descKey: 'tutorialDesc_Cultural',
        },
        {
            illustration: <CareerIllustration />,
            titleKey: 'tutorialTitle_Career',
            descKey: 'tutorialDesc_Career',
        },
        {
            illustration: <CompeteIllustration />,
            titleKey: 'tutorialTitle_Compete',
            descKey: 'tutorialDesc_Compete',
        },
        {
            illustration: <ReadyIllustration />,
            titleKey: 'tutorialTitle_Ready',
            descKey: 'tutorialDesc_Ready',
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
                    <TutorialStep 
                        icon={steps[currentStep].illustration}
                        title={t(steps[currentStep].titleKey)}
                        description={t(steps[currentStep].descKey)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    {/* Progress Bars */}
                    <div className="flex items-center gap-1.5 w-1/3">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    currentStep >= index ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                                style={{
                                    width: `${100 / steps.length}%`,
                                    backgroundColor: currentStep >= index ? 'rgb(var(--c-primary))' : ''
                                }}
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
                                <span>{isLastStep ? t('letsGo') : t('next')}</span>
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
