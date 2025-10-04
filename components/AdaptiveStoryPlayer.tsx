import React, { useState, useEffect } from 'react';
import { AdaptiveStory, StoryNode, StoryNodeChoice } from '../types';
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
    const [selectedChoiceText, setSelectedChoiceText] = useState<string | null>(null);

    useEffect(() => {
        const node = storyData.nodes.find(n => n.id === currentNodeId) || null;
        setCurrentNode(node);
        setFeedback(null);
        setIsChoiceMade(false);
        setSelectedChoiceText(null);
    }, [currentNodeId, storyData.nodes]);

    const handleChoiceClick = (choice: StoryNodeChoice) => {
        setFeedback(choice.feedback);
        setSelectedChoiceText(choice.text);
        setIsChoiceMade(true);
        
        setTimeout(() => {
            setCurrentNodeId(choice.nextNodeId);
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
                <h4 className="text-xl font-bold text-text-primary">{storyData.title}</h4>
                <p className="text-sm text-text-secondary mt-1">{storyData.introduction}</p>
            </div>
            
            <p className="adaptive-story-text whitespace-pre-wrap">{currentNode.text}</p>
            
            {!currentNode.isEnding && (
                 <div className="adaptive-story-choices">
                    {currentNode.choices.map((choice, index) => {
                        let buttonClass = "adaptive-story-choice-btn";
                        if (isChoiceMade) {
                            if (choice.text === selectedChoiceText) {
                                buttonClass += " selected";
                            } else {
                                buttonClass += " unselected";
                            }
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => handleChoiceClick(choice)}
                                disabled={isChoiceMade}
                                className={buttonClass}
                            >
                               {choice.text}
                            </button>
                        );
                    })}
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
                <div className="mt-6 text-center p-4 bg-green-900/40 border border-green-700 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 mx-auto text-green-500" />
                    <p className="mt-2 font-bold text-lg text-green-200">The story has concluded.</p>
                </div>
            )}
            
            <div className="adaptive-story-controls">
                <button 
                    onClick={handleRestart}
                    className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                    {t('restartStory')}
                </button>
            </div>
        </div>
    );
};

export default AdaptiveStoryPlayer;