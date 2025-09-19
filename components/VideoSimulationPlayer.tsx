import React, { useState, useEffect, useCallback } from 'react';
import { InteractiveVideoSimulation, Grade, Subject, Chapter } from '../types';
import * as geminiService from '../services/geminiService';
import * as pineconeService from '../services/pineconeService';
import { PREGENERATED_VIDEOS, createVideoCacheKey } from '../data/pregeneratedVideos';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from './LoadingSpinner';
import { PlayCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface VideoSimulationPlayerProps {
  simulationData: InteractiveVideoSimulation;
  dbKey: string;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
}

type Status = 'checking' | 'pregenerated' | 'cached' | 'idle' | 'generating' | 'ready' | 'error';

const loadingMessages = [
    "Contacting the AI director...",
    "This is a special one-time process...",
    "Your contribution will help other students learn faster!",
    "Storyboarding the main ideas...",
    "Setting up the digital scene...",
    "Rendering the first few frames...",
    "Applying digital effects and animations...",
    "Polishing the final cut...",
    "Almost there, the simulation is loading!"
];

const VideoSimulationPlayer: React.FC<VideoSimulationPlayerProps> = ({ simulationData, dbKey, grade, subject }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<Status>('checking');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const checkSources = async () => {
            // 1. Check pre-generated global "CDN"
            const pregenKey = createVideoCacheKey(grade.level, subject.name, simulationData.title);
            const pregenUrl = PREGENERATED_VIDEOS[pregenKey];

            if (pregenUrl) {
                setVideoUrl(pregenUrl);
                setStatus('pregenerated');
                return;
            }

            // 2. Check local IndexedDB cache
            const cachedVideoBlob = await pineconeService.getVideo(dbKey);
            if (cachedVideoBlob) {
                setVideoUrl(URL.createObjectURL(cachedVideoBlob));
                setStatus('cached');
                return;
            }
            
            // 3. If nothing is found, wait for user to generate
            setStatus('idle');
        };
        
        if (status === 'checking') {
            checkSources();
        }
        
        // Cleanup blob URL on unmount
        return () => {
            if (videoUrl && (status === 'cached' || status === 'ready')) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [dbKey, grade.level, subject.name, simulationData.title, status, videoUrl]);

    // Cycle through loading messages while generating
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
            const videoBlob = await geminiService.generateVideoFromPrompt(simulationData.videoPrompt);
            await pineconeService.saveVideo(dbKey, videoBlob);
            setVideoUrl(URL.createObjectURL(videoBlob));
            setStatus('ready');
        } catch (err: any) {
            console.error("Video generation failed:", err);
            setError(err.message || "An unknown error occurred during video generation.");
            setStatus('error');
        }
    }, [simulationData.videoPrompt, dbKey]);

    const renderPlayer = () => {
        if (!videoUrl) return null;
        return (
             <video 
                src={videoUrl}
                controls 
                autoPlay
                className="w-full h-full object-contain"
                crossOrigin={status === 'pregenerated' ? "anonymous" : undefined}
            >
                Your browser does not support the video tag.
            </video>
        );
    };
    
    const renderContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                        <LoadingSpinner />
                        <p className="mt-2 text-sm font-semibold">Checking for video...</p>
                    </div>
                );
            case 'pregenerated':
            case 'cached':
            case 'ready':
                return renderPlayer();
            case 'generating':
                return (
                     <div className="text-center p-4 video-simulation-card-gradient w-full h-full flex flex-col items-center justify-center">
                        <LoadingSpinner />
                        <p className="mt-4 font-semibold text-white/90 text-lg video-loading-message">{loadingMessage}</p>
                        <p className="text-sm text-white/70 mt-1">(This helps build our library for everyone!)</p>
                    </div>
                );
            case 'error':
                 return (
                     <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 w-full h-full flex flex-col items-center justify-center rounded-lg">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
                        <p className="mt-3 font-semibold text-red-700 dark:text-red-300">{t('videoGenerationError')}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        <button onClick={handleGenerateClick} className="mt-4 px-4 py-2 text-sm bg-primary text-white font-semibold rounded-lg">
                            {t('retryButton')}
                        </button>
                    </div>
                );
            case 'idle':
            default:
                 return (
                    <div className="text-center p-4 video-simulation-card-gradient w-full h-full flex flex-col items-center justify-center">
                         <h4 className="text-2xl font-bold text-white mb-4">Visualize this Concept</h4>
                        <button 
                            onClick={handleGenerateClick}
                            className="flex items-center gap-3 px-6 py-3 bg-white/20 text-white font-bold rounded-full text-lg backdrop-blur-sm border border-white/30 hover:bg-white/30 transition transform hover:scale-105"
                        >
                            <PlayCircleIcon className="h-8 w-8" />
                            {t('generateVideoSimulation')}
                        </button>
                    </div>
                );
        }
    };

    const getStatusIndicator = () => {
        if (status === 'pregenerated' || status === 'cached') {
            return (
                <div className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Instantly Available</span>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-shadow hover:shadow-md not-prose">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{simulationData.title}</h3>
                {getStatusIndicator()}
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-2">{simulationData.description}</p>
            <div className="mt-6 aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};

export default VideoSimulationPlayer;
