import React, { useState, useEffect, useCallback } from 'react';
import { Grade, Subject, Chapter, LearningModule, QuizQuestion, NextStepRecommendation, ChapterProgress, Student, CategorizedProblems } from '../types';
import { getChapterContent, generateQuiz, generateDiagram, generateNextStepRecommendation } from '../services/geminiService';
import { getLearningModule, saveLearningModule, getChapterProgress, saveChapterProgress, getDiagram, saveDiagram } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import ConceptCard from './ConceptCard';
import Quiz from './Quiz';
import Confetti from './Confetti';
import { ArrowLeftIcon, RocketLaunchIcon, ArchiveBoxIcon, LightBulbIcon, ArrowPathIcon, ForwardIcon, CheckCircleIcon, BookOpenIcon, VariableIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon as ExclamationTriangleSolid, TrophyIcon as TrophySolid, BeakerIcon, GlobeAltIcon, LinkIcon, AcademicCapIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, LanguageIcon, SparklesIcon as SparklesSolid, MapIcon, PuzzlePieceIcon, CalculatorIcon, ScaleIcon, ShareIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { useTTS } from '../hooks/useTTS';
import { useAuth } from '../contexts/AuthContext';


interface ChapterViewProps {
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  student: Student;
  language: string;
  onBack: () => void;
  onChapterSelect: (chapter: Chapter) => void;
}

interface DiagramState {
    url: string | null;
    isLoading: boolean;
    error: string | null;
}

// A more robust sentence tokenizer that handles abbreviations.
const getSentences = (text: string): string[] => {
    if (!text) return [];
    const sentences = text.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(Boolean);
};


const CategorizedProblemsComponent: React.FC<{ problems: CategorizedProblems }> = ({ problems }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'conceptual' | 'application' | 'higherOrderThinking'>('conceptual');

    const tabs = [
        { id: 'conceptual', label: t('conceptual'), problems: problems.conceptual },
        { id: 'application', label: t('application'), problems: problems.application },
        // FIX: Update translation key to match the fix in language context.
        { id: 'higherOrderThinking', label: t('higherOrderThinking'), problems: problems.higherOrderThinking },
    ];

    const currentProblems = tabs.find(tab => tab.id === activeTab)?.problems || [];

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg not-prose">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            style={{borderColor: activeTab === tab.id ? 'rgb(var(--c-primary))' : 'transparent', color: activeTab === tab.id ? 'rgb(var(--c-primary))' : ''}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4 space-y-4">
                {currentProblems.map((problem, index) => (
                    <div key={index}>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">Q: {problem.question}</p>
                        <details className="mt-2 text-sm">
                            <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>{t('viewSolution')}</summary>
                            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                                <p>{problem.solution}</p>
                            </div>
                        </details>
                    </div>
                ))}
                 {currentProblems.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noProblemsAvailable')}</p>}
            </div>
        </div>
    );
};


const ChapterView: React.FC<ChapterViewProps> = ({ grade, subject, chapter, language, onBack, onChapterSelect }) => {
  const { currentUser } = useAuth();
  const student = currentUser!; // We can assert this is non-null as ChapterView is only rendered for logged-in users

  const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [isLoadingModule, setIsLoadingModule] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [diagrams, setDiagrams] = useState<{ [key: string]: DiagramState }>({});
  const [isFromDB, setIsFromDB] = useState(false);
  const { t, tCurriculum } = useLanguage();
  
  // State for progress tracking
  const [progress, setProgress] = useState<ChapterProgress>({});
  const progressDbKey = `progress-${student.id}-${grade.level}-${subject.name}-${chapter.title}`;


  // State for post-quiz adaptive flow
  const [showPostQuizAnalysis, setShowPostQuizAnalysis] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- TTS State & Logic ---
  const { isSupported, isSpeaking, isPaused, currentSentenceIndex, play, pause, resume, stop } = useTTS();
  const [fullText, setFullText] = useState('');


  const resetStateForNewChapter = () => {
    setLearningModule(null);
    setQuiz(null);
    setShowQuiz(false);
    setShowPostQuizAnalysis(false);
    setRecommendation(null);
    setDiagrams({});
    setProgress({});
    setShowConfetti(false);
    if (isSpeaking) stop();
    setFullText('');
  }
  
  const fetchAllDiagrams = useCallback(async (module: LearningModule) => {
    // Initialize all diagrams to a loading state so spinners appear immediately
    const initialDiagramStates = module.keyConcepts.reduce((acc, concept) => {
        acc[concept.conceptTitle] = { url: null, isLoading: true, error: null };
        return acc;
    }, {} as { [key: string]: DiagramState });
    setDiagrams(initialDiagramStates);

    // Create an array of promises to fetch/generate all diagrams in parallel
    const diagramPromises = module.keyConcepts.map(async (concept) => {
        const diagramDbKey = `diagram-${grade.level}-${subject.name}-${chapter.title}-${concept.conceptTitle}`;
        try {
            const cachedDiagram = await getDiagram(diagramDbKey);
            if (cachedDiagram) {
                return { conceptTitle: concept.conceptTitle, url: cachedDiagram, error: null };
            }

            if (!concept.diagramDescription || concept.diagramDescription.trim().length < 10) {
                throw new Error("Diagram description not available.");
            }

            const generatedImageUrl = await generateDiagram(concept.diagramDescription, subject.name);
            await saveDiagram(diagramDbKey, generatedImageUrl);
            return { conceptTitle: concept.conceptTitle, url: generatedImageUrl, error: null };
        } catch (err) {
            console.error(`Failed to process diagram for "${concept.conceptTitle}":`, err);
            return { conceptTitle: concept.conceptTitle, url: null, error: t('diagramFailedError') };
        }
    });

    // Await all promises to settle and then update the state for each diagram
    const results = await Promise.allSettled(diagramPromises);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const { conceptTitle, url, error } = result.value;
            setDiagrams(prev => ({
                ...prev,
                [conceptTitle]: { url, isLoading: false, error }
            }));
        }
        // You could also handle 'rejected' status for more robust error handling if needed
    });
  }, [grade.level, subject.name, chapter.title, t]);


  const fetchContent = useCallback(async () => {
    resetStateForNewChapter();
    try {
      setIsLoadingModule(true);
      setError(null);
      setIsFromDB(false);

      const savedProgress = await getChapterProgress(progressDbKey, language);
      if (savedProgress) setProgress(savedProgress);

      const dbKey = `module-${grade.level}-${subject.name}-${chapter.title}`;
      const cachedContent = await getLearningModule(dbKey, language);

      let content: LearningModule;
      if (cachedContent) {
        content = cachedContent;
        setIsFromDB(true);
      } else {
        content = await getChapterContent(grade.level, subject.name, chapter.title, language);
        await saveLearningModule(dbKey, content, language);
      }
      
      const textToSpeak = [
        content.introduction,
        ...content.keyConcepts.flatMap(c => [c.explanation, c.realWorldExample]),
        content.summary,
      ].filter(Boolean).join(' ');
      
      setFullText(textToSpeak);
      setLearningModule(content);
      setIsLoadingModule(false); // Render text content immediately

      // Start fetching diagrams in the background without blocking the UI
      fetchAllDiagrams(content);

    } catch (err: any) {
      setError(err.message || t('unknownError'));
      setIsLoadingModule(false);
    }
  }, [grade.level, subject.name, chapter.title, progressDbKey, language, t, fetchAllDiagrams]);


  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  
  // Stop TTS on component unmount
  useEffect(() => {
      return () => {
          stop();
      }
  }, [stop]);


  const handleGenerateQuiz = async () => {
      if (!learningModule) return;
      setIsGeneratingQuiz(true);
      setError(null);
      try {
          const quizData = await generateQuiz(learningModule.keyConcepts, language);
          setQuiz(quizData);
          setShowQuiz(true);
      } catch (err: any) {
          setError(err.message || t('quizGenerationError'));
      } finally {
          setIsGeneratingQuiz(false);
      }
  };

  const handleQuizFinish = async (result: { score: number, answers: {[key: number]: string} }) => {
    setShowQuiz(false);
    
    if (quiz && learningModule) {
        let newProgress = { ...progress };
        quiz.forEach((question, index) => {
            const isCorrect = result.answers[index] === question.correctAnswer;
            if (isCorrect) {
                newProgress[question.conceptTitle] = 'mastered';
            } else {
                if (newProgress[question.conceptTitle] !== 'mastered') {
                    newProgress[question.conceptTitle] = 'in-progress';
                }
            }
        });
        setProgress(newProgress);
        await saveChapterProgress(progressDbKey, newProgress, language);

        const masteredCount = Object.values(newProgress).filter(p => p === 'mastered').length;
        if (masteredCount === learningModule.keyConcepts.length) {
            setShowConfetti(true);
        }
    }

    setShowPostQuizAnalysis(true);
    setQuizScore(result.score);
    
    setIsGeneratingRecommendation(true);
    setError(null);
    try {
      const rec = await generateNextStepRecommendation(
        grade.level,
        subject.name,
        chapter.title,
        result.score,
        quiz?.length || 5,
        subject.chapters,
        language
      );
      setRecommendation(rec);
    } catch (err: any) {
      setError(err.message || t('recommendationError'));
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };
  
  const handleMarkAsInProgress = async (conceptTitle: string) => {
    const newProgress = { ...progress, [conceptTitle]: 'in-progress' as const };
    setProgress(newProgress);
    await saveChapterProgress(progressDbKey, newProgress, language);
  }

  const handleRecommendationAction = () => {
    if (!recommendation) return;

    switch(recommendation.action) {
      case 'CONTINUE':
        const nextChapter = subject.chapters.find(c => c.title === recommendation.nextChapterTitle);
        if (nextChapter) {
          onChapterSelect(nextChapter);
        } else {
          onBack(); 
        }
        break;
      case 'REVIEW':
        setShowPostQuizAnalysis(false); 
        break;
      case 'REVISE_PREREQUISITE':
        const prereqChapter = subject.chapters.find(c => c.title === recommendation.prerequisiteChapterTitle);
        if (prereqChapter) {
            onChapterSelect(prereqChapter);
        } else {
            setShowPostQuizAnalysis(false); // Fallback to review current
        }
        break;
    }
  }

  const getRecommendationButton = () => {
    if (!recommendation) return null;

    let text = t('reviewThisChapter');
    let icon = <ArrowPathIcon className="h-5 w-5 mr-2" />;

    if (recommendation.action === 'CONTINUE' && recommendation.nextChapterTitle) {
      text = t('continueToNextChapter');
      icon = <ForwardIcon className="h-5 w-5 mr-2" />;
    } else if (recommendation.action === 'REVISE_PREREQUISITE' && recommendation.prerequisiteChapterTitle) {
      text = `${t('goTo')}: ${tCurriculum(recommendation.prerequisiteChapterTitle)}`;
      icon = <BookOpenIcon className="h-5 w-5 mr-2" />;
    }
    
    return (
      <button 
          onClick={handleRecommendationAction}
          className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient animate-fade-in"
      >
          {icon}
          {text}
      </button>
    )
  }

  // This variable will track sentence index across multiple render calls within a single render pass.
  // It must be defined inside the component render scope to be reset on each re-render.
  let sentenceRenderCount = 0;
  const renderTextWithHighlight = (text: string | undefined) => {
      if (!text) return null;
      const localSentences = getSentences(text);
      const elements = localSentences.map((sentence, index) => {
          const globalIndex = sentenceRenderCount + index;
          const isHighlighted = isSpeaking && !isPaused && globalIndex === currentSentenceIndex;
          return (
              <span key={globalIndex} className={isHighlighted ? 'tts-highlight' : ''}>
                  {sentence}{' '}
              </span>
          );
      });
      // This is a side-effect during render, but it's contained and predictable for this specific use case.
      sentenceRenderCount += localSentences.length;
      return <>{elements}</>;
  };

  if (isLoadingModule) {
    return <div className="flex flex-col items-center justify-center h-96">
        <LoadingSpinner />
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">{t('preparingLesson')}</p>
    </div>;
  }

  if (error && !learningModule && !showPostQuizAnalysis) {
    return <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('oopsError')}</h3>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
        <button onClick={fetchContent} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">{t('tryAgain')}</button>
    </div>;
  }

  
  if (showQuiz && quiz) {
    return <Quiz questions={quiz} onBack={() => setShowQuiz(false)} chapterTitle={learningModule?.chapterTitle || chapter.title} onFinish={handleQuizFinish} />;
  }

  if (showPostQuizAnalysis) {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg animate-fade-in text-center relative border border-slate-200 dark:border-slate-700">
            {showConfetti && <Confetti />}
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('quizComplete')}</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">{t('youScored', { score: quizScore, total: quiz?.length })}</p>
            
            <div className="mt-8 p-6 bg-primary-light dark:bg-slate-900/50 border-l-4 border-primary/50 rounded-r-lg text-left min-h-[150px] flex items-center justify-center" style={{backgroundColor: 'rgb(var(--c-primary-light))', borderColor: 'rgba(var(--c-primary), 0.5)'}}>
                {isGeneratingRecommendation ? (
                    <div className="flex flex-col items-center">
                        <LoadingSpinner />
                        <p className="mt-2 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('aiAnalyzing')}</p>
                    </div>
                ) : error ? (
                     <p className="text-red-600 dark:text-red-400">{error}</p>
                ) : recommendation ? (
                    <div>
                        <h3 className="font-semibold text-primary-dark flex items-center mb-2 text-xl" style={{color: 'rgb(var(--c-primary-dark))'}}>
                            <LightBulbIcon className="h-6 w-6 mr-2" />
                            {t('yourNextStep')}
                        </h3>
                        <p className="text-primary-dark/80 dark:text-slate-300 text-lg" style={{color: 'rgba(var(--c-primary-dark), 0.8)'}}>{recommendation.recommendationText}</p>
                    </div>
                ) : null}
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button onClick={onBack} className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('backToChapters')}
                </button>
                {!isGeneratingRecommendation && getRecommendationButton()}
            </div>
        </div>
    );
  }

  if (!learningModule) return null;

  const masteredConcepts = Object.values(progress).filter(p => p === 'mastered').length;
  const totalConcepts = learningModule.keyConcepts.length;
  const masteryPercentage = totalConcepts > 0 ? (masteredConcepts / totalConcepts) * 100 : 0;
  const totalSentences = getSentences(fullText).length;

  if (masteryPercentage === 100 && !showConfetti) {
      setShowConfetti(true);
  }


  return (
    <div className="animate-fade-in">
      {showConfetti && <Confetti />}
      <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToChapters')}
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <header className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <p className="font-semibold text-primary" style={{color: 'rgb(var(--c-primary))'}}>{tCurriculum(grade.level)} &middot; {tCurriculum(subject.name)}</p>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-1">{learningModule.chapterTitle}</h1>
            </div>
             <div className="flex items-center gap-3">
                 {isFromDB && (
                  <div className="flex items-center bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-sm font-medium px-3 py-1 rounded-full animate-fade-in">
                    <ArchiveBoxIcon className="h-4 w-4 mr-1.5" />
                    {t('loadedFromDB')}
                  </div>
                )}
                 {isSupported && fullText && (
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        {!isSpeaking ? (
                             <button onClick={() => play(fullText)} className="flex items-center gap-2 px-3 py-1 text-primary-dark dark:text-slate-200 font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition w-full justify-center">
                                <PlayCircleIcon className="h-6 w-6"/> <span className="hidden sm:inline">{t('listenToChapter')}</span>
                            </button>
                        ) : (
                           <>
                                <button onClick={isPaused ? resume : pause} className="p-1.5 text-primary-dark dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition">
                                    {isPaused ? <PlayCircleIcon className="h-6 w-6"/> : <PauseCircleIcon className="h-6 w-6"/>}
                                </button>
                                <div className="flex-grow text-center text-xs font-mono text-slate-500 dark:text-slate-400 px-2">
                                   {currentSentenceIndex + 1} / {totalSentences}
                                </div>
                                 <button onClick={stop} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition">
                                    <StopCircleIcon className="h-6 w-6"/>
                                </button>
                           </>
                        )}
                    </div>
                 )}
            </div>
           {/* Progress Bar */}
          <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('chapterMastery')}</span>
                  <span className="text-sm font-bold text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{Math.round(masteryPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3.5">
                  <div className="h-3.5 rounded-full progress-bar-gradient" style={{ width: `${masteryPercentage}%` }}></div>
              </div>
          </div>
        </header>
        
        <section className="prose prose-lg max-w-none prose-indigo dark:prose-invert">
            <div className="lead text-xl text-slate-600 dark:text-slate-300">{renderTextWithHighlight(learningModule.introduction)}</div>

            {/* Learning Objectives */}
            {learningModule.learningObjectives && learningModule.learningObjectives.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-10 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ClipboardDocumentListIcon className="h-7 w-7 mr-3" />
                        {t('learningObjectives')}
                    </h2>
                    <ul className="list-none p-0 space-y-2">
                        {learningModule.learningObjectives.map((obj, index) => (
                            <li key={index} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>{obj}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <h2 className="text-3xl font-bold mt-10 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4" style={{borderColor: 'rgb(var(--c-primary))'}}>{t('keyConcepts')}</h2>
            <div className="space-y-8">
                {learningModule.keyConcepts.map((concept, index) => {
                    const diagramState = diagrams[concept.conceptTitle] || { isLoading: true, error: null, url: null };
                    const progressStatus = progress[concept.conceptTitle] || 'not-started';
                    return (
                        <ConceptCard 
                            key={index} 
                            concept={concept}
                            grade={grade}
                            subject={subject}
                            chapter={chapter}
                            language={language}
                            imageUrl={diagramState.url}
                            isDiagramLoading={diagramState.isLoading}
                            diagramError={diagramState.error}
                            progressStatus={progressStatus}
                            onMarkAsInProgress={() => handleMarkAsInProgress(concept.conceptTitle)}
                            renderText={renderTextWithHighlight}
                        />
                    );
                })}
            </div>

            {/* --- NEW ADVANCED PEDAGOGY SECTIONS --- */}

            {/* Math: Key Theorems */}
            {learningModule.keyTheoremsAndProofs && learningModule.keyTheoremsAndProofs.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ScaleIcon className="h-7 w-7 mr-3" />
                        {t('keyTheoremsAndProofs')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.keyTheoremsAndProofs.map((theorem, index) => (
                             <details key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <summary className="font-bold text-lg text-primary-dark dark:text-primary cursor-pointer" style={{color: 'rgb(var(--c-primary-dark))'}}>{theorem.name}</summary>
                                <div className="mt-4 prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"><p><strong>Proof:</strong> {theorem.proof}</p></div>
                            </details>
                        ))}
                    </div>
                </>
            )}
            
            {/* Math: Formula Derivations */}
            {learningModule.formulaDerivations && learningModule.formulaDerivations.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <VariableIcon className="h-7 w-7 mr-3" />
                        {t('formulaDerivations')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.formulaDerivations.map((item, index) => (
                             <details key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <summary className="font-bold text-lg text-primary-dark dark:text-primary cursor-pointer" style={{color: 'rgb(var(--c-primary-dark))'}}>Derivation of: {item.formula}</summary>
                                <div className="mt-4 prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">{item.derivation}</div>
                            </details>
                        ))}
                    </div>
                </>
            )}

            {/* Science: Key Laws */}
            {learningModule.keyLawsAndPrinciples && learningModule.keyLawsAndPrinciples.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <BookOpenIcon className="h-7 w-7 mr-3" />
                        {t('keyLawsAndPrinciples')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.keyLawsAndPrinciples.map((law, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{law.name}</h4>
                                <p className="mt-1">{law.explanation}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Science: Solved Numerical Problems */}
            {learningModule.solvedNumericalProblems && learningModule.solvedNumericalProblems.length > 0 && (
                 <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <CalculatorIcon className="h-7 w-7 mr-3" />
                        {t('solvedNumericalProblems')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.solvedNumericalProblems.map((problem, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">Q: {problem.question}</p>
                                <details className="mt-2 text-sm">
                                    <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>{t('viewSolution')}</summary>
                                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                        <p>{problem.solution}</p>
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                </>
            )}


            {/* General: Concept Map */}
            {learningModule.conceptMap && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ShareIcon className="h-7 w-7 mr-3" />
                        {t('conceptMap')}
                    </h2>
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 not-prose">
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{learningModule.conceptMap}</p>
                    </div>
                </>
            )}

            {/* General: Learning Tricks */}
            {learningModule.learningTricksAndMnemonics && learningModule.learningTricksAndMnemonics.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <SparklesSolid className="h-7 w-7 mr-3" />
                        {t('learningTricksAndMnemonics')}
                    </h2>
                    <div className="space-y-3 not-prose">
                         {learningModule.learningTricksAndMnemonics.map((trick, index) => (
                            <div key={index} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-slate-700 dark:text-slate-200">{trick}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {/* General: HOTS Questions */}
            {learningModule.higherOrderThinkingQuestions && learningModule.higherOrderThinkingQuestions.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <AcademicCapIcon className="h-7 w-7 mr-3" />
                        {t('higherOrderThinkingQuestions')}
                    </h2>
                     <div className="space-y-4 not-prose">
                        {learningModule.higherOrderThinkingQuestions.map((item, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <p className="font-semibold text-slate-800 dark:text-slate-100">Q: {item.question}</p>
                                <details className="mt-2 text-sm">
                                    <summary className="cursor-pointer font-semibold text-primary hover:text-primary-dark" style={{color: 'rgb(var(--c-primary))'}}>View Hint</summary>
                                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200">
                                        <p>{item.hint}</p>
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* --- EXISTING ADVANCED SECTIONS --- */}

            {/* Social Science: Timeline */}
            {learningModule.timelineOfEvents && learningModule.timelineOfEvents.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ClockIcon className="h-7 w-7 mr-3" />
                        {t('timelineOfEvents')}
                    </h2>
                    <div className="not-prose border-l-2 border-slate-300 dark:border-slate-600 ml-3 pl-6 space-y-8">
                        {learningModule.timelineOfEvents.map((item, index) => (
                            <div key={index} className="relative">
                                <div className="absolute -left-[31px] top-1 h-4 w-4 bg-primary rounded-full" style={{backgroundColor: 'rgb(var(--c-primary))'}}></div>
                                <p className="font-bold text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{item.year}: {item.event}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.significance}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Social Science: Key Figures */}
            {learningModule.keyFigures && learningModule.keyFigures.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <UserGroupIcon className="h-7 w-7 mr-3" />
                        {t('keyFigures')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.keyFigures.map((figure, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <p className="font-bold text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{figure.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{figure.contribution}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Social Science: Primary Source */}
            {learningModule.primarySourceAnalysis && learningModule.primarySourceAnalysis.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <DocumentTextIcon className="h-7 w-7 mr-3" />
                        {t('primarySourceAnalysis')}
                    </h2>
                     <div className="space-y-4 not-prose">
                        {learningModule.primarySourceAnalysis.map((source, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{source.sourceTitle}</h4>
                                <blockquote className="border-l-4 border-slate-400 dark:border-slate-500 pl-4 my-2 text-slate-600 dark:text-slate-300 italic">"{source.snippet}"</blockquote>
                                <p><span className="font-semibold text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('analysis')}:</span> {source.analysis}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {/* Social Science: Case Studies */}
            {learningModule.inDepthCaseStudies && learningModule.inDepthCaseStudies.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ArchiveBoxIcon className="h-7 w-7 mr-3" />
                        {t('inDepthCaseStudies')}
                    </h2>
                     <div className="space-y-4 not-prose">
                        {learningModule.inDepthCaseStudies.map((study, index) => (
                             <details key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <summary className="font-bold text-lg text-primary-dark dark:text-primary cursor-pointer" style={{color: 'rgb(var(--c-primary-dark))'}}>{study.title}</summary>
                                <div className="mt-4 space-y-2">
                                    <p><span className="font-semibold">{t('background')}:</span> {study.background}</p>
                                    <p><span className="font-semibold">{t('analysis')}:</span> {study.analysis}</p>
                                    <p><span className="font-semibold">{t('conclusion')}:</span> {study.conclusion}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </>
            )}

            {/* Language Arts: Grammar Spotlight */}
            {learningModule.grammarSpotlight && learningModule.grammarSpotlight.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <LanguageIcon className="h-7 w-7 mr-3" />
                        {t('grammarSpotlight')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.grammarSpotlight.map((rule, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{rule.ruleName}</h4>
                                <p className="mt-1">{rule.explanation}</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                                    {rule.examples.map((ex, i) => <li key={i}><em>"{ex}"</em></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Language Arts: Literary Devices */}
            {learningModule.literaryDeviceAnalysis && learningModule.literaryDeviceAnalysis.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <SparklesSolid className="h-7 w-7 mr-3" />
                        {t('literaryDeviceAnalysis')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.literaryDeviceAnalysis.map((device, index) => (
                             <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{device.deviceName}</h4>
                                <p className="mt-1">{device.explanation}</p>
                                <p className="mt-2 text-slate-600 dark:text-slate-300"><strong>{t('example')}:</strong> <em>"{device.example}"</em></p>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {/* Math: Formula Sheet */}
            {learningModule.formulaSheet && learningModule.formulaSheet.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <VariableIcon className="h-7 w-7 mr-3" />
                        {t('formulaSheet')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.formulaSheet.map((item, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <p className="font-mono text-lg text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{item.formula}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Math: Problem Solving Templates */}
            {learningModule.problemSolvingTemplates && learningModule.problemSolvingTemplates.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <ClipboardDocumentListIcon className="h-7 w-7 mr-3" />
                        {t('problemSolvingGuides')}
                    </h2>
                    <div className="space-y-6 not-prose">
                        {learningModule.problemSolvingTemplates.map((template, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{template.problemType}</h4>
                                <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                                    {template.steps.map((step, stepIndex) => (
                                        <li key={stepIndex}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Math: Categorized Problems */}
            {learningModule.categorizedProblems && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <QuestionMarkCircleIcon className="h-7 w-7 mr-3" />
                        {t('practiceProblems')}
                    </h2>
                    <CategorizedProblemsComponent problems={learningModule.categorizedProblems} />
                </>
            )}

            {/* Math: Common Mistakes */}
            {learningModule.commonMistakes && learningModule.commonMistakes.length > 0 && (
                 <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-red-500 pl-4 flex items-center">
                        <ExclamationTriangleSolid className="h-7 w-7 mr-3 text-red-500" />
                        {t('commonMistakes')}
                    </h2>
                    <div className="space-y-4 not-prose">
                        {learningModule.commonMistakes.map((mistake, index) => (
                            <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                                <p className="font-semibold text-red-800 dark:text-red-300">Mistake: {mistake.mistake}</p>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-2 font-semibold">Correction: {mistake.correction}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {/* Science: Experiments */}
            {learningModule.experiments && learningModule.experiments.length > 0 && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <BeakerIcon className="h-7 w-7 mr-3" />
                        {t('experimentsAndSafety')}
                    </h2>
                    <div className="space-y-6 not-prose">
                        {learningModule.experiments.map((exp, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{exp.title}</h4>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{exp.description}</p>
                                <div className="mt-4">
                                    <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('materialsNeeded')}:</h5>
                                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                                        {exp.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-4">
                                    <h5 className="font-semibold text-slate-700 dark:text-slate-200">Steps:</h5>
                                    <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300">
                                        {exp.steps.map((step, i) => <li key={i}>{step}</li>)}
                                    </ol>
                                </div>
                                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
                                    <h5 className="font-bold text-yellow-800 dark:text-yellow-300 flex items-center">
                                        <ExclamationTriangleSolid className="h-5 w-5 mr-2" />
                                        {t('safetyFirst')}
                                    </h5>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">{exp.safetyGuidelines}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Science: Scientific Method */}
            {learningModule.scientificMethodApplications && (
                <div className="mt-12">
                     <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <BeakerIcon className="h-7 w-7 mr-3" />
                        {t('scientificMethodInAction')}
                    </h2>
                     <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 not-prose">
                        <p className="text-slate-600 dark:text-slate-300">{learningModule.scientificMethodApplications}</p>
                    </div>
                </div>
            )}
            
            {/* Science: Current Discoveries */}
             {learningModule.currentDiscoveries && (
                <div className="mt-12">
                     <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <RocketLaunchIcon className="h-7 w-7 mr-3" />
                        {t('latestDiscoveries')}
                    </h2>
                     <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 not-prose">
                        <p className="text-slate-600 dark:text-slate-300">{learningModule.currentDiscoveries}</p>
                    </div>
                </div>
            )}

            {/* Science: Environmental Awareness */}
            {learningModule.environmentalAwareness && (
                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-green-500 pl-4 flex items-center">
                        <GlobeAltIcon className="h-7 w-7 mr-3 text-green-500" />
                        {t('environmentalConnection')}
                    </h2>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 not-prose">
                        <p className="text-green-800 dark:text-green-300">{learningModule.environmentalAwareness}</p>
                    </div>
                </div>
            )}
            
            {/* Science: Interdisciplinary Connections */}
            {learningModule.interdisciplinaryConnections && (
                <div className="mt-12">
                     <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <LinkIcon className="h-7 w-7 mr-3" />
                        {t('interdisciplinaryLinks')}
                    </h2>
                     <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 not-prose">
                        <p className="text-slate-600 dark:text-slate-300">{learningModule.interdisciplinaryConnections}</p>
                    </div>
                </div>
            )}
            
            {/* General: Vocabulary Deep Dive */}
            {learningModule.vocabularyDeepDive && learningModule.vocabularyDeepDive.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4 flex items-center" style={{borderColor: 'rgb(var(--c-primary))'}}>
                        <AcademicCapIcon className="h-7 w-7 mr-3" />
                        {t('vocabularyDeepDive')}
                    </h2>
                    <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
                        {learningModule.vocabularyDeepDive.map((item, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <p className="font-bold text-primary-dark dark:text-primary" style={{color: 'rgb(var(--c-primary-dark))'}}>{item.term}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.definition}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 italic">"{item.usageInSentence}"</p>
                                {item.etymology && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">({t('etymology')}: {item.etymology})</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* General: Competitive Exam Mapping */}
            {learningModule.competitiveExamMapping && (
                <>
                    <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-amber-500 pl-4 flex items-center">
                        <TrophySolid className="h-7 w-7 mr-3 text-amber-500" />
                        {t('competitiveExamCorner')}
                    </h2>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 not-prose">
                        <p className="text-amber-800 dark:text-amber-300">{learningModule.competitiveExamMapping}</p>
                    </div>
                </>
            )}

            <h2 className="text-3xl font-bold mt-12 mb-4 text-slate-700 dark:text-slate-200 border-l-4 border-primary pl-4" style={{borderColor: 'rgb(var(--c-primary))'}}>{t('chapterSummary')}</h2>
            <div className="text-slate-600 dark:text-slate-300">{renderTextWithHighlight(learningModule.summary)}</div>

        </section>

        <footer className="mt-12 pt-8 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="text-center">
                 {masteryPercentage === 100 ? (
                    <div className="text-center text-green-700 dark:text-green-300 font-bold p-4 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <CheckCircleIcon className="h-8 w-8 mx-auto mb-2" />
                        {t('chapterMasteredCongrats')}
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{t('readyToTest')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('takeQuizPrompt')}</p>
                        <div className="flex justify-center mt-4">
                            <button 
                                onClick={handleGenerateQuiz} 
                                disabled={isGeneratingQuiz}
                                className="flex items-center justify-center px-8 py-3 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isGeneratingQuiz ? (
                                    <>
                                        <LoadingSpinner />
                                        <span className="ml-2">{t('aiCreatingQuiz')}</span>
                                    </>
                                ) : (
                                    <>
                                        <RocketLaunchIcon className="h-6 w-6 mr-2" />
                                        <span>{t('generateAdaptiveQuiz')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
             {error && <p className="text-center text-red-500 dark:text-red-400 mt-4">{error}</p>}
        </footer>

      </div>
    </div>
  );
};

export default React.memo(ChapterView);