import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Concept, Student, Grade, Subject, Chapter, StudentQuestion, FittoResponse } from '../types';
import { BeakerIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, MicrophoneIcon, PaperAirplaneIcon, PencilSquareIcon, StopCircleIcon, TrophyIcon, PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/solid';
import { saveStudentQuestion, updateStudentQuestion } from '../services/pineconeService';
import { getFittoAnswer } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

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
  language: string;
  progressStatus: 'not-started' | 'in-progress' | 'mastered';
  onMarkAsInProgress: () => void;
  onConceptMastered: (conceptTitle: string) => void;
  renderText: (text: string) => React.ReactNode;
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
        case 'mastered':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><CheckCircleSolid className="h-4 w-4 mr-1"/>{t('mastered')}</span>;
        case 'in-progress':
            return <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"><ClockIcon className="h-4 w-4 mr-1"/>{t('inProgress')}</span>;
        default:
            return <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{t('notStarted')}</span>;
    }
}

const ConceptCard: React.FC<ConceptCardProps> = React.memo(({ concept, grade, subject, chapter, language, progressStatus, onMarkAsInProgress, onConceptMastered, renderText }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const student = currentUser!;
  
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
        const response = await getFittoAnswer(newQuestion, language);
        
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

  const handleMastered = useCallback(() => {
    onConceptMastered(concept.conceptTitle);
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
            <div ref={chatHistoryRef} className="space-y-4 h-72 overflow-y-auto pr-2 rounded-lg bg-white dark:bg-slate-900/50 p-3 border border-slate-200 dark:border-slate-700">
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
                                        <div role="status" className="p-3 text-sm bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-lg">
                                            {turn.text}
                                        </div>
                                    ) : (
                                        <div className="chat-bubble fitto-bubble">
                                            <p className="text-slate-700 dark:text-slate-200">{turn.text}</p>
                                        </div>
                                    )}
                                    {!turn.state && turn.text && (
                                        <div className="flex-shrink-0">
                                            {(!isFittoSpeaking || !isCurrentAudio) ? (
                                                <button onClick={() => playFittoResponse(turn.text, turn.id.toString())} className="p-2 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-primary-light text-slate-600 dark:text-slate-200 hover:text-primary-dark transition" aria-label="Play audio response"><PlayCircleIcon className="h-5 w-5"/></button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={isPaused ? resume : pause} className="p-2 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-primary-light text-slate-600 dark:text-slate-200 hover:text-primary-dark transition" aria-label={isPaused ? "Resume audio" : "Pause audio"}>{isPaused ? <PlayCircleIcon className="h-5 w-5"/> : <PauseCircleIcon className="h-5 w-5"/>}</button>
                                                    <button onClick={stopFittoResponse} className="p-2 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-red-100 dark:hover:bg-red-800/50 text-slate-600 dark:text-slate-200 hover:text-red-500 dark:hover:text-red-400 transition" aria-label="Stop speaking"><StopCircleIcon className="h-5 w-5"/></button>
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

            <form onSubmit={handleFormSubmit} className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleFormSubmit(e); }}
                  placeholder={isListening ? "Listening..." : t('askQuestionPlaceholder')}
                  className="w-full flex-grow p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition"
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
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500'
                        }`}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                    >
                        <MicrophoneIcon className="h-5 w-5" />
                    </button>
                )}
                <button 
                  type="submit" 
                  className="flex-shrink-0 p-2.5 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed" 
                  style={{backgroundColor: 'rgb(var(--c-primary))'}}
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
    <div className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-shadow hover:shadow-md not-prose">
      {progressStatus === 'mastered' && (
        <div className="absolute top-3 right-3 bg-green-500 text-white font-bold px-3 py-1 text-xs rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in z-10">
            <TrophyIcon className="h-4 w-4" />
            {t('masteryBadge')}
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <SubjectIcon className="h-7 w-7 text-primary mr-3 flex-shrink-0" style={{color: 'rgb(var(--c-primary))'}} />
            {concept.conceptTitle}
        </h3>
        <ProgressBadge status={progressStatus} />
      </div>
      
      <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300 mb-4"><StructuredText text={concept.explanation} renderText={renderText} /></div>
      
       {progressStatus === 'not-started' && (
        <div className="text-right mb-4">
            <button
                onClick={onMarkAsInProgress}
                className="px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition shadow-sm"
            >
                {t('markAsUnderstood')}
            </button>
        </div>
      )}

      <div className="bg-primary-light border-l-4 border-primary/50 p-4 rounded-r-lg mb-4" style={{backgroundColor: 'rgb(var(--c-primary-light))', borderColor: 'rgba(var(--c-primary), 0.5)'}}>
        <h4 className="font-semibold text-primary-dark flex items-center mb-2" style={{color: 'rgb(var(--c-primary-dark))'}}>
            <BeakerIcon className="h-5 w-5 mr-2" />
            {t('stemConnection')}
        </h4>
        <div className="text-primary-dark/80 prose prose-lg max-w-none prose-indigo dark:prose-invert" style={{color: 'rgba(var(--c-primary-dark), 0.8)'}}><StructuredText text={concept.realWorldExample} renderText={renderText} /></div>
      </div>
      
      <div className="mt-6">
        {showPractice ? (
            <PracticeExercises
                concept={concept}
                grade={grade}
                subject={subject}
                chapter={chapter}
                language={language}
                onResult={(score) => {
                    if (score >= 75) { // Assuming 75% is mastery
                        handleMastered();
                    }
                    setShowPractice(false);
                }}
            />
        ) : (
             <div className="text-center">
                <button
                    onClick={() => setShowPractice(true)}
                    className="inline-flex items-center px-6 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
                    style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
                >
                    <PencilSquareIcon className="h-5 w-5 mr-2" />
                    {t('practiceThisConcept')}
                </button>
            </div>
        )}
      </div>

       {/* Q&A Section */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center mb-4">
             <SparklesIcon className="h-6 w-6 mr-2 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
             {t('askFitto')}
          </h4>
          {renderQnA()}
      </div>
    </div>
  );
});

export default ConceptCard;