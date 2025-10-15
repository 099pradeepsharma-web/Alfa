import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Concept, Student, Grade, Subject, Chapter, StudentQuestion, FittoResponse, LearningModule } from '../types';
import { BeakerIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, MicrophoneIcon, PaperAirplaneIcon, PencilSquareIcon, StopCircleIcon, TrophyIcon, PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/solid';
import { saveStudentQuestion, updateStudentQuestion } from '../services/pineconeService';
import { getFittoAnswer } from '../services/geminiService';

import LoadingSpinner from './LoadingSpinner';
import PracticeExercises from './PracticeExercises';
import FittoAvatar, { FittoState } from './FittoAvatar';
import { useLanguage } from '../contexts/Language-context';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTTS } from '../hooks/useTTS';
import { getIcon } from './IconMap';
import StructuredText from './StructuredText';

interface ConceptCardProps {
  concept: Concept;
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  student: Student;
  language: string;
  progressStatus: 'locked' | 'novice' | 'competent' | 'master';
  onConceptMastered: (conceptTitle: string, score: number, correctCount: number) => void;
  onMarkAsInProgress?: () => void;
  
  // New props for deep content
  learningModule: LearningModule;
  isLoadingSection: (section: keyof LearningModule) => boolean;
  onLoadSection: (section: keyof LearningModule) => void;
}

type ConversationTurn = {
    id: number;
    type: 'user' | 'fitto';
    text: string;
    state?: 'thinking' | 'error';
};

const ProgressBadge: React.FC<{ status: ConceptCardProps['progressStatus'] }> = ({ status }) => {
    const { t } = useLanguage();
    switch (status) {
        case 'master':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-900/50 text-green-300"><CheckCircleSolid className="h-4 w-4 mr-1"/>{t('mastered')}</span>;
        case 'competent':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300"><ClockIcon className="h-4 w-4 mr-1"/>{t('masteryCompetent')}</span>;
        case 'novice':
        default:
            return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-600 text-slate-300">{t('masteryNovice')}</span>;
    }
}

