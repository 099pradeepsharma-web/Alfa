import React, { useState, useEffect } from 'react';
import { AdaptiveStory, StoryNode } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { ArrowPathIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface AdaptiveStoryPlayerProps {
  storyData: AdaptiveStory;
}

const AdaptiveStoryPlayer: React.FC<AdaptiveStoryPlayerProps> = ({ storyData }) => {
    const { t } = useLanguage();
    const [currentNodeId, setCurrentNodeId] = useState<string>(storyData.startNodeId);
    const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isChoiceMade, setIsChoiceMade] = useState(false);

    useEffect(() => {
        const node = storyData.nodes.find(n => n.id === currentNodeId) || null;
        setCurrentNode(node);
        setFeedback(null);
        setIsChoiceMade(false);
    }, [currentNodeId, storyData.nodes]);

    const handleChoiceClick = (nextNodeId: string, choiceFeedback: string) => {
        setFeedback(choiceFeedback);
        setIsChoiceMade(true);
        
        setTimeout(() => {
            setCurrentNodeId(nextNodeId);
        }, 2500); // Wait 2.5 seconds to show feedback before moving on
    };
    
    const handleRestart = () => {
        setCurrentNodeId(storyData.startNodeId);
    };

    if (!currentNode) {
        return (
            <div className="adaptive-story-container">
                <p>Error: Story node not found.</p>
            </div>
        );
    }

    return (
        <div className="adaptive-story-container">
            <div className="adaptive-story-intro">
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{storyData.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{storyData.introduction}</p>
            </div>
            
            <p className="adaptive-story-text whitespace-pre-wrap">{currentNode.text}</p>
            
            {!currentNode.isEnding && (
                 <div className="adaptive-story-choices">
                    {currentNode.choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => handleChoiceClick(choice.nextNodeId, choice.feedback)}
                            disabled={isChoiceMade}
                            className="adaptive-story-choice-btn"
                        >
                           {choice.text}
                        </button>
                    ))}
                </div>
            )}

            {feedback && (
                <div className="adaptive-story-feedback adaptive-story-feedback-neutral">
                     <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="font-semibold">{feedback}</p>
                    </div>
                </div>
            )}
            
            {currentNode.isEnding && (
                <div className="mt-6 text-center p-4 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 mx-auto text-green-500" />
                    <p className="mt-2 font-bold text-lg text-green-800 dark:text-green-200">The story has concluded.</p>
                </div>
            )}
            
            <div className="adaptive-story-controls">
                <button 
                    onClick={handleRestart}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-dark dark:hover:text-primary-dark transition-colors duration-200"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                    {t('restartStory')}
                </button>
            </div>
        </div>
    );
};

export default AdaptiveStoryPlayer;
