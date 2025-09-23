import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, UsersIcon, BookOpenIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { MOCK_PEER_EXPLANATIONS } from '../data/peerPedia';
import { PeerExplanation, Subject, Chapter, Concept } from '../types';
import { getCurriculum } from '../services/curriculumService';
import { LearningModule } from '../types';
import * as contentService from '../services/contentService';
import LoadingSpinner from '../components/LoadingSpinner';


interface PeerPediaScreenProps {
  onBack: () => void;
}

const PeerPediaScreen: React.FC<PeerPediaScreenProps> = ({ onBack }) => {
    const { t, tCurriculum } = useLanguage();
    const { currentUser } = useAuth();

    const [curriculum, setCurriculum] = React.useState<any[]>([]);
    const [explanations, setExplanations] = useState<PeerExplanation[]>(MOCK_PEER_EXPLANATIONS);

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
    
    const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
    const [isLoadingModule, setIsLoadingModule] = useState(false);

    const [newExplanationText, setNewExplanationText] = useState('');

    React.useEffect(() => {
        getCurriculum().then(data => {
            const studentGrade = currentUser?.grade || 'Grade 10';
            const gradeData = data.find(g => g.level === studentGrade);
            if (gradeData) {
                setCurriculum(gradeData.subjects);
            }
        });
    }, [currentUser]);

    React.useEffect(() => {
        const fetchModule = async () => {
            if (selectedChapter && selectedSubject && currentUser) {
                setIsLoadingModule(true);
                const { content } = await contentService.getChapterContent(currentUser.grade, selectedSubject.name, selectedChapter.title, currentUser, 'en');
                setLearningModule(content);
                setIsLoadingModule(false);
            }
        };
        fetchModule();
    }, [selectedChapter, selectedSubject, currentUser]);

    const handleSubjectSelect = (subject: Subject) => {
        setSelectedSubject(subject);
        setSelectedChapter(null);
        setSelectedConcept(null);
        setLearningModule(null);
    };

    const handleChapterSelect = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setSelectedConcept(null);
    };

    const filteredExplanations = useMemo(() => 
        explanations.filter(e => 
            e.subject === selectedSubject?.name && 
            e.chapter === selectedChapter?.title &&
            e.concept === selectedConcept?.conceptTitle
        ), [explanations, selectedSubject, selectedChapter, selectedConcept]);
        
    const handleSubmitExplanation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExplanationText.trim() || !currentUser || !selectedSubject || !selectedChapter || !selectedConcept) return;

        const newExplanation: PeerExplanation = {
            id: `peer-${Date.now()}`,
            studentId: currentUser.id,
            studentName: currentUser.name,
            studentAvatarUrl: currentUser.avatarUrl,
            subject: selectedSubject.name,
            chapter: selectedChapter.title,
            concept: selectedConcept.conceptTitle,
            explanationText: newExplanationText.trim(),
            submittedDate: new Date().toISOString()
        };
        setExplanations(prev => [newExplanation, ...prev]);
        setNewExplanationText('');
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    <UsersIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{t('peerPediaTitleScreen')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">{t('peerPediaDescScreen')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Subjects */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md h-fit">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2 mb-2">{t('browseBySubject')}</h3>
                        <ul className="space-y-1">
                            {curriculum.map((sub: Subject) => (
                                <li key={sub.name}><button onClick={() => handleSubjectSelect(sub)} className={`w-full text-left p-2 rounded-md font-semibold text-sm transition ${selectedSubject?.name === sub.name ? 'bg-primary-light text-primary-dark' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{tCurriculum(sub.name)}</button></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: Chapters & Concepts */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md h-fit">
                        {selectedSubject && (
                            <>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2 mb-2">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                                <ul className="space-y-1">
                                    {selectedSubject.chapters.map(chap => (
                                        <li key={chap.title}>
                                            <button onClick={() => handleChapterSelect(chap)} className={`w-full text-left p-2 rounded-md font-semibold text-sm transition ${selectedChapter?.title === chap.title ? 'bg-primary-light text-primary-dark' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{tCurriculum(chap.title)}</button>
                                            {selectedChapter?.title === chap.title && (
                                                <div className="pl-4 mt-1">
                                                {isLoadingModule ? <LoadingSpinner /> : (
                                                    <ul className="space-y-1 border-l-2 border-slate-200 dark:border-slate-600">
                                                        {learningModule?.keyConcepts.map(con => (
                                                            <li key={con.conceptTitle}><button onClick={() => setSelectedConcept(con)} className={`w-full text-left p-1.5 pl-3 text-xs rounded-r-md transition ${selectedConcept?.conceptTitle === con.conceptTitle ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{tCurriculum(con.conceptTitle)}</button></li>
                                                        ))}
                                                    </ul>
                                                )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Column 3: Explanations */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md h-fit">
                        {!selectedConcept ? <p className="text-slate-500 dark:text-slate-400 text-center p-4">{t('selectConcept')}</p> : (
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2 mb-4">{t('peerExplanations')} "{tCurriculum(selectedConcept.conceptTitle)}"</h3>
                                
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    {filteredExplanations.length > 0 ? filteredExplanations.map(exp => (
                                        <div key={exp.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <img src={exp.studentAvatarUrl} alt={exp.studentName} className="h-7 w-7 rounded-full mr-2" />
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{exp.studentName}</p>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{exp.explanationText}</p>
                                        </div>
                                    )) : <p className="text-slate-500 dark:text-slate-400 text-center text-sm p-4">{t('noExplanations')}</p>}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('shareYourKnowledge')}</h4>
                                    <form onSubmit={handleSubmitExplanation}>
                                        <textarea value={newExplanationText} onChange={e => setNewExplanationText(e.target.value)} required rows={3} placeholder={t('yourExplanation')} className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 rounded-md focus:ring-1 focus:ring-primary"></textarea>
                                        <button type="submit" className="mt-2 w-full text-sm py-1.5 px-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition">{t('submitExplanation')}</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeerPediaScreen;
