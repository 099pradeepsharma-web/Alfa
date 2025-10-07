import React, { useState, useEffect, useCallback } from 'react';
import * as geminiService from '../services/geminiService';
import * as pineconeService from '../services/pineconeService';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { PlayCircleIcon, ExclamationTriangleIcon, VideoCameraIcon } from '@heroicons/react/24/solid';

interface ConceptVideoPlayerProps {
  videoPrompt: string;
  dbKey: string;
}

type Status = 'checking' | 'cached' | 'idle' | 'generating' | 'ready' | 'error';

const loadingMessages = [
    "Contacting the AI animation studio...",
    "This is a special one-time generation...",
    "Storyboarding the core concepts...",
    "Rendering the visual explanation...",
    "Adding animated callouts and text...",
    "Finalizing the explainer video...",
    "Almost there, your video is loading!"
];

const ConceptVideoPlayer: React.FC<ConceptVideoPlayerProps> = ({ videoPrompt, dbKey }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<Status>('checking');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const checkCache = async () => {
            const cachedVideoBlob = await pineconeService.getVideo(dbKey);
            if (cachedVideoBlob) {
                setVideoUrl(URL.createObjectURL(cachedVideoBlob));
                setStatus('cached');
            } else {
                setStatus('idle');
            }
        };
        
        checkCache();
        
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [dbKey]);

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

    const handleGenerateClick = useCallback(async () => {
        setStatus('generating');
        setError(null);
        try {
            const videoBlob = await geminiService.generateVideoFromPrompt(videoPrompt);
            await pineconeService.saveVideo(dbKey, videoBlob);
            setVideoUrl(URL.createObjectURL(videoBlob));
            setStatus('ready');
        } catch (err: any) {
            console.error("Concept video generation failed:", err);
            if (err.message.toLowerCase().includes('quota')) {
                setError(t('videoQuotaError'));
            } else {
                setError(err.message || t('videoGenerationError'));
            }
            setStatus('error');
        }
    }, [videoPrompt, dbKey, t]);

    const renderContent = () => {
        switch (status) {
            case 'checking':
                return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
            case 'cached':
            case 'ready':
                return videoUrl ? <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" /> : null;
            case 'generating':
                return (
                     <div className="text-center p-4 video-simulation-card-gradient w-full h-full flex flex-col items-center justify-center">
                        <LoadingSpinner />
                        <p className="mt-4 font-semibold text-white/90 text-lg video-loading-message">{loadingMessage}</p>
                    </div>
                );
            case 'error':
                 return (
                     <div className="text-center p-4 bg-red-900/50 w-full h-full flex flex-col items-center justify-center rounded-lg">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
                        <p className="mt-3 font-semibold text-red-300">{t('videoGenerationError')}</p>
                        <p className="text-sm text-red-400 max-w-sm">{error}</p>
                        <button onClick={handleGenerateClick} className="mt-4 px-4 py-2 text-sm btn-accent">
                            {t('retryButton')}
                        </button>
                    </div>
                );
            case 'idle':
            default:
                 return (
                    <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
                        <button onClick={handleGenerateClick} className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition">
                            <VideoCameraIcon className="h-10 w-10"/>
                            <span className="font-semibold">{t('generateVideoSimulation')}</span>
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
            {renderContent()}
        </div>
    );
};

export default ConceptVideoPlayer;