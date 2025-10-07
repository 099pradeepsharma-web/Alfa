import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, ChatMessage } from '../types';
import { Chat } from '@google/genai';
import { useLanguage } from '../contexts/Language-context';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTTS } from '../hooks/useTTS';
import { createGeneralChatbot } from '../services/geminiService';
import FittoAvatar, { FittoState } from '../components/FittoAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, MicrophoneIcon, PaperAirplaneIcon, StopCircleIcon, PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/solid';

interface AIChatbotScreenProps {
  student: Student;
  onBack: () => void;
}

const AIChatbotScreen: React.FC<AIChatbotScreenProps> = ({ student, onBack }) => {
    const { t, language } = useLanguage();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(true);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    const { isSpeaking: isFittoSpeaking, isPaused, currentlyPlayingId, play: playFittoResponse, pause, resume, stop: stopFittoResponse } = useTTS();

    // Initialize chat on mount
    useEffect(() => {
        if (student) {
            const chatSession = createGeneralChatbot(student, language);
            setChat(chatSession);
        }
    }, [student, language]);

    const handleSendMessage = useCallback(async (text: string) => {
        const trimmedText = text.trim();
        if (!trimmedText || isThinking || !chat) return;

        setIsThinking(true);
        if (isFittoSpeaking) stopFittoResponse();

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmedText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        try {
            const responseStream = await chat.sendMessageStream({ message: trimmedText });
            let fullResponse = '';
            const modelMessageId = `model-${Date.now()}`;
            
            setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', state: 'thinking' }]);

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullResponse } : m));
                }
            }
            
            setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, state: undefined } : m));
        } catch (err: any) {
            console.error("Chatbot failed:", err);
            const errorMessage = { id: `err-${Date.now()}`, role: 'model' as const, text: "I'm having trouble connecting right now. Please try again in a moment.", state: 'error' as const };
            setMessages(prev => [...prev.filter(m => m.state !== 'thinking'), errorMessage]);
        } finally {
            setIsThinking(false);
        }
    }, [chat, isThinking, isFittoSpeaking, stopFittoResponse]);
    
    // Initial greeting
    useEffect(() => {
        if (chat) {
            setMessages([{ id: 'initial-greeting', role: 'model', text: t('aiChatbotWelcome') }]);
            setIsThinking(false);
        }
    }, [chat, t]);

    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition({ onEnd: handleSendMessage });

    useEffect(() => { setInputValue(transcript); }, [transcript]);
    useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isListening) { stopListening(); } else { handleSendMessage(inputValue); }
    };
    
    if (!student) return null;

    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            <div className="flex-shrink-0 dashboard-highlight-card p-4 rounded-b-none border-b border-border">
                <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-2" style={{color: 'rgb(var(--c-primary))'}}>
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToDashboard')}
                </button>
                <div className="flex items-center gap-3">
                    <FittoAvatar state={isThinking ? 'thinking' : (isFittoSpeaking ? 'speaking' : 'idle')} size={48} />
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">{t('aiChatbotTitle')}</h1>
                        <p className="text-text-secondary text-sm">{t('aiChatbotDescription')}</p>
                    </div>
                </div>
            </div>

            <div ref={chatHistoryRef} className="flex-grow p-4 space-y-6 overflow-y-auto bg-slate-900/50">
                {messages.map((msg) => {
                    if (msg.role === 'user') {
                        return (
                             <div key={msg.id} className="flex justify-end animate-fade-in">
                                <div className="chat-bubble user-bubble inline-block">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    } else { // Fitto's turn
                        const isCurrentAudio = currentlyPlayingId === msg.id;
                        const avatarState: FittoState = msg.state === 'thinking' 
                            ? 'thinking' 
                            : msg.state === 'error' 
                                ? 'encouraging' 
                                : (isFittoSpeaking && isCurrentAudio ? 'speaking' : 'idle');
                        return (
                            <div key={`${msg.id}-${msg.state || 'final'}`} className="flex items-end space-x-3 animate-fade-in">
                                <div className="flex-shrink-0 self-start">
                                    <FittoAvatar state={avatarState} size={40} />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-end gap-2">
                                    {msg.state === 'thinking' ? (
                                        <div className="chat-bubble fitto-bubble inline-block">
                                            <div className="typing-indicator"><span></span><span></span><span></span></div>
                                        </div>
                                    ) : msg.state === 'error' ? (
                                        <div role="status" className="p-3 text-sm bg-red-900/50 text-red-300 rounded-lg">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <div className="chat-bubble fitto-bubble">
                                            <p className="text-text-primary whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    )}
                                    {!msg.state && msg.text && (
                                        <div className="flex-shrink-0">
                                            {(!isFittoSpeaking || !isCurrentAudio) ? (
                                                <button onClick={() => playFittoResponse(msg.text, msg.id)} className="p-2 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-200 transition" aria-label="Play audio response"><PlayCircleIcon className="h-5 w-5"/></button>
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
                        )
                    }
                })}
            </div>
            
            <div className="flex-shrink-0 p-4 dashboard-highlight-card rounded-t-none border-t border-border">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFormSubmit(e); } }}
                        placeholder={isListening ? "Listening..." : t('aiChatbotPlaceholder')}
                        className="w-full flex-grow p-3 resize-none"
                        rows={1}
                        disabled={isThinking}
                    />
                    {isSupported && (
                        <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            className={`flex-shrink-0 p-3 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                isListening 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                            }`}
                            aria-label={isListening ? "Stop listening" : "Start listening"}
                            disabled={isThinking}
                        >
                            <MicrophoneIcon className="h-6 w-6" />
                        </button>
                    )}
                    <button 
                        type="submit" 
                        className="flex-shrink-0 p-3 btn-accent"
                        disabled={isThinking || (!inputValue.trim() && !isListening)}
                        aria-label={t('submitQuestion')}
                    >
                        {isThinking && messages.some(m => m.state === 'thinking') ? <LoadingSpinner /> : <PaperAirplaneIcon className="h-6 w-6" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatbotScreen;