import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grade, Subject, Chapter, LearningModule, Student, Trigger, CoreConceptLesson, PracticeArena, PracticalApplicationLab, QuizQuestion, XpReward, VideoReward, PracticeProblem, WrittenAnswerEvaluation } from '../types';
import * as contentService from '../services/contentService';
import * as pineconeService from '../services/pineconeService';
import * as geminiService from '../services/geminiService';
import * as abTestingService from '../services/abTestingService';
import * as analyticsService from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import Quiz from '../components/Quiz';
import { useLanguage } from '../contexts/Language-context';
import { ArrowPathIcon, BookOpenIcon, BeakerIcon, LightBulbIcon, CpuChipIcon, AcademicCapIcon, PuzzlePieceIcon, SparklesIcon, ChevronRightIcon, PlayCircleIcon, DevicePhoneMobileIcon, CheckIcon, StarIcon, ClipboardDocumentCheckIcon, DocumentTextIcon, PencilSquareIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import StructuredText from '../components/StructuredText';
import Confetti from '../components/Confetti';
import ConceptVideoPlayer from '../components/ConceptVideoPlayer';

interface ChapterViewProps {
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  student: Student;
  language: string;
  onBackToChapters: () => void;
  onBackToSubjects: () => void;
  onChapterSelect: (chapter: Chapter) => void;
  onUpdatePoints: (points: number) => void;
  onAddAchievement: (achievementId: string) => void;
}

const EXPERIMENT_ID = 'microlesson_ordering_v1';
type Variant = 'A' | 'B';

// --- START: Section-specific rendering components ---

const MissionBriefingSection: React.FC<{ content: Trigger[] }> = ({ content }) => {
    // Select a random trigger to display, making the start of the mission feel fresh each time.
    const trigger = useMemo(() => {
        if (!content || content.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * content.length);
        return content[randomIndex];
    }, [content]);

    if (!trigger) return null;

    return (
        <div>
            <div className="mission-briefing-card">
                <h3 className="text-2xl font-bold text-text-primary">{trigger.title}</h3>
                {trigger.triggerType === 'realWorldVideo' ? (
                    <div className="mt-4 aspect-video bg-black rounded-lg flex items-center justify-center text-center p-4">
                        <div className="flex flex-col items-center">
                            <PlayCircleIcon className="h-16 w-16 text-white/50" />
                            <p className="text-white/70 mt-2 font-semibold">Video simulation of this briefing would play here.</p>
                            <p className="text-xs text-white/50 mt-1">Prompt: "{trigger.description}"</p>
                        </div>
                    </div>
                ) : (
                    <p className="mt-2 text-lg text-text-secondary italic">"{trigger.description}"</p>
                )}
            </div>

            {/* Simulated Push Notification to demonstrate external trigger */}
            <div className="push-notification-simulation">
                <DevicePhoneMobileIcon className="h-8 w-8 text-text-secondary flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-bold text-sm text-text-primary">Alfanumrik</p>
                    <p className="text-sm text-text-secondary">{trigger.pushNotification}</p>
                </div>
            </div>
        </div>
    );
};

const CoreConceptTrainingSection: React.FC<{ content: CoreConceptLesson[], grade: Grade, subject: Subject, onLogEvent: (eventName: string, attributes: any) => void }> = ({ content, grade, subject, onLogEvent }) => {
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
    return (
        <div className="space-y-3">
            {content.map((lesson) => (
                <div key={lesson.title} className="bg-surface rounded-lg border border-border overflow-hidden">
                    <button
                        onClick={() => setExpandedLesson(prev => prev === lesson.title ? null : lesson.title)}
                        className="w-full text-left p-4 flex justify-between items-center hover:bg-bg-primary"
                    >
                        <h4 className="font-bold text-text-primary">{lesson.title}</h4>
                        <ChevronRightIcon className={`h-5 w-5 text-text-secondary transition-transform ${expandedLesson === lesson.title ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedLesson === lesson.title && (
                        <div className="p-4 pt-0 animate-fade-in">
                            {lesson.videoPrompt && (
                                <div className="mb-4 border-b border-border pb-4">
                                    <ConceptVideoPlayer
                                        videoPrompt={lesson.videoPrompt}
                                        dbKey={`concept-video-${grade.level}-${subject.name}-${lesson.title}`}
                                    />
                                </div>
                            )}
                            <div className="prose prose-lg max-w-none dark:prose-invert">
                                <StructuredText text={lesson.explanation} />
                            </div>
                            <div className="mt-4">
                                <h5 className="font-bold text-text-secondary text-sm uppercase mb-2">Knowledge Check</h5>
                                <Quiz 
                                    questions={lesson.knowledgeCheck} 
                                    onBack={() => {}} 
                                    chapterTitle={lesson.title} 
                                    onLogEvent={onLogEvent}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const PracticeArenaSection: React.FC<{ 
    content: PracticeArena;
    onReward: (points: number) => void;
    completedProblems: number[];
    onToggleComplete: (index: number) => void;
    onLogEvent: (eventName: string, attributes: any) => void;
}> = ({ content, onReward, completedProblems, onToggleComplete, onLogEvent }) => {
    const [rewardShown, setRewardShown] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const allProblemsCompleted = useMemo(() => 
        content.problems.length > 0 && completedProblems.length === content.problems.length,
        [completedProblems, content.problems]
    );

    useEffect(() => {
        if (allProblemsCompleted && content.reward && !rewardShown) {
            if (content.reward.type === 'xp') {
                onReward((content.reward as XpReward).points);
                setShowConfetti(true);
            }
            setRewardShown(true);
        }
    }, [allProblemsCompleted, content.reward, onReward, rewardShown]);
    
    // Reset local state when content changes (e.g., navigating to a new chapter)
    useEffect(() => {
        setRewardShown(false);
        setShowConfetti(false);
    }, [content]);

    const handleToggle = (index: number) => {
        const isCompleting = !completedProblems.includes(index);
        onToggleComplete(index);
        onLogEvent('item_attempt', {
            item_id: content.problems[index].problemStatement,
            item_type: 'practice_problem_completion',
            correctness: isCompleting ? 1 : 0, // 1 for completed, 0 for un-completed
            attempt_index: 1
        });
    }

    return (
        <div>
            {showConfetti && <Confetti />}
            {content.problems.map((p, i) => (
                <div key={i} className="practice-problem-card">
                    <div className="practice-problem-header">
                        <h4 className="font-bold text-text-primary">Practice Problem {i + 1}</h4>
                         <div className="flex items-center gap-4">
                            <span className={`problem-level-badge level-${p.level.charAt(6)}`}>
                                {p.level}
                            </span>
                             <label htmlFor={`problem-check-${i}`} className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
                                <input id={`problem-check-${i}`} type="checkbox" onChange={() => handleToggle(i)} checked={completedProblems.includes(i)} className="h-4 w-4 rounded-sm border-border bg-surface text-primary focus:ring-0 cursor-pointer"/>
                                Mark as Done
                            </label>
                        </div>
                    </div>
                    <div className="practice-problem-body prose max-w-none dark:prose-invert">
                        <p className="text-text-secondary mb-2"><strong>Problem:</strong> {p.problemStatement}</p>
                        <details>
                            <summary className="cursor-pointer font-semibold text-primary">View Solution</summary>
                            <div className="mt-2 text-primary"><StructuredText text={p.solution}/></div>
                        </details>
                    </div>
                </div>
            ))}
            {allProblemsCompleted && content.reward && (
                 <div className="mt-6 p-4 rounded-lg bg-amber-900/50 border-2 border-amber-500/50 text-center animate-fade-in">
                    <h3 className="text-xl font-bold text-amber-300">🎉 Variable Reward Unlocked! 🎉</h3>
                    {content.reward.type === 'xp' && (
                        <p className="text-lg text-amber-200 mt-2">You've earned a bonus of <span className="font-bold text-2xl">{(content.reward as XpReward).points} XP</span> for your hard work!</p>
                    )}
                    {content.reward.type === 'video' && (
                        <div className="mt-2 text-left">
                            <p className="font-semibold text-amber-200">Pro Tip Video: {(content.reward as VideoReward).title}</p>
                             <div className="mt-2 aspect-video bg-black rounded-lg flex items-center justify-center text-center p-4">
                                <div className="flex flex-col items-center">
                                    <PlayCircleIcon className="h-12 w-12 text-white/50" />
                                    <p className="text-white/70 mt-2 font-semibold">Video simulation would play here.</p>
                                    <p className="text-xs text-white/50 mt-1">Prompt: "{(content.reward as VideoReward).videoPrompt}"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ApplicationLabSection: React.FC<{ content: PracticalApplicationLab }> = ({ content }) => (
    <div className="application-lab-section">
        <h4 className="font-bold text-lg text-primary">{content.title}</h4>
        <p className="text-text-secondary mt-1">{content.description}</p>
        {content.labInstructions && (
             <div className="mt-4 p-4 bg-surface rounded-lg">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                    <StructuredText text={content.labInstructions} />
                </div>
             </div>
        )}
    </div>
);

const ReflectionSection: React.FC<{ onLogEvent: (eventName: string, attributes: any) => void }> = ({ onLogEvent }) => {
    const [confidence, setConfidence] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (confidence === 0) return;
        onLogEvent('reflection_submitted', { confidence_rating: confidence });
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="text-center p-4 bg-status-success rounded-lg">
                <p className="font-semibold text-status-success">Thank you for your feedback!</p>
            </div>
        );
    }

    return (
        <div className="bg-surface p-6 rounded-2xl border border-border">
            <h4 className="font-bold text-text-primary text-center">Quick Reflection</h4>
            <p className="text-sm text-text-secondary text-center mt-1">How confident do you feel about the concepts you just covered?</p>
            <div className="flex justify-center items-center gap-2 my-4">
                {[1, 2, 3, 4, 5].map(rating => (
                    <button key={rating} onClick={() => setConfidence(rating)} className={`w-10 h-10 rounded-full text-lg font-bold transition-all ${confidence >= rating ? 'bg-accent text-button-accent-text scale-110' : 'bg-bg-primary hover:bg-border'}`}>
                        {rating}
                    </button>
                ))}
            </div>
            <p className="text-xs text-text-secondary text-center">1 = Not confident at all, 5 = Very confident</p>
            <div className="text-center mt-4">
                <button onClick={handleSubmit} disabled={confidence === 0} className="btn-accent px-6 py-2 disabled:opacity-50">Submit</button>
            </div>
        </div>
    );
}

const EvaluationCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="p-4 bg-bg-primary rounded-lg border border-border">
        <h5 className="font-bold text-lg text-primary mb-3 flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {title}
        </h5>
        <div className="prose max-w-none dark:prose-invert text-sm">{children}</div>
    </div>
);

const MasteryZoneSection: React.FC<{ grade: string, subject: string, chapter: string, existingProblems: PracticeProblem[], language: string }> = ({ grade, subject, chapter, existingProblems, language }) => {
    const [activeTab, setActiveTab] = useState<'mastery' | 'writing'>('mastery');
    
    const [moreProblems, setMoreProblems] = useState<PracticeProblem[] | null>(null);
    const [isLoadingProblems, setIsLoadingProblems] = useState(false);
    const [problemError, setProblemError] = useState<string | null>(null);

    const [challengeQuestion, setChallengeQuestion] = useState<string | null>(null);
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    const [challengeError, setChallengeError] = useState<string | null>(null);
    const [studentAnswer, setStudentAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<WrittenAnswerEvaluation | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const handleGenerateProblems = async () => {
        setIsLoadingProblems(true);
        setProblemError(null);
        try {
            const problems = await geminiService.generateMorePracticeProblems(grade, subject, chapter, existingProblems, language);
            setMoreProblems(problems);
        } catch (e: any) {
            setProblemError(e.message);
        } finally {
            setIsLoadingProblems(false);
        }
    };
    
    const handleGetChallenge = async () => {
        setIsLoadingChallenge(true);
        setChallengeError(null);
        setStudentAnswer('');
        setEvaluation(null);
        try {
            const question = await geminiService.getWritingChallengeQuestion(grade, subject, chapter, language);
            setChallengeQuestion(question);
        } catch (e: any) {
            setChallengeError(e.message);
        } finally {
            setIsLoadingChallenge(false);
        }
    };
    
    const handleEvaluateAnswer = async () => {
        if (!challengeQuestion || !studentAnswer) return;
        setIsEvaluating(true);
        setChallengeError(null);
        try {
            const result = await geminiService.evaluateWrittenAnswer(challengeQuestion, studentAnswer, grade, subject, language);
            setEvaluation(result);
        } catch(e: any) {
            setChallengeError(e.message);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="bg-surface p-6 rounded-2xl border border-border">
            <div className="flex border-b border-border mb-4">
                <button
                    onClick={() => setActiveTab('mastery')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${activeTab === 'mastery' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Subject Mastery
                </button>
                <button
                    onClick={() => setActiveTab('writing')}
                    className={`px-4 py-2 font-semibold text-sm transition-colors ${activeTab === 'writing' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    Practice Writing
                </button>
            </div>

            {activeTab === 'mastery' && (
                <div className="animate-fade-in">
                    <p className="text-text-secondary mt-1 mb-4">Challenge yourself with unique, competitive exam-focused questions.</p>
                    <button onClick={handleGenerateProblems} disabled={isLoadingProblems} className="btn-accent flex items-center justify-center w-full sm:w-auto">
                        {isLoadingProblems ? <><LoadingSpinner /><span className="ml-2">Generating...</span></> : <><SparklesIcon className="h-5 w-5 mr-2" />Generate More Practice Questions</>}
                    </button>
                    {problemError && <p className="text-status-danger mt-2">{problemError}</p>}
                    {moreProblems && (
                        <div className="mt-4 space-y-4 animate-fade-in">
                            {moreProblems.map((p, i) => (
                                <div key={i} className="practice-problem-card !mt-0">
                                    <div className="practice-problem-header">
                                        <h4 className="font-bold text-text-primary">Challenge Problem {i + 1}</h4>
                                        <span className={`problem-level-badge level-${p.level.charAt(6)}`}>{p.level}</span>
                                    </div>
                                    <div className="practice-problem-body prose max-w-none dark:prose-invert">
                                        <p className="text-text-secondary mb-2"><strong>Problem:</strong> {p.problemStatement}</p>
                                        <details>
                                            <summary className="cursor-pointer font-semibold text-primary">View Solution</summary>
                                            <div className="mt-2 text-primary"><StructuredText text={p.solution} /></div>
                                        </details>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'writing' && (
                <div className="animate-fade-in">
                    <p className="text-text-secondary mt-1 mb-4">Hone your exam writing skills with AI-powered feedback based on CBSE guidelines.</p>
                     <button onClick={handleGetChallenge} disabled={isLoadingChallenge} className="btn-accent flex items-center justify-center w-full sm:w-auto">
                        {isLoadingChallenge ? <><LoadingSpinner /><span className="ml-2">Generating...</span></> : <><SparklesIcon className="h-5 w-5 mr-2" />Get a Writing Challenge</>}
                    </button>
                    {challengeError && <p className="text-status-danger mt-2">{challengeError}</p>}

                    {challengeQuestion && (
                        <div className="mt-4 animate-fade-in space-y-4">
                            <div className="bg-bg-primary p-4 rounded-lg border border-border">
                                <p className="font-semibold text-text-primary">{challengeQuestion}</p>
                            </div>
                            <textarea value={studentAnswer} onChange={e => setStudentAnswer(e.target.value)} rows={5} className="w-full" placeholder="Write your answer here..." />
                            <button onClick={handleEvaluateAnswer} disabled={isEvaluating || !studentAnswer.trim()} className="btn-accent flex items-center justify-center w-full sm:w-auto">
                               {isEvaluating ? <><LoadingSpinner /><span className="ml-2">Evaluating...</span></> : <>Evaluate My Answer</>}
                            </button>
                        </div>
                    )}
                    
                    {evaluation && (
                        <div className="mt-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <EvaluationCard title="Model Answer" icon={DocumentTextIcon}>
                                    <StructuredText text={evaluation.modelAnswer} />
                                </EvaluationCard>
                                <EvaluationCard title="Marking Scheme" icon={ClipboardDocumentCheckIcon}>
                                    <StructuredText text={evaluation.markingScheme} />
                                </EvaluationCard>
                                <EvaluationCard title="Personalized Feedback" icon={SparklesIcon}>
                                    <StructuredText text={evaluation.personalizedFeedback} />
                                </EvaluationCard>
                                <EvaluationCard title="Pro Tips for Exams" icon={StarIcon}>
                                    <StructuredText text={evaluation.proTips} />
                                </EvaluationCard>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const WritingPracticeZone: React.FC<{
    problems: PracticeProblem[];
    grade: string;
    subject: string;
    language: string;
}> = ({ problems, grade, subject, language }) => {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({});
    const [evaluation, setEvaluation] = useState<WrittenAnswerEvaluation | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSolution, setShowSolution] = useState(false);

    const currentProblem = problems[currentIndex];
    const currentAnswer = writtenAnswers[currentIndex] || '';

    const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setWrittenAnswers(prev => ({ ...prev, [currentIndex]: e.target.value }));
    };

    const handleEvaluate = async () => {
        if (!currentAnswer.trim()) return;
        setIsEvaluating(true);
        setError(null);
        setEvaluation(null);
        setShowSolution(true);
        try {
            const result = await geminiService.evaluateWrittenAnswer(currentProblem.problemStatement, currentAnswer, grade, subject, language);
            setEvaluation(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsEvaluating(false);
        }
    };
    
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < problems.length) {
            setCurrentIndex(index);
            setShowSolution(false);
            setEvaluation(null);
            setError(null);
        }
    };

    if (!problems || problems.length === 0) {
        return <div className="bg-surface p-6 rounded-2xl border border-border text-center text-text-secondary">{t('noProblemsAvailable')}</div>;
    }

    return (
        <div className="bg-surface p-6 rounded-2xl border border-border">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-text-primary">
                    {t('writingPracticeFor')} "{currentProblem.level}"
                </h4>
                <span className="font-semibold text-text-secondary text-sm">
                    {t('question')} {currentIndex + 1} / {problems.length}
                </span>
            </div>

            <div className="bg-bg-primary p-4 rounded-lg border border-border">
                <p className="font-semibold text-text-primary">{currentProblem.problemStatement}</p>
            </div>
            
            <textarea
                value={currentAnswer}
                onChange={handleAnswerChange}
                rows={8}
                className="w-full mt-4"
                placeholder={t('writeYourAnswerHere')}
                disabled={showSolution}
            />

            {!showSolution && (
                <div className="mt-4 text-center">
                    <button onClick={handleEvaluate} disabled={!currentAnswer.trim()} className="btn-accent">
                        {t('compareAndEvaluate')}
                    </button>
                </div>
            )}
            
            {showSolution && (
                <div className="mt-4 animate-fade-in space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EvaluationCard title={t('yourAnswerComparison')} icon={PencilSquareIcon}>
                            <p className="whitespace-pre-wrap">{currentAnswer}</p>
                        </EvaluationCard>
                        <EvaluationCard title={t('modelAnswer')} icon={DocumentTextIcon}>
                            <StructuredText text={currentProblem.solution} />
                        </EvaluationCard>
                    </div>
                    
                    {isEvaluating && (
                        <div className="flex justify-center items-center gap-2 p-4">
                            <LoadingSpinner />
                            <span className="text-text-secondary font-semibold">{t('aiIsEvaluating')}...</span>
                        </div>
                    )}
                    
                    {error && <p className="text-status-danger text-center">{error}</p>}

                    {evaluation && (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                            <EvaluationCard title={t('markingScheme')} icon={ClipboardDocumentCheckIcon}>
                                <StructuredText text={evaluation.markingScheme} />
                            </EvaluationCard>
                            <EvaluationCard title={t('personalizedFeedback')} icon={SparklesIcon}>
                                <StructuredText text={evaluation.personalizedFeedback} />
                            </EvaluationCard>
                             <EvaluationCard title={t('proTipsForExams')} icon={StarIcon}>
                                <StructuredText text={evaluation.proTips} />
                            </EvaluationCard>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                <button onClick={() => goToQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="px-4 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm border border-border hover:bg-bg-primary transition disabled:opacity-50 flex items-center gap-2">
                    <ChevronLeftIcon className="h-4 w-4" /> {t('previous')}
                </button>
                <button onClick={() => goToQuestion(currentIndex + 1)} disabled={currentIndex === problems.length - 1} className="px-4 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm border border-border hover:bg-bg-primary transition disabled:opacity-50 flex items-center gap-2">
                    {t('next')} <ChevronRightIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

// --- END: Section-specific rendering components ---

export const ChapterView: React.FC<ChapterViewProps> = React.memo(({
  grade, subject, chapter, student, language, onBackToChapters, onBackToSubjects, onChapterSelect, onUpdatePoints, onAddAchievement
}) => {
    const { t, tCurriculum } = useLanguage();

    const [variant, setVariant] = useState<Variant>('A');
    const [isCompleted, setIsCompleted] = useState(false);

    const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('mission-briefing');
    
    const [completedPracticeProblems, setCompletedPracticeProblems] = useState<number[]>([]);

    const mainRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const [loadingMessage, setLoadingMessage] = useState(t('aiGeneratingLesson'));

    const handleLogEvent = useCallback((eventName: string, attributes: any) => {
        analyticsService.logEvent(eventName, student, EXPERIMENT_ID, variant, attributes);
    }, [student, variant]);
    
    useEffect(() => {
        const assignedVariant = abTestingService.assignVariant(student.id, EXPERIMENT_ID);
        setVariant(assignedVariant);

        handleLogEvent('lesson_assigned', {
            lesson_id: chapter.title,
            teacher_id: null, // Placeholder
        });
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student.id, chapter.title]);

     // Dropout event logging
    useEffect(() => {
        return () => {
            if (!isCompleted) {
                handleLogEvent('dropout_event', {
                    progress_percent: 0 // Placeholder, could be improved with more state
                });
            }
        };
    }, [isCompleted, handleLogEvent]);


    const handleReward = useCallback((points: number) => {
        onUpdatePoints(points);
    }, [onUpdatePoints]);

    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            const messages = [t('loadingMessage1'), t('loadingMessage2'), t('loadingMessage3'), t('loadingMessage4'), t('loadingMessage5')];
            let msgIdx = 0;
            interval = window.setInterval(() => {
                msgIdx = (msgIdx + 1) % messages.length;
                setLoadingMessage(messages[msgIdx]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading, t]);

    const loadChapter = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCompletedPracticeProblems([]); // Reset on new chapter load
        try {
            const progressKey = `practice-${student.id}-${grade.level}-${subject.name}-${chapter.title}`;
            
            const [moduleResult, savedProgress] = await Promise.all([
                contentService.getChapterContent(grade.level, subject.name, chapter, student, language),
                pineconeService.getDoc<number[] | null>('progress', progressKey)
            ]);

            setLearningModule(moduleResult.content);
            if (savedProgress) {
                setCompletedPracticeProblems(savedProgress);
            }
        } catch (err: any) { 
            setError(err.message); 
        } finally { 
            setIsLoading(false); 
        }
    }, [grade.level, subject.name, chapter, student, language]);

    useEffect(() => { loadChapter(); }, [chapter, language, loadChapter]);
    
    const handleTogglePracticeProblem = useCallback(async (problemIndex: number) => {
        const newCompletedProblems = completedPracticeProblems.includes(problemIndex)
            ? completedPracticeProblems.filter(i => i !== problemIndex)
            : [...completedPracticeProblems, problemIndex];
        
        setCompletedPracticeProblems(newCompletedProblems);

        const progressKey = `practice-${student.id}-${grade.level}-${subject.name}-${chapter.title}`;
        try {
            await pineconeService.setDoc('progress', progressKey, newCompletedProblems);
        } catch(e) {
            console.error("Failed to save practice progress:", e);
        }
    }, [completedPracticeProblems, student.id, grade.level, subject.name, chapter.title]);
    
    const sections = useMemo(() => {
        if (!learningModule) return [];
        const baseSections = [
            { id: 'mission-briefing', title: 'Mission Briefing', icon: LightBulbIcon },
            { id: 'core-concepts', title: 'Core Concept Training', icon: AcademicCapIcon },
            { id: 'practice-arena', title: 'The Practice Arena', icon: PuzzlePieceIcon },
            { id: 'reflection', title: 'Reflection', icon: ClipboardDocumentCheckIcon },
            { id: 'application-lab', title: 'Application Lab', icon: SparklesIcon },
            { id: 'boss-fight', title: 'The Boss Fight', icon: CpuChipIcon },
            { id: 'mastery-zone', title: 'Mastery Zone', icon: StarIcon },
            { id: 'writing-practice-zone', title: t('writingPracticeZoneTitle'), icon: PencilSquareIcon },
        ];
        
        // Reorder based on variant
        if (variant === 'B') {
            const practiceIndex = baseSections.findIndex(s => s.id === 'practice-arena');
            const conceptsIndex = baseSections.findIndex(s => s.id === 'core-concepts');
            if (practiceIndex !== -1 && conceptsIndex !== -1) {
                [baseSections[practiceIndex], baseSections[conceptsIndex]] = [baseSections[conceptsIndex], baseSections[practiceIndex]];
            }
        }
        
        return baseSections;
    }, [learningModule, variant, t]);

    const visitedSections = useRef(new Set<string>());

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (entry.intersectionRatio > 0.5) {
                            setActiveSection(entry.target.id);
                        }
                        visitedSections.current.add(entry.target.id);
                    }
                });
            },
            { root: null, rootMargin: "-40% 0px -60% 0px", threshold: [0.1, 0.5] }
        );

        Object.values(sectionRefs.current).forEach(ref => {
            if (ref instanceof Element) {
                observer.observe(ref);
            }
        });

        return () => observer.disconnect();
    }, [learningModule]);

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
    
    const experimentBlock = variant === 'A' ? (
        <>
            <section id="core-concepts" ref={el => { if (el) sectionRefs.current['core-concepts'] = el; }}>
                <h2 className="section-title"><AcademicCapIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='core-concepts')?.title}</h2>
                <CoreConceptTrainingSection content={learningModule.coreConceptTraining} grade={grade} subject={subject} onLogEvent={handleLogEvent} />
            </section>
            <section id="practice-arena" ref={el => { if (el) sectionRefs.current['practice-arena'] = el; }}>
                <h2 className="section-title"><PuzzlePieceIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='practice-arena')?.title}</h2>
                <PracticeArenaSection 
                    content={learningModule.practiceArena} 
                    onReward={handleReward}
                    completedProblems={completedPracticeProblems}
                    onToggleComplete={handleTogglePracticeProblem}
                    onLogEvent={handleLogEvent}
                />
            </section>
        </>
    ) : (
        <>
            <section id="practice-arena" ref={el => { if (el) sectionRefs.current['practice-arena'] = el; }}>
                <h2 className="section-title"><PuzzlePieceIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='practice-arena')?.title}</h2>
                <PracticeArenaSection 
                    content={learningModule.practiceArena} 
                    onReward={handleReward}
                    completedProblems={completedPracticeProblems}
                    onToggleComplete={handleTogglePracticeProblem}
                    onLogEvent={handleLogEvent}
                />
            </section>
            <section id="core-concepts" ref={el => { if (el) sectionRefs.current['core-concepts'] = el; }}>
                <h2 className="section-title"><AcademicCapIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='core-concepts')?.title}</h2>
                <CoreConceptTrainingSection content={learningModule.coreConceptTraining} grade={grade} subject={subject} onLogEvent={handleLogEvent} />
            </section>
        </>
    );

    return (
    <div className="animate-fade-in">
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-semibold text-text-secondary mb-6">
        <button onClick={onBackToSubjects} className="hover:text-primary transition-colors">{tCurriculum(subject.name)}</button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
        <button onClick={onBackToChapters} className="hover:text-primary transition-colors">{t('backToChapters')}</button>
      </nav>

      <header className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight">Mission: {tCurriculum(learningModule.chapterTitle)}</h1>
         <p className="text-xs font-mono text-text-secondary mt-1">Experiment Variant: {variant}</p>
      </header>
      
        <div className="virtual-classroom-grid">
            <main id="smartboard" ref={mainRef} className="space-y-12">
                
                <section id="mission-briefing" ref={el => { if (el) sectionRefs.current['mission-briefing'] = el; }}>
                    <h2 className="section-title"><LightBulbIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='mission-briefing')?.title}</h2>
                    <MissionBriefingSection content={learningModule.missionBriefing} />
                </section>
                
                {experimentBlock}

                <section id="reflection" ref={el => { if (el) sectionRefs.current['reflection'] = el; }}>
                    <h2 className="section-title"><ClipboardDocumentCheckIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='reflection')?.title}</h2>
                    <ReflectionSection onLogEvent={handleLogEvent} />
                </section>

                <section id="application-lab" ref={el => { if (el) sectionRefs.current['application-lab'] = el; }}>
                    <h2 className="section-title"><SparklesIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='application-lab')?.title}</h2>
                    <ApplicationLabSection content={learningModule.practicalApplicationLab} />
                </section>
                
                <section id="boss-fight" ref={el => { if (el) sectionRefs.current['boss-fight'] = el; }}>
                    <h2 className="section-title"><CpuChipIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='boss-fight')?.title}</h2>
                    <Quiz 
                        questions={learningModule.bossFight} 
                        onBack={() => {}} 
                        chapterTitle="Final Challenge" 
                        onLogEvent={handleLogEvent}
                        isPostTest={true}
                        onFinish={() => setIsCompleted(true)}
                    />
                </section>
                
                <section id="mastery-zone" ref={el => { if (el) sectionRefs.current['mastery-zone'] = el; }}>
                    <h2 className="section-title"><StarIcon className="h-7 w-7 text-primary" /> {sections.find(s=>s.id==='mastery-zone')?.title}</h2>
                    <MasteryZoneSection 
                        grade={grade.level}
                        subject={subject.name}
                        chapter={chapter.title}
                        existingProblems={learningModule.practiceArena.problems}
                        language={language}
                    />
                </section>
                
                <section id="writing-practice-zone" ref={el => { if (el) sectionRefs.current['writing-practice-zone'] = el; }}>
                    <h2 className="section-title"><PencilSquareIcon className="h-7 w-7 text-primary" /> {t('writingPracticeZoneTitle')}</h2>
                    <WritingPracticeZone
                        problems={learningModule.practiceArena.problems}
                        grade={grade.level}
                        subject={subject.name}
                        language={language}
                    />
                </section>

            </main>
            
            <aside className="mission-index">
                 <div className="dashboard-highlight-card p-4 space-y-2">
                    <h3 className="font-bold text-lg text-text-primary border-b border-border pb-2 mb-3">Mission Log</h3>
                    {sections.map(section => {
                        const isVisited = visitedSections.current.has(section.id);
                        return (
                            <a key={section.id} href={`#${section.id}`} onClick={(e) => { e.preventDefault(); sectionRefs.current[section.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`mission-index-item ${activeSection === section.id ? 'active' : ''} ${isVisited ? 'visited' : ''}`}>
                                 <div className="relative mr-4">
                                     <section.icon className={`h-5 w-5 flex-shrink-0 ${activeSection === section.id ? 'text-primary' : 'text-text-secondary'}`} />
                                     {isVisited && <CheckIcon className="h-3.5 w-3.5 absolute -bottom-1 -right-1 text-green-500 bg-surface rounded-full p-0.5" />}
                                 </div>
                                 <span className="flex-grow">{section.title}</span>
                            </a>
                        );
                    })}
                 </div>
            </aside>
        </div>
    </div>
  );
});