import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface TutorialScreenProps {
  onFinish: () => void;
}

// --- START: New, Animated SVG Illustrations for Tutorial Steps ---
const AdvantageIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <defs>
            <linearGradient id="adv-grad-tut" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--c-primary-dark))" />
                <stop offset="100%" stopColor="rgb(var(--c-primary))" />
            </linearGradient>
            <style>
                {`
                    @keyframes shimmer-tut { 0% { stroke-dashoffset: 400; } 100% { stroke-dashoffset: 0; } }
                    @keyframes check-draw-tut { to { stroke-dashoffset: 0; } }
                    .adv-shimmer-tut {
                        stroke-dasharray: 200;
                        animation: shimmer-tut 2s ease-in-out infinite;
                    }
                    .adv-check-tut {
                        stroke-dasharray: 100;
                        stroke-dashoffset: 100;
                        animation: check-draw-tut 0.5s ease-out forwards 0.5s;
                    }
                `}
            </style>
        </defs>
        <path d="M50 5 L95 25 V 55 L50 75 L5 55 V 25 Z" fill="url(#adv-grad-tut)" opacity="0.1" />
        <path d="M50 5 L95 25 V 55 L50 75 L5 55 V 25 Z" stroke="url(#adv-grad-tut)" strokeWidth="2" fill="none" className="adv-shimmer-tut"/>
        <path d="M35 40 L48 53 L65 30" stroke="rgb(var(--c-success))" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" className="adv-check-tut" />
    </svg>
);
const MissionIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <style>
            {`
                @keyframes mission-path-draw { to { stroke-dashoffset: 0; } }
                .mission-path-tut {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: mission-path-draw 2s ease-in-out forwards;
                }
            `}
        </style>
        <path d="M10 70 Q 30 10, 50 40 T 90 20" stroke="rgb(var(--c-border-color))" strokeWidth="2" fill="none" className="mission-path-tut" />
        <path d="M5 5 L10 10 L5 15" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-10 -5)">
            <animateMotion dur="2s" repeatCount="1" fill="freeze" path="M10 70 Q 30 10, 50 40 T 90 20" />
        </path>
        <circle cx="90" cy="20" r="6" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-success))" strokeWidth="2.5" >
             <animate attributeName="opacity" values="0;0;1" dur="2s" fill="freeze" />
        </circle>
        <path d="M87 20 L 90 23 L 94 18" stroke="rgb(var(--c-success))" fill="none" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0;0;1" dur="2s" fill="freeze" />
        </path>
    </svg>
);
const DoubtResolutionIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <style>
            {`
                @keyframes fitto-wink-tut { 0%, 80%, 100% { transform: scaleY(1); } 90% { transform: scaleY(0.1); } }
                @keyframes bubble-pop-tut { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes text-fade-in-tut { 0% { opacity: 0; } 50% { opacity: 0; } 100% { opacity: 1; } }
            `}
        </style>
        <circle cx="25" cy="50" r="15" fill="rgb(var(--c-primary))" />
        <circle cx="25" cy="50" r="7" fill="rgb(var(--c-surface))" style={{ animation: 'fitto-wink-tut 3s infinite ease-in-out' }} />
        <path d="M45 45 L 75 45 A 10 10 0 0 1 85 55 L 85 60 A 10 10 0 0 1 75 70 L 50 70 A 5 5 0 0 1 45 65 Z" fill="rgba(var(--c-surface), 1)" style={{ animation: 'bubble-pop-tut 0.5s ease-out 0.2s forwards' }} />
        <text x="50" y="60" fontSize="8" fill="rgb(var(--c-text-primary))" style={{ animation: 'text-fade-in-tut 1s ease-out 0.5s forwards' }}>Hello!</text>
    </svg>
);
const CultureIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
         <style>
            {`
                @keyframes swipe-tut { from { width: 0; } to { width: 45px; } }
                @keyframes diya-fade-tut { 0% { opacity: 0; } 50% { opacity: 0; } 100% { opacity: 1; } }
                .swipe-rect-tut { animation: swipe-tut 0.7s ease-out 0.5s forwards; }
            `}
        </style>
        <rect x="5" y="10" width="90" height="60" rx="5" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-border-color))" strokeWidth="2"/>
        <line x1="50" y1="10" x2="50" y2="70" stroke="rgb(var(--c-border-color))" strokeWidth="2" />
        <path d="M20 30 L 30 50 L 40 40" stroke="rgb(var(--c-text-secondary))" fill="none" strokeWidth="2" />
        <rect x="15" y="55" width="25" height="5" fill="rgb(var(--c-text-secondary))" opacity="0.5"/>
        <rect x="50" y="10" height="60" fill="rgb(var(--c-primary-light))" className="swipe-rect-tut" />
        <g style={{ animation: 'diya-fade-tut 1.5s ease-out forwards' }}>
            <path d="M65 50 C 70 60, 80 60, 85 50 L 75 45 Z" fill="#FFC107" />
            <path d="M73 45 C 75 40, 78 40, 77 45" fill="#FF5722" />
        </g>
    </svg>
);
const CareerIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <circle cx="50" cy="40" r="30" fill="none" stroke="rgb(var(--c-border-color))" strokeWidth="2" />
        <g stroke="rgb(var(--c-border-color))" strokeWidth="1">
            <path d="M50 10 L 50 70" />
            <path d="M29.02 25 L 70.98 55" />
            <path d="M29.02 55 L 70.98 25" />
        </g>
        <path d="M50 10 L45 20 M50 10 L55 20" stroke="rgb(var(--c-primary))" strokeWidth="3" strokeLinecap="round" />
        <g transform="translate(42 5)" fill="rgb(var(--c-primary))">
            <animateTransform attributeName="transform" type="rotate" from="0 50 40" to="360 50 40" dur="4s" repeatCount="indefinite" />
            <path d="M50 12 L 47 20 L 53 20 Z" />
        </g>
    </svg>
);
const CompeteIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <style>
            {`
                @keyframes pop-in-tut { from { transform: scale(0); } to { transform: scale(1); } }
                .icon-pop-1 { animation: pop-in-tut 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards; }
                .icon-pop-2 { animation: pop-in-tut 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards; }
                .icon-pop-3 { animation: pop-in-tut 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.6s forwards; }
            `}
        </style>
        <g transform="scale(0)" className="icon-pop-1">
            <path d="M30 20 H 70 L 65 70 H 35 Z" fill="gold" />
            <text x="50" y="55" textAnchor="middle" fontSize="30" fill="darkgoldenrod">1</text>
        </g>
        <g transform="scale(0)" className="icon-pop-2">
            <rect x="5" y="30" width="20" height="20" rx="3" fill="rgb(var(--c-primary-dark))" />
        </g>
        <g transform="scale(0)" className="icon-pop-3">
            <circle cx="90" cy="40" r="10" fill="rgb(var(--c-success))" />
        </g>
    </svg>
);
const CollaborationIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <style>
            {`
                @keyframes collaboration-line-draw { to { stroke-dashoffset: 0; } }
                .collab-line {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                }
                .collab-line-1 { animation: collaboration-line-draw 1s ease-out 0.5s forwards; }
                .collab-line-2 { animation: collaboration-line-draw 1s ease-out 0.7s forwards; }
                @keyframes collaboration-pop-in { from { transform: scale(0); } to { transform: scale(1); } }
                .collab-pop { animation: collaboration-pop-in 0.5s ease-out forwards; }
            `}
        </style>
        {/* Globe */}
        <circle cx="50" cy="50" r="20" fill="rgba(var(--c-primary), 0.1)" stroke="rgb(var(--c-primary))" strokeWidth="1.5" />
        <path d="M50 30 C 65 40, 65 60, 50 70" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="1" opacity="0.5"/>
        <path d="M35 40 C 45 45, 45 55, 35 60" fill="none" stroke="rgb(var(--c-primary))" strokeWidth="1" opacity="0.5"/>

        {/* Avatars */}
        <circle cx="15" cy="50" r="8" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-accent))" strokeWidth="2" className="collab-pop" style={{animationDelay: '0.2s'}} />
        <circle cx="85" cy="50" r="8" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-accent))" strokeWidth="2" className="collab-pop" style={{animationDelay: '0.4s'}}/>

        {/* Project Icon */}
        <rect x="45" y="15" width="10" height="10" rx="2" fill="rgb(var(--c-success))" className="collab-pop" style={{animationDelay: '1s'}}/>

        {/* Connecting Lines */}
        <path d="M23 48 Q 40 30, 48 24" stroke="rgb(var(--c-accent))" strokeWidth="1.5" fill="none" className="collab-line collab-line-1" />
        <path d="M77 48 Q 60 30, 52 24" stroke="rgb(var(--c-accent))" strokeWidth="1.5" fill="none" className="collab-line collab-line-2" />
    </svg>
);
const ReadyIllustration = () => (
    <svg viewBox="0 0 100 80" className="w-auto h-24">
        <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 -20; 0 0" dur="2s" repeatCount="indefinite"/>
            <path d="M40 70 L 50 50 L 60 70 Z" fill="rgb(var(--c-primary))" />
            <path d="M45 70 H 55 V 75 H 45 Z" fill="rgb(var(--c-primary-dark))" />
            <path d="M35 55 C 40 40, 60 40, 65 55" stroke="rgb(var(--c-primary))" fill="none" strokeWidth="3" />
        </g>
        <circle cx="50" cy="15" r="3" fill="gold" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0s"/></circle>
        <circle cx="40" cy="25" r="2" fill="gold" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.2s"/></circle>
        <circle cx="60" cy="25" r="2" fill="gold" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.4s"/></circle>
    </svg>
);
// --- END: Custom SVG Illustrations ---

const TutorialStep: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => {
    return (
        <div className="flex flex-col items-center text-center p-6 animate-fade-in">
            <div className="mb-6">{icon}</div>
            <h3 className="text-3xl font-bold text-text-primary">{title}</h3>
            <p className="mt-2 text-lg text-text-secondary max-w-md">{description}</p>
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
            titleKey: 'tutorialTitle_CompeteGlory',
            descKey: 'tutorialDesc_CompeteGlory',
        },
        {
            illustration: <CollaborationIllustration />,
            titleKey: 'tutorialTitle_CollaborateCreate',
            descKey: 'tutorialDesc_CollaborateCreate',
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
        <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-8 flex flex-col justify-between min-h-[500px]">
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
                                    currentStep >= index ? 'bg-primary' : 'bg-border'
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
                         <button onClick={onFinish} className="text-sm font-semibold text-text-secondary hover:text-text-primary">
                            {t('skipTutorial')}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="p-2 rounded-full bg-bg-primary text-text-secondary hover:bg-border disabled:opacity-50"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 btn-accent"
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