import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, CubeIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Student, AdaptiveStory } from '../types';
import * as geminiService from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AdaptiveStoryPlayer from '../components/AdaptiveStoryPlayer';

interface InnovationLabScreenProps {
  onBack: () => void;
}

const InnovationLabScreen: React.FC<InnovationLabScreenProps> = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    
    const [topic, setTopic] = useState('');
    const [story, setStory] = useState<AdaptiveStory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !currentUser) return;
        
        setIsLoading(true);
        setError(null);
        setStory(null);
        try {
            // FIX: Cast currentUser to Student to access the 'grade' property. This is safe because this screen is only for students.
            const generatedStory = await geminiService.generateAdaptiveStory(topic, (currentUser as Student).grade, language);
            setStory(generatedStory);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!currentUser) return null;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center">
                    <CubeIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('alfanumrikLabTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">
                       {t('adaptiveStoryGeneratorDesc')}
                    </p>
                </div>
                
                <div className="mt-8 max-w-xl mx-auto">
                    <form onSubmit={handleGenerateStory} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('storyTopicPlaceholder')}
                            className="w-full"
                        />
                        <button type="submit" className="btn-accent flex items-center justify-center h-12 px-4" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner/> : <SparklesIcon className="h-6 w-6"/>}
                        </button>
                    </form>
                    <div className="flex justify-center gap-2 mt-2">
                        {['An adventurous astronaut', 'A detective solving a mystery', 'A historical event from a new perspective'].map(suggestion => (
                            <button key={suggestion} onClick={() => setTopic(suggestion)} className="text-xs px-2 py-1 bg-surface rounded-full text-text-secondary hover:bg-bg-primary">
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    {isLoading && (
                        <div className="flex flex-col items-center text-center p-8">
                            <LoadingSpinner />
                            <p className="mt-2 font-semibold text-text-secondary">{t('generatingStory')}</p>
                        </div>
                    )}
                    {error && <p className="text-center text-status-danger font-semibold">{error}</p>}
                    {story && (
                        <div className="p-4 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 animate-fade-in">
                            <AdaptiveStoryPlayer storyData={story} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InnovationLabScreen;
