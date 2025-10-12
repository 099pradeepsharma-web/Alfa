import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InteractiveExplainer, Grade, Subject, Chapter } from '../types';
import * as geminiService from '../services/geminiService';
import * as pineconeService from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { PlayCircleIcon, ExclamationTriangleIcon, ChevronDownIcon, FilmIcon } from '@heroicons/react/24/solid';

interface InteractiveExplainerPlayerProps {
  explainerData: InteractiveExplainer;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
}

type Status = 'idle' | 'generating' | 'ready' | 'error';

const loadingMessages = [
    "Contacting the AI animation studio...",
    "This is a special one-time generation...",
    "Your unique video will help other students learn!",
    "Storyboarding the key concepts...",
    "Setting up the digital scene for animation...",
    "Rendering the first few frames...",
    "Applying visual effects and explanations...",
    "Polishing the final animated video...",
    "Almost there, the explainer is loading!"
];

const InteractiveExplainerPlayer: React.FC<InteractiveExplainerPlayerProps> = ({ explainerData, grade, subject, chapter }) => {
    const { t } = useLanguage();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Status>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    
    const areAllOptionsSelected = useMemo(() => 
        explainerData.variables.length > 0 && explainerData.variables.every(v => selectedOptions[v.name]),
    [explainerData.variables, selectedOptions]);

    useEffect(() => {
        let interval: number;
        if (status === 'generating') {
            let messageIndex = 0;
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[messageIndex]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);
    
    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);
    
    const handleVisualizeScenario = useCallback(async () => {
        if (!areAllOptionsSelected) return;

        let prompt = explainerData.videoPromptTemplate;
        let cacheKeyParts: (string | number)[] = ['explainer', grade.level, subject.name, chapter.title, explainerData.title];

        for (const variable of explainerData.variables) {
            const selectedValue = selectedOptions[variable.name];
            prompt = prompt.replace(new RegExp(`{{${variable.name}}}`, 'g'), selectedValue);
            cacheKeyParts.push(selectedValue);
        }
        const dbKey = cacheKeyParts.join('-').toLowerCase().replace(/\s+/g, '-');

        setStatus('generating');
        setError(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }
        
        const cachedVideo = await pineconeService.getVideo(dbKey);
        if (cachedVideo) {
            setVideoUrl(URL.createObjectURL(cachedVideo));
            setStatus('ready');
            return;
        }

        try {
            const videoBlob = await geminiService.generateVideoFromPrompt(prompt);
            await pineconeService.saveVideo(dbKey, videoBlob);
            setVideoUrl(URL.createObjectURL(videoBlob));
            setStatus('ready');
        } catch (e: any) {
            console.error("Interactive explainer video generation failed:", e);
            setError(e.message || "Failed to generate video.");
            setStatus('error');
        }
    }, [selectedOptions, explainerData, areAllOptionsSelected, grade, subject, chapter, videoUrl, t]);

    return (
        <div className="bg-slate-800/50 border border-border rounded-xl p-6 transition-shadow hover:shadow-md not-prose">
            <h3 className="text-2xl font-bold text-text-primary">{explainerData.title}</h3>
            <p className="text-text-secondary mt-2">{explainerData.description}</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {explainerData.variables.map(variable => (
                    <div key={variable.name}>
                        <label htmlFor={`var-explainer-${variable.name}`} className="block text-sm font-bold text-text-primary mb-2">
                            {variable.name}
                        </label>
                        <div className="relative">
                            <select
                                id={`var-explainer-${variable.name}`}
                                value={selectedOptions[variable.name] || ''}
                                onChange={e => setSelectedOptions(prev => ({ ...prev, [variable.name]: e.target.value }))}
                                className="w-full"
                            >
                                <option value="" disabled>{t('selectAnOption')}</option>
                                {variable.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
                 <div className="md:col-span-3 lg:col-span-1">
                    <button
                        onClick={handleVisualizeScenario}
                        disabled={!areAllOptionsSelected || status === 'generating'}
                        className="w-full flex items-center justify-center btn-accent"
                    >
                        {status === 'generating' ? <LoadingSpinner /> : <PlayCircleIcon className="h-6 w-6" />}
                        <span className="ml-2">{t('visualizeScenario')}</span>
                    </button>
                </div>
            </div>

            <div className="mt-6 aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                {status === 'generating' && (
                    <div className="text-center p-4 video-simulation-card-gradient w-full h-full flex flex-col items-center justify-center">
                        <LoadingSpinner />
                        <p className="mt-4 font-semibold text-white/90 text-lg video-loading-message">{loadingMessage}</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="text-center p-4 bg-red-900/50 w-full h-full flex flex-col items-center justify-center rounded-lg">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
                        <p className="mt-3 font-semibold text-red-300">{t('videoGenerationError')}</p>
                        <p className="text-sm text-red-400 max-w-sm">{error}</p>
                        <button onClick={handleVisualizeScenario} className="mt-4 px-4 py-2 text-sm btn-accent">
                            {t('retryButton')}
                        </button>
                    </div>
                )}
                {status === 'ready' && videoUrl && (
                    <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                )}
                {status === 'idle' && (
                    <div className="text-center p-4 text-text-secondary">
                        <FilmIcon className="h-12 w-12 mx-auto" />
                        <p className="mt-2 font-semibold">{t('configureExplainer')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InteractiveExplainerPlayer;
