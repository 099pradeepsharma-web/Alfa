import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, SparklesIcon, DocumentTextIcon, LightBulbIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, BriefcaseIcon, CheckCircleIcon, TrophyIcon, PaperAirplaneIcon, MicrophoneIcon, StopCircleIcon, PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/solid';
import { AptitudeQuestion, AptitudeTrait, CareerGuidance, Student, ChatMessage } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Chat } from '@google/genai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTTS } from '../hooks/useTTS';
import FittoAvatar, { FittoState } from '../components/FittoAvatar';

interface CareerGuidanceScreenProps {
  student: Student;
  onBack: () => void;
}

type ViewState = 'idle' | 'testing' | 'test_results' | 'viewing_guidance' | 'counseling';

// --- Aptitude Test Component ---
const AptitudeTest: React.FC<{ student: Student, onFinish: (results: any) => void }> = ({ student, onFinish }) => {
    const { t, language } = useLanguage();
    const [questions, setQuestions] = useState<AptitudeQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    useEffect(() => {
        const fetchTest = async () => {
            setIsLoading(true);
            const testQuestions = await geminiService.generateAptitudeTest(student.grade, language);
            setQuestions(testQuestions);
            setIsLoading(false);
        };
        fetchTest();
    }, [student.grade, language]);

    const handleAnswer = (option: string) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    };

    const handleNext = () => {
        if (currentIndex < (questions?.length || 0) - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Calculate and finish
            const results: Record<string, { correct: number, total: number }> = {};
            questions?.forEach((q, i) => {
                if (!results[q.trait]) results[q.trait] = { correct: 0, total: 0 };
                results[q.trait].total++;
                if (answers[i] === q.correctAnswer) {
                    results[q.trait].correct++;
                }
            });
            onFinish(results);
        }
    };
    
    if (isLoading) return <div className="flex flex-col items-center justify-center p-8"><LoadingSpinner /><p className="mt-2 font-semibold text-text-secondary">{t('generatingAptitudeTest')}</p></div>;
    if (!questions || questions.length === 0) return <p className="text-text-secondary">{t('errorOccurred')}</p>;
    
    const currentQ = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    return (
        <div className="p-6">
            <h3 className="text-2xl font-bold text-text-primary">{t('aptitudeTestHeader')}</h3>
            <div className="flex justify-between items-center my-2">
                <p className="font-semibold text-primary">{currentQ.trait}</p>
                <p className="font-semibold text-text-secondary">{currentIndex + 1} / {questions.length}</p>
            </div>
            <p className="font-semibold text-text-primary text-lg my-4">{currentQ.question}</p>
            <div className="space-y-3">
                {currentQ.options.map(opt => (
                    <button key={opt} onClick={() => handleAnswer(opt)} className={`w-full text-left p-3 rounded-lg border-2 transition ${answers[currentIndex] === opt ? 'bg-primary-light border-primary' : 'bg-bg-primary hover:border-primary/50'}`}>
                        {opt}
                    </button>
                ))}
            </div>
            <div className="mt-6 text-right">
                <button onClick={handleNext} disabled={!answers[currentIndex]} className="px-6 py-2 btn-accent disabled:opacity-50">
                    {isLastQuestion ? t('finishTest') : t('nextQuestion')}
                </button>
            </div>
        </div>
    );
};


