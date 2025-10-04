import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grade, Subject, Chapter, LearningModule, QuizQuestion, NextStepRecommendation, ChapterProgress, Student, Concept, PerformanceRecord } from '../types';
import * as contentService from '../services/contentService';
import { generateQuiz, generateNextStepRecommendation } from '../services/geminiService';
import { getChapterProgress, saveChapterProgress, savePerformanceRecord } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import PracticeExercises from './PracticeExercises';
import Quiz from './Quiz';
import Confetti from './Confetti';
import { RocketLaunchIcon, ArchiveBoxIcon, LightBulbIcon, ArrowPathIcon, ForwardIcon, CheckCircleIcon, BookOpenIcon, VariableIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon as ExclamationTriangleSolid, TrophyIcon as TrophySolid, BeakerIcon, GlobeAltIcon, LinkIcon, AcademicCapIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, LanguageIcon, SparklesIcon as SparklesSolid, MapIcon, PuzzlePieceIcon, CalculatorIcon, ScaleIcon, ShareIcon, CheckBadgeIcon, CpuChipIcon, SpeakerWaveIcon, FilmIcon, ChevronRightIcon, WrenchScrewdriverIcon, ChatBubbleLeftRightIcon, BoltIcon, ArrowDownTrayIcon, HeartIcon, BriefcaseIcon, XMarkIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { useTTS } from '../hooks/useTTS';
import { useAuth } from '../contexts/AuthContext';
import VideoSimulationPlayer from './VideoSimulationPlayer';
import VirtualLabPlayer from './VirtualLabPlayer';
import AdaptiveStoryPlayer from './AdaptiveStoryPlayer';
import InteractiveExplainerPlayer from './InteractiveExplainerPlayer';
import StructuredText from './StructuredText';

declare const mermaid: any;

interface ChapterViewProps {
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  student: Student;
  language: string;
  onBackToChapters: () => void;
  onBackToSubjects: () => void;
  onChapterSelect: (chapter: Chapter) => void;
  onStartTutorSession: (concepts: Concept[]) => void;
  onStartMicrolearningSession: (module: LearningModule) => void;
}

const getSentences = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];
    const sentences = text.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(Boolean);
};

const EducatorProfile: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="educator-profile-card">
            <img src="https://i.pravatar.cc/150?u=profalok" alt="Prof. Alok Sharma" className="h-16 w-16 rounded-full" />
            <div>
                <h3 className="text-lg font-bold text-text-primary">{t('educatorName')}</h3>
                <p className="text-sm text-text-secondary">{t('educatorBio')}</p>
            </div>
        </div>
    );
};

const MasteryMeter: React.FC<{ status: ChapterProgress[string]['status'] }> = ({ status }) => {
    const { t } = useLanguage();
    const statusMap = {
        locked: { text: t('masteryLocked'), className: 'locked' },
        novice: { text: t('masteryNovice'), className: 'novice' },
        competent: { text: t('masteryCompetent'), className: 'competent' },
        master: { text: t('masteryMaster'), className: 'master' },
    };
    const { text, className } = statusMap[status] || statusMap.locked;
    return <span className={`mastery-meter ${className}`}>{text}</span>;
};

export const ChapterView: React.FC<ChapterViewProps> = React.memo(({
  grade, subject, chapter, student, language, onBackToChapters, onBackToSubjects, onChapterSelect, onStartTutorSession, onStartMicrolearningSession
}) => {
    const { t, tCurriculum } = useLanguage();
    const { currentUser, updateStudentPoints } = useAuth();

    const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ChapterProgress>({});
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState<{ score: number; answers: { [key: number]: string } } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [nextStep, setNextStep] = useState<NextStepRecommendation | null>(null);
    const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
    const [showPractice, setShowPractice] = useState(false);
    const { isSupported: ttsSupported, isSpeaking, currentlyPlayingId, currentSentenceIndex, play: playTTS, pause: pauseTTS, resume: resumeTTS, stop: stopTTS } = useTTS();
    const chapterDbKey = useMemo(() => `progress-${grade.level}-${subject.name}-${chapter.title}`, [grade, subject, chapter]);
    
    // State for Concept-to-Mastery Engine modals
    const [showRemediation, setShowRemediation] = useState<Concept | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<Concept | null>(null);
    const [showTutorAlert, setShowTutorAlert] = useState<Concept | null>(null);
    const [activeRemediation, setActiveRemediation] = useState<string | null>(null);

    // New state for dynamic loading messages
    const [loadingMessage, setLoadingMessage] = useState(t('aiGeneratingLesson'));
    const wasLoading = useRef(false);

    // Effect to cycle through loading messages for better UX
    useEffect(() => {
        let interval: number | undefined;
        // Only start the interval if we are transitioning into a loading state
        if (isLoading && !wasLoading.current) {
            const messages = [
                t('loadingMessage1'),
                t('loadingMessage2'),
                t('loadingMessage3'),
                t('loadingMessage4'),
                t('loadingMessage5')
            ];
            let messageIndex = 0;
            setLoadingMessage(messages[0]);
            interval = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setLoadingMessage(messages[messageIndex]);
            }, 2500); // Change message every 2.5 seconds
        }
        
        // Update the ref to the current loading state for the next render
        wasLoading.current = isLoading;

        // Cleanup function
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading, t]);

    const renderTextWithTTS = useCallback((text: string, key: string) => {
        const sentences = getSentences(text);
        const isCurrentlyPlaying = isSpeaking && currentlyPlayingId === key;
        return <span>{sentences.map((sentence, index) => (
            <span key={index} className={isCurrentlyPlaying && currentSentenceIndex === index ? 'tts-highlight' : ''}>{sentence} </span>
        ))}</span>;
    }, [isSpeaking, currentlyPlayingId, currentSentenceIndex]);
    
    const handleProgressUpdate = useCallback(async (newProgress: ChapterProgress) => {
        setProgress(newProgress);
        await saveChapterProgress(chapterDbKey, newProgress, language);
    }, [chapterDbKey, language]);

    const loadChapter = useCallback(async () => {
        setIsLoading(true);
        setError(null); setQuizQuestions(null); setQuizResult(null); setNextStep(null);
        setShowQuiz(false); setShowPractice(false);
        if (currentUser) {
            try {
                const {content: moduleData} = await contentService.getChapterContent(grade.level, subject.name, chapter, currentUser, language);
                setLearningModule(moduleData);
                
                const concepts = moduleData?.keyConcepts || [];
                const initialProgress: ChapterProgress = {};
                concepts.forEach((c, index) => {
                    initialProgress[c.conceptTitle] = {
                        status: index === 0 ? 'novice' : 'locked',
                        score: 0,
                        failedAttempts: 0
                    };
                });
                
                const storedProgress = await getChapterProgress(chapterDbKey, language);
                const mergedProgress = { ...initialProgress, ...storedProgress };
                
                // Ensure all concepts from module exist in progress
                concepts.forEach(c => {
                    if (!mergedProgress[c.conceptTitle]) {
                        mergedProgress[c.conceptTitle] = initialProgress[c.conceptTitle];
                    }
                });
                
                setProgress(mergedProgress);

                const firstNoviceConceptTitle = concepts.find(c => mergedProgress[c.conceptTitle]?.status === 'novice')?.conceptTitle;
                const firstConceptToSelect = concepts.find(c => c.conceptTitle === firstNoviceConceptTitle) || concepts[0];
                if (firstConceptToSelect) {
                    setSelectedConcept(firstConceptToSelect);
                }

            } catch (err: any) { setError(err.message); } 
            finally { setIsLoading(false); }
        }
    }, [grade, subject, chapter, currentUser, language, chapterDbKey]);

    useEffect(() => { loadChapter(); }, [chapter, language, loadChapter]);
    useEffect(() => { if (showConfetti) { const timer = setTimeout(() => setShowConfetti(false), 5000); return () => clearTimeout(timer); } }, [showConfetti]);
    
    const concepts = useMemo(() => learningModule?.keyConcepts || [], [learningModule]);

    const handleConceptSelect = (concept: Concept) => {
        if (progress[concept.conceptTitle]?.status === 'locked') return;
        setSelectedConcept(concept);
        setShowPractice(false);
        const smartboard = document.getElementById('smartboard');
        if (smartboard) smartboard.scrollTo(0, 0);
    };

    const handleHotsDismiss = () => {
        // Award 25 XP for "completing" the HOTS challenge
        updateStudentPoints(25);
        setShowAdvanced(null);
    };

    const handlePracticeResult = useCallback(async (score: number, correctCount: number, concept: Concept) => {
        setShowPractice(false);
        const currentConceptProgress = progress[concept.conceptTitle];
        const newRecord: PerformanceRecord = { subject: subject.name, chapter: chapter.title, score, completedDate: new Date().toISOString(), type: 'exercise', context: concept.conceptTitle };
        await savePerformanceRecord(student.id, newRecord);

        // --- XP Earning Logic ---
        let earnedXp = 0;
        // 10 XP per correct answer in the practice block
        earnedXp += correctCount * 10;

        let newProgress = { ...progress };
        if (score >= 75) {
            // SUCCESS PATH
            
            // 50 XP bonus for mastering a concept for the first time
            if (currentConceptProgress.status !== 'master') {
                earnedXp += 50;
            }

            newProgress[concept.conceptTitle] = { ...currentConceptProgress, status: 'master', score, failedAttempts: 0 };
            
            // Show HOTS challenge modal on first-time success
            if (currentConceptProgress.failedAttempts === 0) {
                setShowAdvanced(concept);
            }

            // Unlock next concept
            const currentIndex = concepts.findIndex(c => c.conceptTitle === concept.conceptTitle);
            if (currentIndex < concepts.length - 1) {
                const nextConceptTitle = concepts[currentIndex + 1].conceptTitle;
                if (newProgress[nextConceptTitle]?.status === 'locked') {
                    newProgress[nextConceptTitle] = { ...newProgress[nextConceptTitle], status: 'novice' };
                }
            }
        } else {
            // FAILURE PATH
            const newFailedAttempts = currentConceptProgress.failedAttempts + 1;
            newProgress[concept.conceptTitle] = { ...currentConceptProgress, status: 'novice', score, failedAttempts: newFailedAttempts };
            
            if (newFailedAttempts >= 2) {
                // Trigger high-value intervention
                setShowTutorAlert(concept);
            } else {
                // Trigger standard remediation
                setShowRemediation(concept);
            }
        }

        // Update student points if any XP was earned
        if (earnedXp > 0) {
            updateStudentPoints(earnedXp);
        }

        await handleProgressUpdate(newProgress);
    }, [progress, student.id, subject.name, chapter.title, concepts, handleProgressUpdate, updateStudentPoints]);


    const handleQuizStart = useCallback(async () => {
        if (!learningModule) return;
        setIsLoading(true); setError(null);
        try {
            const questions = await generateQuiz(learningModule.keyConcepts, language);
            setQuizQuestions(questions); setShowQuiz(true);
        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    }, [learningModule, language]);

    const handleQuizFinish = useCallback(async (result: { score: number; answers: { [key: number]: string } }) => {
        setQuizResult(result); setShowQuiz(false);
        if (result.score >= 80) { setShowConfetti(true); }
        setIsLoadingNextStep(true);
        try {
            const subjectChapters = grade.subjects.find(s => s.name === subject.name)?.chapters || [];
            const recommendation = await generateNextStepRecommendation(grade.level, subject.name, chapter.title, result.score, quizQuestions?.length || 5, subjectChapters, language);
            setNextStep(recommendation);
        } catch(err: any) { setError(err.message); } 
        finally { setIsLoadingNextStep(false); }
    }, [grade, subject, chapter, quizQuestions, language]);
    
    const handleNextChapter = () => {
        if (nextStep?.nextChapterTitle) {
            const nextChapter = grade.subjects.find(s => s.name === subject.name)?.chapters.find(c => c.title === nextStep.nextChapterTitle);
            if (nextChapter) onChapterSelect(nextChapter);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary text-lg font-semibold animate-pulse">{loadingMessage}</p>
                <p className="text-sm text-text-secondary mt-1">{tCurriculum(chapter.title)}</p>
            </div>
        );
    }
    if (error) return <div className="text-center p-8 bg-status-danger rounded-lg max-w-2xl mx-auto"><h3 className="text-xl font-bold text-status-danger mt-4">{t('errorOccurred')}</h3><p className="text-status-danger mt-2">{error}</p><button onClick={loadChapter} className="mt-6 flex items-center justify-center mx-auto px-6 py-2 bg-status-danger text-white font-bold rounded-lg shadow-md hover:opacity-80 transition" style={{ backgroundColor: 'rgb(var(--c-error))' }}><ArrowPathIcon className="h-5 w-5 mr-2" />{t('tryAgain')}</button></div>;
    if (!learningModule) return <div className="text-center"><p>{t('noContent')}</p></div>;
    if (showQuiz) return <Quiz questions={quizQuestions!} onBack={() => setShowQuiz(false)} chapterTitle={tCurriculum(learningModule.chapterTitle)} onFinish={handleQuizFinish} />;

    const allConceptsMastered = concepts.length > 0 && concepts.every(c => progress[c.conceptTitle]?.status === 'master');
    const isPracticeDisabled = selectedConcept ? progress[selectedConcept.conceptTitle]?.status === 'locked' || progress[selectedConcept.conceptTitle]?.status === 'master' : true;

    return (
    <div className="animate-fade-in">
      {showConfetti && <Confetti />}
       {/* --- START: Modals for Concept-to-Mastery Engine --- */}
        {showRemediation && (
            <div className="modal-overlay">
                <div className="modal-content text-center">
                    <XCircleIcon className="h-16 w-16 mx-auto text-status-warning"/>
                    <h2 className="text-2xl font-bold mt-4 text-text-primary">{t('remediationTitle')}</h2>
                    <p className="text-text-secondary mt-2">{t('remediationDesc', { concept: tCurriculum(showRemediation.conceptTitle) })}</p>
                    <div className="space-y-3 mt-6 text-left">
                        <button onClick={() => { setActiveRemediation('refresher'); setTimeout(() => { setShowRemediation(null); setActiveRemediation(null); }, 1500); }} className="remediation-card w-full">
                            <FilmIcon className="h-8 w-8 text-primary"/>
                            <div>
                                <h3 className="font-bold text-text-primary">{t('remediationOption1Title')}</h3>
                                <p className="text-sm text-text-secondary">{t('remediationOption1Desc')}</p>
                            </div>
                            {activeRemediation === 'refresher' && <CheckCircleIcon className="h-6 w-6 text-status-success ml-auto"/>}
                        </button>
                         <button onClick={() => { setActiveRemediation('drill'); setTimeout(() => { setShowRemediation(null); setActiveRemediation(null); }, 1500); }} className="remediation-card w-full">
                            <PuzzlePieceIcon className="h-8 w-8 text-primary"/>
                            <div>
                                <h3 className="font-bold text-text-primary">{t('remediationOption2Title')}</h3>
                                <p className="text-sm text-text-secondary">{t('remediationOption2Desc')}</p>
                            </div>
                            {activeRemediation === 'drill' && <CheckCircleIcon className="h-6 w-6 text-status-success ml-auto"/>}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {showTutorAlert && (
            <div className="modal-overlay">
                 <div className="modal-content text-center">
                    <ExclamationTriangleSolid className="h-16 w-16 mx-auto text-status-danger"/>
                    <h2 className="text-2xl font-bold mt-4 text-text-primary">{t('tutorAlertTitle')}</h2>
                    <p className="text-text-secondary mt-2">{t('tutorAlertDesc', { concept: tCurriculum(showTutorAlert.conceptTitle) })}</p>
                    <div className="mt-6 flex gap-4">
                        <button onClick={() => setShowTutorAlert(null)} className="w-full px-4 py-2 bg-border text-text-primary font-semibold rounded-lg hover:opacity-80 transition">{t('tutorAlertDismiss')}</button>
                        <button onClick={() => { onStartTutorSession([showTutorAlert]); setShowTutorAlert(null); }} className="w-full btn-accent">{t('tutorAlertButton')}</button>
                    </div>
                 </div>
            </div>
        )}
         {showAdvanced && (
            <div className="modal-overlay">
                 <div className="modal-content text-center">
                    <TrophySolid className="h-16 w-16 mx-auto text-status-success"/>
                    <h2 className="text-2xl font-bold mt-4 text-text-primary">{t('advancedSuggestionTitle')}</h2>
                    <p className="text-text-secondary mt-2">{t('advancedSuggestionDesc')}</p>
                    <div className="mt-6">
                        <button onClick={handleHotsDismiss} className="w-full btn-accent">{t('advancedSuggestionButton')}</button>
                    </div>
                 </div>
            </div>
        )}
      {/* --- END: Modals --- */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-semibold text-text-secondary mb-6">
        <button onClick={onBackToSubjects} className="hover:text-primary transition-colors">{tCurriculum(subject.name)}</button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
        <button onClick={onBackToChapters} className="hover:text-primary transition-colors">{t('backToChapters')}</button>
      </nav>

      <header className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">{tCurriculum(learningModule.chapterTitle)}</h1>
      </header>
      
        <div className="virtual-classroom-grid">
            <main id="smartboard" className="space-y-8">
                <EducatorProfile />

                {selectedConcept && (
                    <section key={selectedConcept.conceptTitle} className="concept-view-card animate-fade-in">
                        <h2 className="text-3xl font-bold text-text-primary mb-4">{tCurriculum(selectedConcept.conceptTitle)}</h2>
                        <div className="prose prose-xl max-w-none dark:prose-invert mb-4">
                            <StructuredText text={selectedConcept.explanation} renderText={(text) => renderTextWithTTS(text, selectedConcept.conceptTitle + '-explanation')} />
                        </div>
                        <div className="mt-4 p-4 bg-surface border-l-4 border-primary rounded-r-lg">
                            <h4 className="font-semibold text-primary flex items-center mb-2"><BeakerIcon className="h-5 w-5 mr-2" />{t('stemConnection')}</h4>
                            <div className="prose prose-lg max-w-none dark:prose-invert">
                                <StructuredText text={selectedConcept.realWorldExample} renderText={(text) => renderTextWithTTS(text, selectedConcept.conceptTitle + '-example')} />
                            </div>
                        </div>
                        <div className="integrated-practice-block">
                            {progress[selectedConcept.conceptTitle]?.status !== 'master' ? (
                                showPractice ? (
                                    <PracticeExercises
                                        concept={selectedConcept} grade={grade} subject={subject} chapter={chapter} language={language}
                                        onResult={(score, correctCount) => handlePracticeResult(score, correctCount, selectedConcept)}
                                    />
                                ) : (
                                    <div className="text-center">
                                        <button onClick={() => setShowPractice(true)} disabled={isPracticeDisabled} className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed">
                                            <WrenchScrewdriverIcon className="h-5 w-5 mr-2"/>
                                            {t('practiceThisConceptIntegrated')}
                                        </button>
                                        {isPracticeDisabled && progress[selectedConcept.conceptTitle]?.status !== 'master' && <p className="text-xs text-text-secondary mt-2">Unlock this concept by mastering the previous one.</p>}
                                    </div>
                                )
                            ) : (
                                <div className="text-center p-4 bg-status-success rounded-lg text-status-success font-semibold flex items-center justify-center gap-2">
                                    <CheckCircleIcon className="h-6 w-6" />
                                    {t('mastered')}
                                </div>
                            )}
                        </div>
                    </section>
                )}
                 {(learningModule.interactiveVideoSimulation || learningModule.virtualLab || learningModule.adaptiveStory || learningModule.interactiveExplainer) && (
                    <section id="alfanumrik-lab" className="alfanumrik-lab-section">
                         <h2 className="section-title"><SparklesSolid className="h-6 w-6 text-primary"/>{t('alfanumrikLabTitle')}</h2>
                         <div className="space-y-6">
                            {learningModule.interactiveVideoSimulation && <VideoSimulationPlayer simulationData={learningModule.interactiveVideoSimulation} dbKey={`video-${grade.level}-${subject.name}-${chapter.title}`} grade={grade} subject={subject} chapter={chapter} />}
                            {learningModule.virtualLab && <VirtualLabPlayer labData={learningModule.virtualLab} grade={grade} subject={subject} chapter={chapter} />}
                            {learningModule.adaptiveStory && <AdaptiveStoryPlayer storyData={learningModule.adaptiveStory} />}
                            {learningModule.interactiveExplainer && <InteractiveExplainerPlayer explainerData={learningModule.interactiveExplainer} grade={grade} subject={subject} chapter={chapter} />}
                         </div>
                    </section>
                )}
            </main>
            
            <aside className="chapter-index">
                 <div className="dashboard-highlight-card p-4 space-y-6">
                     <div>
                        <h3 className="font-bold text-lg text-text-primary border-b border-border pb-2 mb-3">{t('chapterIndexTitle')}</h3>
                        <div className="space-y-2">
                            {concepts.map(c => {
                                const conceptProgress = progress[c.conceptTitle];
                                return (
                                <button key={c.conceptTitle} onClick={() => handleConceptSelect(c)} disabled={conceptProgress?.status === 'locked'} className={`chapter-index-item ${selectedConcept?.conceptTitle === c.conceptTitle ? 'active' : ''} ${conceptProgress?.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <MasteryMeter status={conceptProgress?.status || 'locked'} />
                                    <span className="flex-grow mx-2">{tCurriculum(c.conceptTitle)}</span>
                                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                                </button>
                            )})}
                        </div>
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-text-primary border-b border-border pb-2 mb-3">{t('toolsAndResourcesTitle')}</h3>
                         <div className="space-y-2">
                            <button onClick={() => onStartTutorSession(concepts)} className="chapter-index-item"><ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-primary"/><span>{t('startTutorSessionButton')}</span></button>
                            <button onClick={() => onStartMicrolearningSession(learningModule)} className="chapter-index-item"><BoltIcon className="h-5 w-5 mr-2 text-primary"/><span>{t('startFocusedStudy')}</span></button>
                         </div>
                     </div>
                     <div>
                        <button onClick={handleQuizStart} disabled={!allConceptsMastered || isLoading} className="w-full btn-accent disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <LoadingSpinner /> : ( <><TrophySolid className="h-5 w-5 mr-2"/>{t('startChapterQuiz')}</>)}
                        </button>
                        {!allConceptsMastered && <p className="text-xs text-text-secondary mt-2 text-center">{t('masterAllConceptsPrompt')}</p>}
                     </div>

                      {quizResult && !showQuiz && (
                         <div className="animate-fade-in border-t border-border pt-4">
                             <h3 className="font-bold text-lg text-text-primary text-center">{t('quizResults')}</h3>
                             <p className={`text-4xl font-bold my-2 text-center ${quizResult.score > 70 ? 'text-status-success' : 'text-status-danger'}`}>{quizResult.score}%</p>
                              <div className="mt-4 p-3 bg-bg-primary rounded-lg border border-border">
                                  <h4 className="font-bold text-sm text-primary flex items-center"><ForwardIcon className="h-4 w-4 mr-2"/> {t('nextSteps')}</h4>
                                {isLoadingNextStep ? <div className="py-2"><LoadingSpinner /></div> : (
                                nextStep && (<div className="mt-2 text-left">
                                    <p className="text-text-secondary text-sm italic mb-3">"{nextStep.recommendationText}"</p>
                                    {nextStep.action === 'CONTINUE' && nextStep.nextChapterTitle && (<button onClick={handleNextChapter} className="w-full btn-accent text-sm py-2">{t('startNextChapter', { chapter: tCurriculum(nextStep.nextChapterTitle) })}</button>)}
                                    {nextStep.action === 'REVIEW' && (<button onClick={loadChapter} className="w-full chapter-index-item justify-center">{t('reviewThisLesson')}</button>)}
                                </div>)
                                )}
                              </div>
                         </div>
                    )}
                 </div>
            </aside>
        </div>
    </div>
  );
});
