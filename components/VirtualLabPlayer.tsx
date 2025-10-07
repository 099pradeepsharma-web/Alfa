import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VirtualLab, Grade, Subject, Chapter } from '../types';
import * as geminiService from '../services/geminiService';
import * as pineconeService from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { ExclamationTriangleIcon, WrenchScrewdriverIcon, BeakerIcon, ChevronDownIcon, ArchiveBoxIcon } from '@heroicons/react/24/solid';

interface VirtualLabPlayerProps {
  labData: VirtualLab;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
}

type Status = 'idle' | 'generating' | 'loading_cache' | 'ready' | 'error';

const VirtualLabPlayer: React.FC<VirtualLabPlayerProps> = ({ labData, grade, subject, chapter }) => {
    const { t, language } = useLanguage();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Status>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dynamicTips, setDynamicTips] = useState<string[] | null>(null);
    const [currentTip, setCurrentTip] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    
    const areAllOptionsSelected = useMemo(() => 
        labData.variables.length > 0 && labData.variables.every(v => selectedOptions[v.name]),
    [labData.variables, selectedOptions]);

    useEffect(() => {
        let tipInterval: number | undefined;
        let progressInterval: number | undefined;

        if (status === 'generating') {
            setProgress(0);
            
            if (!dynamicTips) {
                setCurrentTip("Gathering interesting facts for you...");
            } else if (dynamicTips.length > 0) {
                let tipIndex = 0;
                setCurrentTip(dynamicTips[0]);
                tipInterval = window.setInterval(() => {
                    tipIndex = (tipIndex + 1) % dynamicTips.length;
                    setCurrentTip(dynamicTips[tipIndex]);
                }, 5000);
            }

            progressInterval = window.setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        if (progressInterval) clearInterval(progressInterval);
                        return 95;
                    }
                    const increment = prev < 20 ? 5 : (prev > 80 ? 1 : 3);
                    return Math.min(prev + increment, 95);
                });
            }, 1000);
        }

        if (status === 'ready' || status === 'loading_cache') {
            setProgress(100);
        }

        return () => {
            clearInterval(tipInterval);
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [status, dynamicTips]);
    
    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);
    
    const handleRunSimulation = useCallback(async () => {
        if (!areAllOptionsSelected) return;

        let prompt = labData.baseScenarioPrompt + " " + labData.outcomePromptTemplate;
        let cacheKeyParts: (string | number)[] = ['vlab', grade.level, subject.name, chapter.title, labData.title];

        for (const variable of labData.variables) {
            const selectedValue = selectedOptions[variable.name];
            prompt = prompt.replace(new RegExp(`{{${variable.name.replace(/ /g, '_')}}}`, 'g'), selectedValue);
            cacheKeyParts.push(selectedValue);
        }
        const dbKey = cacheKeyParts.join('-').toLowerCase().replace(/\s+/g, '-');

        setError(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }
        
        try {
            const cachedVideo = await pineconeService.getVideo(dbKey);
            if (cachedVideo) {
                setStatus('loading_cache');
                await new Promise(resolve => setTimeout(resolve, 500)); 
                setVideoUrl(URL.createObjectURL(cachedVideo));
                setStatus('ready');
                return;
            }

            setStatus('generating');
            
            // Fetch dynamic, topic-specific tips without blocking
            setDynamicTips(null);
            const tipsTopic = `${labData.title} in ${subject.name}`;
            geminiService.generateEducationalTips(tipsTopic, language)
                .then(setDynamicTips)
                .catch(err => console.error("Could not fetch dynamic tips:", err));
            const videoBlob = await geminiService.generateVideoFromPrompt(prompt);
            await pineconeService.saveVideo(dbKey, videoBlob);
            setVideoUrl(URL.createObjectURL(videoBlob));
            setStatus('ready');
        } catch (e: any) {
            console.error("Virtual lab video generation failed:", e);
            let message = "Failed to generate video. This may be a temporary issue. Please try again later.";
            if (e && typeof e.message === 'string') {
                const lowerCaseMessage = e.message.toLowerCase();
                 if (lowerCaseMessage.includes('quota')) {
                    message = t('videoQuotaError');
                } else if (lowerCaseMessage.includes('rate limit')) {
                    message = 'The AI service is busy. Please wait a moment and try again.';
                } else if (lowerCaseMessage.includes('candidate was blocked') || lowerCaseMessage.includes('invalid prompt')) {
                     message = 'Video generation failed. Please try again with different parameters.';
                }
            }
            setError(message);
            setStatus('error');
        }
    }, [selectedOptions, labData, areAllOptionsSelected, grade, subject, chapter, videoUrl, t, language]);

    return (
        <div className="bg-slate-800/50 border border-border rounded-xl p-6 transition-shadow hover:shadow-md not-prose">
            <h3 className="text-2xl font-bold text-text-primary">{labData.title}</h3>
            <p className="text-text-secondary mt-2">{labData.description}</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                {labData.variables.map(variable => (
                    <div key={variable.name}>
                        <label htmlFor={`var-${variable.name}`} className="block text-sm font-bold text-text-primary mb-2">
                            {variable.name}
                        </label>
                        <div className="relative">
                            <select
                                id={`var-${variable.name}`}
                                value={selectedOptions[variable.name] || ''}
                                onChange={e => setSelectedOptions(prev => ({ ...prev, [variable.name]: e.target.value }))}
                                className="w-full pl-4 pr-10"
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
                 <div className="md:col-span-2 lg:col-span-1">
                    <button
                        onClick={handleRunSimulation}
                        disabled={!areAllOptionsSelected || status === 'generating' || status === 'loading_cache'}
                        className="w-full flex items-center justify-center btn-accent"
                    >
                        {status === 'generating' || status === 'loading_cache' ? <LoadingSpinner /> : <BeakerIcon className="h-6 w-6" />}
                        <span className="ml-2">{t('runSimulation')}</span>
                    </button>
                </div>
            </div>

            <div className="mt-6 aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                {status === 'loading_cache' && (
                    <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
                        <ArchiveBoxIcon className="h-12 w-12 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                        <p className="mt-4 font-semibold text-white/90 text-lg">Loading from your device... 100%</p>
                         <div className="w-3/4 max-w-sm bg-slate-700 rounded-full h-2.5 mt-4">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: '100%', backgroundColor: 'rgb(var(--c-primary))' }}></div>
                        </div>
                    </div>
                )}
                {status === 'generating' && (
                    <div className="text-center p-4 video-simulation-card-gradient w-full h-full flex flex-col items-center justify-center">
                        <div className="w-3/4 max-w-sm bg-slate-700/50 rounded-full h-2.5 mb-4">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-out', backgroundColor: 'rgb(var(--c-primary))' }}></div>
                        </div>
                        <p className="font-semibold text-white/90 text-lg">{`${Math.round(progress)}% Complete`}</p>
                        <p className="mt-4 font-semibold text-white/90 text-md video-loading-message max-w-md">{currentTip}</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="text-center p-4 bg-red-900/50 w-full h-full flex flex-col items-center justify-center rounded-lg">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
                        <p className="mt-3 font-semibold text-red-300">{t('videoGenerationError')}</p>
                        <p className="text-sm text-red-400 max-w-sm">{error}</p>
                        <button onClick={handleRunSimulation} className="mt-4 px-4 py-2 text-sm btn-accent">
                            {t('retryButton')}
                        </button>
                    </div>
                )}
                {status === 'ready' && videoUrl && (
                    <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                )}
                {status === 'idle' && (
                    <div className="text-center p-4 text-text-secondary">
                        <WrenchScrewdriverIcon className="h-12 w-12 mx-auto" />
                        <p className="mt-2 font-semibold">Configure your experiment and run the simulation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VirtualLabPlayer;