// --- Main Screen ---
const CareerGuidanceScreen: React.FC<CareerGuidanceScreenProps> = ({ student, onBack }) => {
    const { t, language } = useLanguage();
    const [view, setView] = useState<ViewState>('idle');
    const [aptitudeResults, setAptitudeResults] = useState<{ scores: Record<string, { correct: number, total: number }>, summary: string } | null>(null);
    const [guidance, setGuidance] = useState<CareerGuidance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [counselorChat, setCounselorChat] = useState<Chat | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const { isSpeaking, isPaused, currentlyPlayingId, play, pause, resume, stop } = useTTS();

     useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatMessages]);


    const handleTestFinish = async (results: Record<string, { correct: number, total: number }>) => {
        setIsLoading(true);
        const summary = await geminiService.generateAptitudeTestSummary(results, language);
        setAptitudeResults({ scores: results, summary });
        setIsLoading(false);
        setView('test_results');
    };

    const handleViewGuidance = async () => {
        if (!student) return;
        setView('viewing_guidance');
        setIsLoading(true);
        const fetchedGuidance = await geminiService.generateStreamGuidance(student, aptitudeResults, language);
        setGuidance(fetchedGuidance);
        setIsLoading(false);
    };
    
    const handleStartCounseling = async () => {
        if (!student) return;
        setView('counseling');
        const chat = geminiService.createCareerCounselorChat(student, language);
        setCounselorChat(chat);

        const welcomeMessage: ChatMessage = { id: 'counselor-welcome', role: 'model', text: t('counselorWelcome') };
        setChatMessages([welcomeMessage]);
    };

    const handleSendChatMessage = async (text: string) => {
        const trimmedText = text.trim();
        if (!trimmedText || isThinking || !counselorChat) return;
        setIsThinking(true);
        if (isSpeaking) stop();

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmedText };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');

        const responseStream = await counselorChat.sendMessageStream({ message: trimmedText });
        let fullResponse = '';
        const modelMessageId = `model-${Date.now()}`;
        setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', state: 'thinking' }]);

        for await (const chunk of responseStream) {
            fullResponse += chunk.text;
            setChatMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullResponse } : m));
        }

        setChatMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, state: undefined } : m));
        setIsThinking(false);
    };

    if (!student) return null;

    const renderIdle = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FeatureCard title={t('aptitudeTestTitle')} description={t('aptitudeTestDesc')} icon={TrophyIcon} buttonText={t('startAptitudeTest')} onClick={() => setView('testing')} />
            <FeatureCard title={t('streamGuidanceTitle')} description={t('streamGuidanceDesc')} icon={LightBulbIcon} buttonText={t('viewStreamGuidance')} onClick={handleViewGuidance} />
            <FeatureCard title={t('careerCounselingTitle')} description={t('careerCounselingDesc')} icon={ChatBubbleLeftRightIcon} buttonText={t('startCounselingSession')} onClick={handleStartCounseling} />
        </div>
    );
    
    const renderTestResults = () => {
        if (!aptitudeResults) return null;
        const scores = aptitudeResults.scores;
        const strongestTrait = Object.keys(scores).reduce((a, b) => (scores[a].correct / scores[a].total) > (scores[b].correct / scores[b].total) ? a : b);
        return (
            <div className="text-center p-6 bg-bg-primary rounded-lg">
                <h3 className="text-2xl font-bold text-text-primary">{t('aptitudeResultsTitle')}</h3>
                {isLoading ? <LoadingSpinner/> : (
                    <>
                        <div className="my-4 p-4 bg-surface rounded-lg shadow">
                            <h4 className="font-semibold text-primary">{t('resultsSummary')}</h4>
                            <p className="italic text-text-secondary">"{aptitudeResults.summary}"</p>
                        </div>
                        <p className="font-semibold text-text-secondary">{t('strongestTrait')}: <span className="text-xl font-bold text-status-success">{strongestTrait}</span></p>
                        <div className="mt-6 flex gap-4 justify-center">
                            <button onClick={handleViewGuidance} className="px-5 py-2 btn-accent">{t('viewStreamGuidance')}</button>
                            <button onClick={() => setView('idle')} className="px-5 py-2 bg-border font-bold rounded-lg">{t('back')}</button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderGuidance = () => (
        <div>
            {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner /> <p className="ml-2 text-text-secondary">{t('generatingGuidance')}</p></div> : (
                guidance && <div className="space-y-6">
                    <p className="text-text-secondary">{guidance.introduction}</p>
                    {guidance.streamRecommendations.map(rec => (
                        <div key={rec.streamName} className="p-4 bg-bg-primary rounded-lg border border-border">
                            <h4 className="text-xl font-bold text-primary">{t(rec.streamName.toLowerCase())}</h4>
                            <p className="font-semibold my-2 text-text-primary">{t('recommendationReason')}</p>
                            <p className="italic text-text-secondary">"{rec.recommendationReason}"</p>
                            <h5 className="font-bold mt-4 text-text-primary">{t('suggestedCareers')}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {rec.suggestedCareers.map(career => (
                                    <div key={career.careerName} className="p-2 bg-surface rounded shadow-sm">
                                        <p className="font-semibold text-text-primary">{career.careerName}</p>
                                        <p className="text-xs text-text-secondary">{t('requiredSubjects')}: {career.requiredSubjects.join(', ')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <p className="text-text-secondary">{guidance.conclusion}</p>
                </div>
            )}
        </div>
    );
    
    const renderCounseling = () => (
        <div className="flex flex-col h-[calc(100vh-250px)]">
             <h3 className="text-2xl font-bold text-text-primary mb-4">{t('counselorChatTitle')}</h3>
            <div ref={chatHistoryRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-bg-primary rounded-t-lg border border-b-0 border-border">
                {chatMessages.map(msg => {
                    const isCurrentAudio = currentlyPlayingId === msg.id;
                    const avatarState: FittoState = isThinking ? 'thinking' : (isSpeaking && isCurrentAudio ? 'speaking' : 'idle');
                    return msg.role === 'user' ? (
                        <div key={msg.id} className="flex justify-end"><div className="chat-bubble user-bubble">{msg.text}</div></div>
                     ) : (
                         <div key={msg.id} className="flex items-end gap-2">
                            <FittoAvatar size={32} state={avatarState} />
                            {msg.state === 'thinking' ? <div className="chat-bubble fitto-bubble"><div className="typing-indicator"><span></span><span></span><span></span></div></div> : <div className="chat-bubble fitto-bubble">{msg.text}</div>}
                            {!msg.state && msg.text && (
                                <div className="flex-shrink-0">
                                    {(!isSpeaking || !isCurrentAudio) ? (
                                        <button onClick={() => play(msg.text, msg.id)} className="p-2 rounded-full bg-surface hover:bg-bg-primary text-text-secondary transition" aria-label="Play audio response"><PlayCircleIcon className="h-5 w-5"/></button>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <button onClick={isPaused ? resume : pause} className="p-2 rounded-full bg-surface hover:bg-bg-primary text-text-secondary transition" aria-label={isPaused ? "Resume audio" : "Pause audio"}>{isPaused ? <PlayCircleIcon className="h-5 w-5"/> : <PauseCircleIcon className="h-5 w-5"/>}</button>
                                            <button onClick={stop} className="p-2 rounded-full bg-surface hover:bg-bg-primary text-text-secondary hover:text-status-danger transition" aria-label="Stop speaking"><StopCircleIcon className="h-5 w-5"/></button>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                     )
                })}
            </div>
             <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(chatInput); }} className="p-4 bg-surface rounded-b-lg border border-t-0 border-border">
                 <div className="flex items-center gap-2">
                    <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={t('typeYourQuestion')} className="w-full p-2" />
                    <button type="submit" disabled={isThinking || !chatInput} className="p-2 btn-accent disabled:opacity-50"><PaperAirplaneIcon className="h-5 w-5"/></button>
                 </div>
            </form>
        </div>
    );

    const renderContent = () => {
        switch(view) {
            case 'testing': return <AptitudeTest student={student} onFinish={handleTestFinish} />;
            case 'test_results': return renderTestResults();
            case 'viewing_guidance': return renderGuidance();
            case 'counseling': return renderCounseling();
            case 'idle':
            default: return renderIdle();
        }
    };
    
    return (
        <div className="animate-fade-in">
            <button onClick={view === 'idle' ? onBack : () => setView('idle')} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {view === 'idle' ? t('backToDashboard') : t('back')}
            </button>

            <div className="dashboard-highlight-card p-8">
                {view === 'idle' && (
                    <div className="text-center mb-8">
                        <BriefcaseIcon className="h-12 w-12 mx-auto text-primary" />
                        <h2 className="text-3xl font-bold text-text-primary mt-2">{t('careerGuidanceTitle')}</h2>
                        <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('careerGuidanceDesc')}</p>
                    </div>
                )}
                {renderContent()}
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ title: string, description: string, icon: React.ElementType, buttonText: string, onClick: () => void }> = ({ title, description, icon: Icon, buttonText, onClick }) => (
    <div className="bg-bg-primary p-6 rounded-xl border border-border flex flex-col items-center text-center">
        <div className="p-3 bg-primary-light rounded-full mb-3">
            <Icon className="h-8 w-8 text-primary-dark" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="text-text-secondary mt-1 text-sm flex-grow">{description}</p>
        <button onClick={onClick} className="mt-4 w-full py-2 px-4 btn-accent">{buttonText}</button>
    </div>
);


export default CareerGuidanceScreen;