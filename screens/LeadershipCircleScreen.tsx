import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, UserGroupIcon, PaperAirplaneIcon, LinkIcon, ShieldExclamationIcon, FlagIcon } from '@heroicons/react/24/solid';
import { Student } from '../types';
import { getLeadershipCircleStatus } from '../services/pineconeService';
import LoadingSpinner from '../components/LoadingSpinner';

interface LeadershipCircleScreenProps {
  student: Student;
  onBack: () => void;
}

const LeadershipCircleScreen: React.FC<LeadershipCircleScreenProps> = ({ student, onBack }) => {
    const { t } = useLanguage();
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    const [isConsentGiven, setIsConsentGiven] = useState<boolean | null>(null);
    const [reportedMessages, setReportedMessages] = useState<Set<number>>(new Set());

    const [messages, setMessages] = useState([
        { id: 1, author: 'Liam (UK)', avatar: 'https://i.pravatar.cc/150?u=liam', text: "Hey everyone! Looking forward to working on this. From what we learned in school, the British Empire brought a lot of infrastructure and a unified legal system to India. What's the general perspective taught in your schools?" },
        { id: 2, author: 'Sophie (UK)', avatar: 'https://i.pravatar.cc/150?u=sophie', text: "I agree with Liam. We've read about the investments in railways and administration. But I am also curious to learn about the social impact from your side." },
    ]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const checkConsent = async () => {
            if (student) {
                const status = await getLeadershipCircleStatus(student.id);
                setIsConsentGiven(status);
            }
        };
        checkConsent();
    }, [student]);

    const handleReportMessage = (messageId: number) => {
        if (window.confirm("Are you sure you want to report this message for review? This action is confidential.")) {
            setReportedMessages(prev => new Set(prev).add(messageId));
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !student) return;

        const userMessage = {
            id: Date.now(),
            author: 'You',
            avatar: student.avatarUrl,
            text: newMessage.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
    };
    
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);
    
    const sharedResources = [
        { title: t('resource1Title'), desc: t('resource1Desc'), url: '#' },
        { title: t('resource2Title'), desc: t('resource2Desc'), url: '#' },
    ];

    if (isConsentGiven === null) {
        return (
             <div className="flex flex-col items-center justify-center h-96">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary">Checking permissions...</p>
            </div>
        );
    }
    
    if (!isConsentGiven) {
        return (
            <div className="animate-fade-in">
                <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToDashboard')}
                </button>
                <div className="mt-6 dashboard-highlight-card p-8 text-center">
                    <ShieldExclamationIcon className="h-16 w-16 mx-auto text-amber-400" />
                    <h2 className="text-2xl font-bold text-text-primary mt-4">Access Restricted</h2>
                    <p className="text-text-secondary mt-2 max-w-md mx-auto">
                        The Leadership Circle involves collaboration with students from around the world. To ensure safety, this feature requires parental consent.
                    </p>
                    <p className="mt-4 font-semibold text-text-primary">Please ask your parent to enable access from their Parent Dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center">
                    <UserGroupIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('leadershipCircleTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-3xl mx-auto">
                        {t('leadershipCircleDesc')}
                    </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                         <h3 className="text-2xl font-bold text-text-primary">{t('pilotProjectTitle')}</h3>
                         <p className="text-text-secondary mt-1">{t('pilotProjectDesc')}</p>

                         <div role="alert" className="mt-4 p-3 bg-red-900/20 text-red-300 border border-red-700/50 rounded-lg text-sm">
                             {t('moderationNotice')}
                         </div>

                        {/* Chat window */}
                        <div ref={chatHistoryRef} className="mt-6 h-96 overflow-y-auto pr-2 rounded-lg bg-slate-900/50 p-3 border border-border">
                            {messages.map(msg => (
                                <div key={msg.id} className={`group flex items-end gap-2 my-3 ${msg.author === 'You' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <img src={msg.avatar} alt={msg.author} className="h-8 w-8 rounded-full flex-shrink-0" />
                                    <div className={`chat-bubble ${msg.author === 'You' ? 'user-bubble' : 'fitto-bubble'}`}>
                                        {msg.author !== 'You' && <p className="font-bold text-sm" style={{color: 'rgb(var(--c-primary))'}}>{msg.author}</p>}
                                        <p className="text-text-primary text-base">{msg.text}</p>
                                    </div>
                                    {msg.author !== 'You' && (
                                        <div className="flex-shrink-0 self-center">
                                            {reportedMessages.has(msg.id) ? (
                                                <span className="text-xs font-semibold text-text-secondary animate-fade-in">Reported</span>
                                            ) : (
                                                <button onClick={() => handleReportMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition p-1 text-text-secondary hover:text-red-400" title="Report message">
                                                    <FlagIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Chat input */}
                        <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-3">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('chatPlaceholder')}
                                className="w-full"
                            />
                            <button type="submit" className="p-3 btn-accent flex-shrink-0" disabled={!newMessage.trim()}>
                                <PaperAirplaneIcon className="h-5 w-5" />
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-1">
                        <h3 className="text-2xl font-bold text-text-primary">{t('sharedResourcesTitle')}</h3>
                        <div className="space-y-3 mt-4">
                            {sharedResources.map(res => (
                                <a key={res.title} href={res.url} target="_blank" rel="noopener noreferrer" className="command-card block p-4 rounded-xl">
                                    <p className="font-bold text-text-primary flex items-center gap-2"><LinkIcon className="h-4 w-4"/> {res.title}</p>
                                    <p className="text-xs text-text-secondary mt-1">{res.desc}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadershipCircleScreen;