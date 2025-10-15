import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { 
    ArrowLeftIcon, UsersIcon, BookOpenIcon, SparklesIcon, ChevronRightIcon,
    ArrowUpCircleIcon, ArrowDownCircleIcon, FlagIcon
} from '@heroicons/react/24/solid';
import { MOCK_PEER_EXPLANATIONS } from '../data/peerPedia';
import { PeerExplanation, Subject, Chapter, Concept, Student } from '../types';
import { getCurriculum } from '../services/curriculumService';
import { LearningModule } from '../types';
import * as contentService from '../services/contentService';
import LoadingSpinner from '../components/LoadingSpinner';


interface PeerPediaScreenProps {
  student: Student;
  onBack: () => void;
}

const PeerPediaScreen: React.FC<PeerPediaScreenProps> = ({ student, onBack }) => {
    const { t, tCurriculum, language } = useLanguage();

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
            const studentGrade = student?.grade || 'Grade 10';
            const gradeData = data.find(g => g.level === studentGrade);
            if (gradeData) {
                setCurriculum(gradeData.subjects);
            }
        });
    }, [student]);

    React.useEffect(() => {
        const fetchModule = async () => {
            if (selectedChapter && selectedSubject && student) {
                setIsLoadingModule(true);
                const { content } = await contentService.getChapterContent(student.grade, selectedSubject.name, selectedChapter, student, language);
                setLearningModule(content);
                setIsLoadingModule(false);
            }
        };
        fetchModule();
    }, [selectedChapter, selectedSubject, student, language]);

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

    const handleVote = (explanationId: string, voteType: 'up' | 'down') => {
        setExplanations(prevExplanations => 
            prevExplanations.map(exp => {
                if (exp.id === explanationId) {
                    const newUpvotes = [...exp.upvotes];
                    const newDownvotes = [...exp.downvotes];
                    const userId = student.id;

                    if (voteType === 'up') {
                        const downvoteIndex = newDownvotes.indexOf(userId);
                        if (downvoteIndex > -1) newDownvotes.splice(downvoteIndex, 1);

                        const upvoteIndex = newUpvotes.indexOf(userId);
                        if (upvoteIndex > -1) {
                            newUpvotes.splice(upvoteIndex, 1);
                        } else {
                            newUpvotes.push(userId);
                        }
                    } else { // voteType is 'down'
                        const upvoteIndex = newUpvotes.indexOf(userId);
                        if (upvoteIndex > -1) newUpvotes.splice(upvoteIndex, 1);

                        const downvoteIndex = newDownvotes.indexOf(userId);
                        if (downvoteIndex > -1) {
                            newDownvotes.splice(downvoteIndex, 1);
                        } else {
                            newDownvotes.push(userId);
                        }
                    }
                    return { ...exp, upvotes: newUpvotes, downvotes: newDownvotes };
                }
                return exp;
            })
        );
    };

    const handleFlag = (explanationId: string) => {
        if (window.confirm("Are you sure you want to flag this explanation as incorrect or unclear for review?")) {
            setExplanations(prevExplanations =>
                prevExplanations.map(exp => {
                    if (exp.id === explanationId && !exp.flags.includes(student.id)) {
                        return { ...exp, flags: [...exp.flags, student.id] };
                    }
                    return exp;
                })
            );
        }
    };

    const filteredExplanations = useMemo(() => 
        explanations
            .filter(e => 
                e.subject === selectedSubject?.name && 
                e.chapter === selectedChapter?.title &&
                e.concept === selectedConcept?.conceptTitle
            )
            .sort((a, b) => {
                const scoreA = a.upvotes.length - a.downvotes.length;
                const scoreB = b.upvotes.length - b.downvotes.length;
                return scoreB - scoreA;
            }), 
        [explanations, selectedSubject, selectedChapter, selectedConcept]
    );
        
    const handleSubmitExplanation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExplanationText.trim() || !student || !selectedSubject || !selectedChapter || !selectedConcept) return;

        const newExplanation: PeerExplanation = {
            id: `peer-${Date.now()}`,
            studentId: student.id,
            studentName: student.name,
            studentAvatarUrl: student.avatarUrl,
            subject: selectedSubject.name,
            chapter: selectedChapter.title,
            concept: selectedConcept.conceptTitle,
            explanationText: newExplanationText.trim(),
            submittedDate: new Date().toISOString(),
            upvotes: [],
            downvotes: [],
            flags: []
        };
        setExplanations(prev => [newExplanation, ...prev]);
        setNewExplanationText('');
    };

    const conceptsAsConcepts: Concept[] = useMemo(() => {
      if (!learningModule || !learningModule.coreConceptTraining) return [];
      return learningModule.coreConceptTraining.map(cct => ({
        conceptTitle: cct.title,
        explanation: cct.explanation,
        realWorldExample: '', // Not available in this structure
        diagramDescription: '' // Not available in this structure
      }));
    }, [learningModule]);


    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center mb-8">
                    <UsersIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('peerPediaTitleScreen')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('peerPediaDescScreen')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Subjects */}
                    <div className="bg-surface p-4 rounded-xl shadow-md h-fit">
                        <h3 className="font-bold text-text-primary border-b border-border pb-2 mb-2">{t('browseBySubject')}</h3>
                        <ul className="space-y-1">
                            {curriculum.map((sub: Subject) => (
                                <li key={sub.name}><button onClick={() => handleSubjectSelect(sub)} className={`w-full text-left p-2 rounded-md font-semibold text-sm transition ${selectedSubject?.name === sub.name ? 'bg-primary-light text-primary-dark' : 'hover:bg-bg-primary'}`}>{tCurriculum(sub.name)}</button></li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: Chapters & Concepts */}
                    <div className="bg-surface p-4 rounded-xl shadow-md h-fit">
                        {selectedSubject && (
                            <>
                                <h3 className="font-bold text-text-primary border-b border-border pb-2 mb-2">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                                <ul className="space-y-1">
                                    {selectedSubject.chapters.map(chap => (
                                        <li key={chap.title}>
                                            <button onClick={() => handleChapterSelect(chap)} className={`w-full text-left p-2 rounded-md font-semibold text-sm transition ${selectedChapter?.title === chap.title ? 'bg-primary-light text-primary-dark' : 'hover:bg-bg-primary'}`}>{tCurriculum(chap.title)}</button>
                                            {selectedChapter?.title === chap.title && (
                                                <div className="pl-4 mt-1">
                                                {isLoadingModule ? <LoadingSpinner /> : (
                                                    <ul className="space-y-1 border-l-2 border-border">
                                                        {conceptsAsConcepts.map(con => (
                                                            <li key={con.conceptTitle}><button onClick={() => setSelectedConcept(con)} className={`w-full text-left p-1.5 pl-3 text-xs rounded-r-md transition ${selectedConcept?.conceptTitle === con.conceptTitle ? 'bg-bg-primary' : 'hover:bg-bg-primary'}`}>{tCurriculum(con.conceptTitle)}</button></li>
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
                    <div className="bg-surface p-4 rounded-xl shadow-md h-fit">
                        {!selectedConcept ? <p className="text-text-secondary text-center p-4">{t('selectConcept')}</p> : (
                            <div>
                                <h3 className="font-bold text-text-primary border-b border-border pb-2 mb-4 flex items-center justify-between">
                                    <span>{t('peerExplanations')} "{tCurriculum(selectedConcept.conceptTitle)}"</span>
                                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">{filteredExplanations.length}</span>
                                </h3>
                                
                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    {filteredExplanations.length > 0 ? filteredExplanations.map(exp => {
                                        const score = exp.upvotes.length - exp.downvotes.length;
                                        const userUpvoted = exp.upvotes.includes(student.id);
                                        const userDownvoted = exp.downvotes.includes(student.id);
                                        const userFlagged = exp.flags.includes(student.id);

                                        return (
                                            <div key={exp.id} className="bg-bg-primary p-3 rounded-lg">
                                                <div className="flex items-center mb-2">
                                                    <img src={exp.studentAvatarUrl} alt={exp.studentName} className="h-7 w-7 rounded-full mr-2" />
                                                    <p className="font-bold text-text-primary text-sm">{exp.studentName}</p>
                                                </div>
                                                <p className="text-text-secondary text-sm whitespace-pre-wrap">{exp.explanationText}</p>
                                                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => handleVote(exp.id, 'up')} className={`flex items-center gap-1 text-sm font-semibold transition-colors ${userUpvoted ? 'text-status-success' : 'text-text-secondary hover:text-status-success'}`}>
                                                            <ArrowUpCircleIcon className="h-5 w-5" />
                                                            {exp.upvotes.length}
                                                        </button>
                                                        <button onClick={() => handleVote(exp.id, 'down')} className={`flex items-center gap-1 text-sm font-semibold transition-colors ${userDownvoted ? 'text-status-danger' : 'text-text-secondary hover:text-status-danger'}`}>
                                                            <ArrowDownCircleIcon className="h-5 w-5" />
                                                            {exp.downvotes.length}
                                                        </button>
                                                        <span className={`text-lg font-bold ${score > 0 ? 'text-status-success' : score < 0 ? 'text-status-danger' : 'text-text-secondary'}`}>{score}</span>
                                                    </div>
                                                    <button onClick={() => handleFlag(exp.id)} disabled={userFlagged} className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-status-danger disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <FlagIcon className="h-4 w-4" />
                                                        {userFlagged ? 'Reported' : 'Report'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-text-secondary text-center text-sm p-4">{t('noExplanations')}</p>}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-border">
                                    <h4 className="font-semibold text-text-primary mb-2">{t('shareYourKnowledge')}</h4>
                                    <form onSubmit={handleSubmitExplanation}>
                                        <textarea value={newExplanationText} onChange={e => setNewExplanationText(e.target.value)} required rows={3} placeholder={t('yourExplanation')} className="w-full text-sm p-2"></textarea>
                                        <button type="submit" className="mt-2 w-full text-sm py-1.5 px-3 btn-accent">{t('submitExplanation')}</button>
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