const ConceptCard: React.FC<ConceptCardProps> = React.memo(({ 
    concept, grade, subject, chapter, student, language, progressStatus, onConceptMastered,
    learningModule, isLoadingSection, onLoadSection 
}) => {
  const { t } = useLanguage();
  
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [showPractice, setShowPractice] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const SubjectIcon = getIcon(subject.icon);
  
  const { isSpeaking: isFittoSpeaking, isPaused, currentlyPlayingId, play: playFittoResponse, pause, resume, stop: stopFittoResponse } = useTTS();

  const handleSubmitText = useCallback(async (text: string) => {
    const trimmedQuestion = text.trim();
    if (!trimmedQuestion || isSubmitting) return;

    setIsSubmitting(true);
    if (isFittoSpeaking) stopFittoResponse();
    
    const userTurn: ConversationTurn = { id: Date.now(), type: 'user', text: trimmedQuestion };
    const thinkingTurn: ConversationTurn = { id: Date.now() + 1, type: 'fitto', text: '', state: 'thinking' };

    setConversation(prev => [...prev, userTurn, thinkingTurn]);
    setQuestionText("");

    const newQuestion: StudentQuestion = {
        id: `q-${userTurn.id}`,
        studentId: student.id,
        studentName: student.name,
        grade: grade.level,
        subject: subject.name,
        chapter: chapter.title,
        concept: concept.conceptTitle,
        questionText: trimmedQuestion,
        timestamp: new Date().toISOString(),
    };

    try {
        await saveStudentQuestion(newQuestion, language);
        const response = await getFittoAnswer(newQuestion, student, language);
        
        setConversation(prev => prev.map(turn => 
            turn.id === thinkingTurn.id ? { ...turn, text: response.responseText, state: undefined } : turn
        ));
        
        const updatedQuestion = { ...newQuestion, fittoResponse: response };
        await updateStudentQuestion(updatedQuestion, language);

    } catch (err: any) {
        setConversation(prev => prev.map(turn => 
            turn.id === thinkingTurn.id ? { ...turn, text: err.message, state: 'error' } : turn
        ));
    } finally {
        setIsSubmitting(false);
    }
  }, [isSubmitting, student, grade, subject, chapter, concept.conceptTitle, language, isFittoSpeaking, stopFittoResponse]);
  
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition({
      onEnd: handleSubmitText
  });

  const handleMastered = useCallback((score: number, correctCount: number) => {
    onConceptMastered(concept.conceptTitle, score, correctCount);
  }, [onConceptMastered, concept.conceptTitle]);

  useEffect(() => {
    // This effect synchronizes the speech recognition transcript with the input field
    // It provides live feedback to the user as they speak.
    setQuestionText(transcript);
  }, [transcript]);
  
  useEffect(() => {
    // Initialize with a welcome message from Fitto
    setConversation([{
        id: Date.now(),
        type: 'fitto',
        text: t('fittoWelcome', { concept: concept.conceptTitle })
    }]);
  }, [t, concept.conceptTitle]);
  
  useEffect(() => {
    // Auto-scroll to the bottom of the chat history
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversation]);


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
        // If user submits while listening, stop listening.
        // The onEnd callback will then trigger the submission.
        stopListening();
    } else {
        // If not listening, submit the text from the input field directly.
        handleSubmitText(questionText);
    }
  };

  const renderQnA = () => {
    return (
        <div className="flex flex-col space-y-4">
            <div ref={chatHistoryRef} className="space-y-4 h-72 overflow-y-auto pr-2 rounded-lg bg-bg-primary p-3 border border-border">
                {conversation.map((turn, index) => {
                    if (turn.type === 'user') {
                        return (
                            <div key={turn.id} className="flex justify-end animate-fade-in">
                                <div className="chat-bubble user-bubble inline-block">
                                    {turn.text}
                                </div>
                            </div>
                        );
                    } else { // Fitto's turn
                        const isCurrentAudio = currentlyPlayingId === turn.id.toString();
                        const avatarState: FittoState = turn.state === 'thinking' 
                            ? 'thinking' 
                            : turn.state === 'error' 
                                ? 'encouraging' 
                                : (isFittoSpeaking && isCurrentAudio ? 'speaking' : 'idle');

                        return (
                            <div key={`${turn.id}-${turn.state || 'final'}`} className="flex items-end space-x-3 animate-fade-in">
                                <div className="flex-shrink-0 self-start">
                                    <FittoAvatar state={avatarState} size={40} />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-end gap-2">
                                    {turn.state === 'thinking' ? (
                                        <div className="chat-bubble fitto-bubble inline-block">
                                            <div className="typing-indicator"><span></span><span></span><span></span></div>
                                        </div>
                                    ) : turn.state === 'error' ? (
                                        <div role="status" className="p-3 text-sm bg-status-danger text-status-danger rounded-lg">
                                            {turn.text}
                                        </div>
                                    ) : (
                                        <div className="chat-bubble fitto-bubble">
                                            <p className="text-text-primary">{turn.text}</p>
                                        </div>
                                    )}
                                    {!turn.state && turn.text && (
                                        <div className="flex-shrink-0">
                                            {(!isFittoSpeaking || !isCurrentAudio) ? (
                                                <button onClick={() => playFittoResponse(turn.text, turn.id.toString())} className="p-2 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-200 transition" aria-label="Play audio response"><PlayCircleIcon className="h-5 w-5"/></button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={isPaused ? resume : pause} className="p-2 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-200 transition" aria-label={isPaused ? "Resume audio" : "Pause audio"}>{isPaused ? <PlayCircleIcon className="h-5 w-5"/> : <PauseCircleIcon className="h-5 w-5"/>}</button>
                                                    <button onClick={stopFittoResponse} className="p-2 rounded-full bg-slate-600 hover:bg-red-800/50 text-slate-200 hover:text-red-400 transition" aria-label="Stop speaking"><StopCircleIcon className="h-5 w-5"/></button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                  </div>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>

            <form onSubmit={handleFormSubmit} className="flex items-center gap-3 pt-4 border-t border-border">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleFormSubmit(e); }}
                  placeholder={isListening ? "Listening..." : t('askQuestionPlaceholder')}
                  className="w-full"
                  rows={1}
                  disabled={isSubmitting}
                />
                 {isSupported && (
                    <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        className={`flex-shrink-0 p-2.5 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                        }`}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                    >
                        <MicrophoneIcon className="h-5 w-5" />
                    </button>
                )}
                <button 
                  type="submit" 
                  className="flex-shrink-0 p-2.5 btn-accent" 
                  disabled={isSubmitting || (!questionText.trim() && !isListening)}
                  aria-label={t('submitQuestion')}
                >
                  {isSubmitting ? <LoadingSpinner /> : <PaperAirplaneIcon className="h-5 w-5" />}
                </button>
            </form>
        </div>
    );
  };


  return (
    <div className="relative concept-view-card not-prose">
      {progressStatus === 'master' && (
        <div className="absolute top-3 right-3 bg-green-900/50 text-green-300 font-bold px-3 py-1 text-xs rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in z-10">
            <TrophyIcon className="h-4 w-4" />
            {t('masteryBadge')}
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-text-primary flex items-center">
            <SubjectIcon className="h-7 w-7 text-primary mr-3 flex-shrink-0" />
            {concept.conceptTitle}
        </h3>
      </div>
      
      <div className="prose prose-lg max-w-none prose-invert mb-4"><StructuredText text={concept.explanation} /></div>
      
      <div className="bg-primary-light border-l-4 border-primary/50 p-4 rounded-r-lg mb-4">
        <h4 className="font-semibold text-primary-dark flex items-center mb-2">
            <BeakerIcon className="h-5 w-5 mr-2" />
            {t('stemConnection')}
        </h4>
        <div className="prose prose-lg max-w-none prose-invert"><StructuredText text={concept.realWorldExample} /></div>
      </div>
      
      <div className="mt-6 integrated-practice-block">
        {progressStatus !== 'master' ? (
            showPractice ? (
                <PracticeExercises
                    concept={concept}
                    grade={grade}
                    subject={subject}
                    chapter={chapter}
                    language={language}
                    onResult={(score, correctCount) => {
                       handleMastered(score, correctCount);
                       setShowPractice(false);
                    }}
                />
            ) : (
                 <div className="text-center">
                    <button
                        onClick={() => setShowPractice(true)}
                        className="btn-accent"
                    >
                        <PencilSquareIcon className="h-5 w-5 mr-2" />
                        {t('practiceThisConcept')}
                    </button>
                </div>
            )
        ) : (
             <div className="text-center p-4 bg-status-success rounded-lg text-status-success font-semibold flex items-center justify-center gap-2">
                <CheckCircleSolid className="h-6 w-6" />
                {t('mastered')}
            </div>
        )}
      </div>

       {/* New "Deeper Learning" Section */}
       <div className="mt-6 pt-6 border-t border-dashed border-border">
            <h4 className="text-lg font-bold text-text-primary flex items-center mb-4">
               <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
               Deeper Learning & Practice
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SectionLoaderButton 
                    sectionKey="categorizedProblems" 
                    label={t('loadPracticeProblems')} 
                    isLoaded={!!learningModule.categorizedProblems}
                    isLoading={isLoadingSection('categorizedProblems')}
                    onLoad={() => onLoadSection('categorizedProblems')}
                />
            </div>
       </div>


       {/* Q&A Section */}
      <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-lg font-bold text-text-primary flex items-center mb-4">
             <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
             {t('askFitto')}
          </h4>
          {renderQnA()}
      </div>
    </div>
  );
});

// New Component for Lazy-Loading Buttons
const SectionLoaderButton: React.FC<{
    sectionKey: keyof LearningModule;
    label: string;
    isLoaded: boolean;
    isLoading: boolean;
    onLoad: () => void;
}> = ({ sectionKey, label, isLoaded, isLoading, onLoad }) => {
    if (isLoaded) {
        return (
            <div className="p-3 text-center bg-status-success rounded-lg font-semibold text-sm">
                {label} Loaded
            </div>
        );
    }
    return (
        <button
            onClick={onLoad}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary font-semibold hover:bg-bg-primary transition disabled:opacity-50"
        >
            {isLoading ? <LoadingSpinner /> : label}
        </button>
    );
};


export default ConceptCard;