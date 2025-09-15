import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Grade, Subject, Chapter, LearningModule, QuizQuestion, NextStepRecommendation, ChapterProgress, Student, CategorizedProblems, VocabularyDeepDive, Theorem, FormulaDerivation, Formula, ProblemSolvingTemplate, CommonMistake, Experiment, TimelineEvent, KeyFigure, PrimarySourceSnippet, CaseStudy, GrammarRule, LiteraryDevice } from '../types';
import * as contentService from '../services/contentService';
import { generateQuiz, generateDiagram, generateNextStepRecommendation } from '../services/geminiService';
import { getChapterProgress, saveChapterProgress, getDiagram, saveDiagram } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import ConceptCard from './ConceptCard';
import Quiz from './Quiz';
import Confetti from './Confetti';
import { ArrowLeftIcon, RocketLaunchIcon, ArchiveBoxIcon, LightBulbIcon, ArrowPathIcon, ForwardIcon, CheckCircleIcon, BookOpenIcon, VariableIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon as ExclamationTriangleSolid, TrophyIcon as TrophySolid, BeakerIcon, GlobeAltIcon, LinkIcon, AcademicCapIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, LanguageIcon, SparklesIcon as SparklesSolid, MapIcon, PuzzlePieceIcon, CalculatorIcon, ScaleIcon, ShareIcon, CheckBadgeIcon, CpuChipIcon } from '@heroicons/react/24/solid';
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

// --- START: Section Content Rendering Components ---

const SimpleTextComponent: React.FC<{ text: string | undefined, renderText: (text: string) => React.ReactNode }> = ({ text, renderText }) => text ? <p>{renderText(text)}</p> : null;

const StringListComponent: React.FC<{ items: string[] | undefined }> = ({ items }) => (
    <ul className="list-disc list-inside space-y-2">
        {items?.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
);

const VocabularyComponent: React.FC<{ items: VocabularyDeepDive[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.term}</h4>
                    <p className="mt-1"><strong className="font-semibold text-slate-600 dark:text-slate-300">{t('definition')}:</strong> {renderText(item.definition)}</p>
                    <p className="mt-1"><strong className="font-semibold text-slate-600 dark:text-slate-300">{t('usage')}:</strong> <em className="text-slate-500 dark:text-slate-400">"{renderText(item.usageInSentence)}"</em></p>
                    {item.etymology && <p className="mt-1"><strong className="font-semibold text-slate-600 dark:text-slate-300">{t('etymology')}:</strong> {renderText(item.etymology)}</p>}
                </div>
            ))}
        </div>
    );
};

const TheoremsComponent: React.FC<{ items: Theorem[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.name}</h4>
                    <div className="mt-2">
                        <h5 className="font-semibold text-slate-600 dark:text-slate-300">{t('proof')}:</h5>
                        <div className="mt-1 p-3 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-mono text-sm">
                            <p className="whitespace-pre-wrap">{renderText(item.proof)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FormulaDerivationsComponent: React.FC<{ items: FormulaDerivation[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 font-mono">{item.formula}</h4>
                     <div className="mt-2">
                        <h5 className="font-semibold text-slate-600 dark:text-slate-300">{t('derivation')}:</h5>
                        <div className="mt-1 p-3 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-mono text-sm">
                            <p className="whitespace-pre-wrap">{renderText(item.derivation)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const FormulaSheetComponent: React.FC<{ items: Formula[] | undefined }> = ({ items }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-lg font-mono text-slate-800 dark:text-slate-100">{item.formula}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>
            </div>
        ))}
    </div>
);

const ProblemSolvingTemplatesComponent: React.FC<{ items: ProblemSolvingTemplate[] | undefined }> = ({ items }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.problemType}</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    {item.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
            </div>
        ))}
    </div>
);

const CommonMistakesComponent: React.FC<{ items: CommonMistake[] | undefined }> = ({ items }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                        <h4 className="font-semibold text-red-600 dark:text-red-400">{t('mistake')}:</h4>
                        <p className="text-slate-700 dark:text-slate-300">{item.mistake}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400">{t('correction')}:</h4>
                        <p className="text-slate-700 dark:text-slate-300">{item.correction}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ExperimentsComponent: React.FC<{ items: Experiment[] | undefined }> = ({ items }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            {items?.map((item, index) => (
                 <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100">{item.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>
                    <div className="mt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('materials')}:</h5>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                            {item.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('steps')}:</h5>
                        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1">
                            {item.steps.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                     <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 rounded-r-md">
                        <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">{t('safetyGuidelines')}:</h5>
                        <p className="text-yellow-700 dark:text-yellow-300">{item.safetyGuidelines}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TimelineComponent: React.FC<{ items: TimelineEvent[] | undefined }> = ({ items }) => (
    <div className="border-l-2 border-primary/50 dark:border-primary/50 ml-2 pl-6 space-y-6" style={{borderColor: 'rgba(var(--c-primary), 0.5)'}}>
        {items?.map((item, index) => (
            <div key={index} className="relative">
                 <div className="absolute -left-[35px] top-1 h-4 w-4 rounded-full bg-primary" style={{backgroundColor: 'rgb(var(--c-primary))'}}></div>
                 <p className="font-bold text-lg text-primary-dark dark:text-primary-light" style={{color: 'rgb(var(--c-primary-dark))'}}>{item.year}: {item.event}</p>
                 <p className="text-slate-600 dark:text-slate-300">{item.significance}</p>
            </div>
        ))}
    </div>
);

const KeyFiguresComponent: React.FC<{ items: KeyFigure[] | undefined }> = ({ items }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.name}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{item.contribution}</p>
            </div>
        ))}
    </div>
);

const PrimarySourceAnalysisComponent: React.FC<{ items: PrimarySourceSnippet[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-300">
                        "{renderText(item.snippet)}"
                        <cite className="block not-italic mt-2 text-sm text-slate-500 dark:text-slate-400">— {item.sourceTitle}</cite>
                    </blockquote>
                    <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('analysis')}:</h5>
                        <p className="text-slate-600 dark:text-slate-300">{renderText(item.analysis)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CaseStudiesComponent: React.FC<{ items: CaseStudy[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
         <div className="space-y-6">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100">{item.title}</h4>
                    <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('background')}:</h5>
                        <p className="text-slate-600 dark:text-slate-300">{renderText(item.background)}</p>
                    </div>
                     <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('analysis')}:</h5>
                        <p className="text-slate-600 dark:text-slate-300">{renderText(item.analysis)}</p>
                    </div>
                     <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('conclusion')}:</h5>
                        <p className="text-slate-600 dark:text-slate-300">{renderText(item.conclusion)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const GrammarSpotlightComponent: React.FC<{ items: GrammarRule[] | undefined }> = ({ items }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.ruleName}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{item.explanation}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    {item.examples.map((ex, i) => <li key={i}><em>"{ex}"</em></li>)}
                </ul>
            </div>
        ))}
    </div>
);

const LiteraryDeviceAnalysisComponent: React.FC<{ items: LiteraryDevice[] | undefined }> = ({ items }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.deviceName}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{item.explanation}</p>
                 <p className="mt-2 text-slate-600 dark:text-slate-300"><strong>e.g.,</strong> <em>"{item.example}"</em></p>
            </div>
        ))}
    </div>
);

// --- END: Section Content Rendering Components ---


const CategorizedProblemsComponent: React.FC<{ problems: CategorizedProblems }> = ({ problems }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'conceptual' | 'application' | 'higherOrderThinking'>('conceptual');

    const tabs = [
        { id: 'conceptual', label: t('conceptual'), problems: problems.conceptual },
        { id: 'application', label: t('application'), problems: problems.application },
        { id: 'higherOrderThinking', label: t('higherOrderThinking'), problems: problems.higherOrderThinking },
    ];

    const currentProblems = tabs.find(tab => tab.id === activeTab)?.problems || [];

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
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
                            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
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


const ChapterView: React.FC<ChapterViewProps> = ({ grade, subject, chapter, student, language, onBack, onChapterSelect }) => {
  const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [isLoadingModule, setIsLoadingModule] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [diagrams, setDiagrams] = useState<{ [key: string]: DiagramState }>({});
  const [isFromDB, setIsFromDB] = useState(false);
  const { t, tCurriculum } = useLanguage();
  
  const [progress, setProgress] = useState<ChapterProgress>({});
  const progressDbKey = `progress-${student.id}-${grade.level}-${subject.name}-${chapter.title}`;

  const [showPostQuizAnalysis, setShowPostQuizAnalysis] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
    const initialDiagramStates = module.keyConcepts.reduce((acc, concept) => {
        acc[concept.conceptTitle] = { url: null, isLoading: true, error: null };
        return acc;
    }, {} as { [key: string]: DiagramState });
    setDiagrams(initialDiagramStates);

    for (const concept of module.keyConcepts) {
        const diagramDbKey = `diagram-${grade.level}-${subject.name}-${chapter.title}-${concept.conceptTitle}`;
        try {
            const cachedDiagram = await getDiagram(diagramDbKey);
            if (cachedDiagram) {
                 setDiagrams(prev => ({ ...prev, [concept.conceptTitle]: { url: cachedDiagram, isLoading: false, error: null } }));
                continue;
            }

            if (!concept.diagramDescription || concept.diagramDescription.trim().length < 10) {
                setDiagrams(prev => ({ ...prev, [concept.conceptTitle]: { url: null, isLoading: false, error: null } }));
                continue;
            }

            const generatedImageUrl = await generateDiagram(concept.diagramDescription, subject.name);
            await saveDiagram(diagramDbKey, generatedImageUrl);
            
            setDiagrams(prev => ({ ...prev, [concept.conceptTitle]: { url: generatedImageUrl, isLoading: false, error: null } }));
        } catch (err: any) {
            console.error(`Failed to process diagram for "${concept.conceptTitle}":`, err);
            let errorMessage = t('diagramFailedError'); // Default generic error
            if (err.message === "QUOTA_EXCEEDED") {
                errorMessage = t('diagramQuotaError'); // Specific quota error
            }
             setDiagrams(prev => ({ ...prev, [concept.conceptTitle]: { url: null, isLoading: false, error: errorMessage } }));
        }
    }
  }, [grade.level, subject.name, chapter.title, t]);

  const fetchContent = useCallback(async () => {
    resetStateForNewChapter();
    try {
      setIsLoadingModule(true);
      setError(null);

      const savedProgress = await getChapterProgress(progressDbKey, language);
      if (savedProgress) setProgress(savedProgress);
      
      const { content, fromCache } = await contentService.getChapterContent(
          grade.level, subject.name, chapter.title, student, language
      );

      setIsFromDB(fromCache);
      
      const textToSpeak = [
        content.introduction,
        ...content.keyConcepts.flatMap(c => [c.explanation, c.realWorldExample]),
        content.summary,
      ].filter(Boolean).join(' ');
      
      setFullText(textToSpeak);
      setLearningModule(content);
      fetchAllDiagrams(content);

    } catch (err: any) {
      setError(err.message || t('unknownError'));
    } finally {
        setIsLoadingModule(false);
    }
  }, [grade.level, subject.name, chapter.title, student, progressDbKey, language, t, fetchAllDiagrams]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    return () => {
      // Cleanup TTS on unmount
      if (isSpeaking) stop();
    };
  }, [isSpeaking, stop]);
  
  const handleGenerateQuiz = async () => {
    if (!learningModule) return;
    setIsGeneratingQuiz(true);
    setError(null);
    try {
      const generatedQuiz = await generateQuiz(learningModule.keyConcepts, language);
      setQuiz(generatedQuiz);
      setShowQuiz(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizFinish = useCallback(async (result: { score: number }) => {
    setQuizScore(result.score);
    setShowQuiz(false);
    setShowPostQuizAnalysis(true);
    setIsGeneratingRecommendation(true);
    if (quiz) {
      try {
        const rec = await generateNextStepRecommendation(grade.level, subject.name, chapter.title, result.score, quiz.length, subject.chapters, language);
        setRecommendation(rec);
        if (result.score / quiz.length >= 0.85) {
          setShowConfetti(true);
        }
      } catch (err) {
        console.error("Failed to get recommendation:", err);
      } finally {
        setIsGeneratingRecommendation(false);
      }
    }
  }, [grade.level, subject.name, chapter.title, quiz, subject.chapters, language]);

  const handleNextChapter = useCallback(() => {
    if (recommendation && recommendation.nextChapterTitle) {
      const nextChapter = subject.chapters.find(c => c.title === recommendation.nextChapterTitle);
      if (nextChapter) {
        onChapterSelect(nextChapter);
      }
    }
  }, [recommendation, subject.chapters, onChapterSelect]);

  const handleReview = useCallback(() => {
    setShowPostQuizAnalysis(false);
    setShowConfetti(false);
  }, []);

  const handlePrerequisite = useCallback(() => {
     if (recommendation && recommendation.prerequisiteChapterTitle) {
      const prereqChapter = subject.chapters.find(c => c.title === recommendation.prerequisiteChapterTitle);
      if (prereqChapter) {
        onChapterSelect(prereqChapter);
      }
    }
  }, [recommendation, subject.chapters, onChapterSelect]);

  const handleMarkAsInProgress = useCallback((conceptTitle: string) => {
    const newProgress = { ...progress, [conceptTitle]: 'in-progress' as const };
    setProgress(newProgress);
    saveChapterProgress(progressDbKey, newProgress, language);
  }, [progress, progressDbKey, language]);
  
  const renderTextWithTTS = (text: string) => {
    const sentences = getSentences(text);
    return (
        <span className="tts-container">
            {sentences.map((sentence, index) => (
                <span key={index} className={`tts-sentence ${currentSentenceIndex === index ? 'speaking' : ''}`}>
                    {sentence}{' '}
                </span>
            ))}
        </span>
    );
  };
  
  const allConceptsMastered = useMemo(() => {
    if (!learningModule) return false;
    return learningModule.keyConcepts.every(c => progress[c.conceptTitle] === 'mastered');
  }, [learningModule, progress]);


  if (isLoadingModule) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
        <LoadingSpinner />
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">{isFromDB ? t('loadingFromCache') : t('aiGeneratingLesson')}</p>
        {isFromDB && <p className="text-sm text-slate-500">{t('loadingFromCacheSubtext')}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('errorOccurred')}</h3>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">{t('back')}</button>
      </div>
    );
  }
  
  if (showQuiz && quiz) {
    return <Quiz questions={quiz} onBack={() => setShowQuiz(false)} chapterTitle={chapter.title} onFinish={handleQuizFinish} />;
  }
  
  if (showPostQuizAnalysis) {
    return (
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          {showConfetti && <Confetti />}
          <TrophySolid className="h-20 w-20 mx-auto text-amber-400" />
          <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-4">{t('chapterComplete')}</h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 mt-2">{t('quizScoreSummary', {score: quizScore, total: quiz?.length})}</p>
          
          <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            {isGeneratingRecommendation ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner /><p className="ml-3 text-slate-600 dark:text-slate-300">{t('generatingRecommendation')}</p>
              </div>
            ) : recommendation ? (
              <>
                 <h3 className="text-2xl font-bold text-primary dark:text-primary-light" style={{color: 'rgb(var(--c-primary))'}}>{t('nextSteps')}</h3>
                 <p className="text-slate-600 dark:text-slate-300 mt-2">{recommendation.recommendationText}</p>
                 <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    {recommendation.action === 'CONTINUE' && recommendation.nextChapterTitle && (
                         <button onClick={handleNextChapter} className="flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg btn-primary-gradient">
                            <ForwardIcon className="h-5 w-5 mr-2"/> {t('startNextChapter', { chapter: tCurriculum(recommendation.nextChapterTitle) })}
                         </button>
                    )}
                     {recommendation.action === 'REVISE_PREREQUISITE' && recommendation.prerequisiteChapterTitle && (
                         <button onClick={handlePrerequisite} className="flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                            <ArrowPathIcon className="h-5 w-5 mr-2"/> {t('revisePrerequisite', { chapter: tCurriculum(recommendation.prerequisiteChapterTitle) })}
                         </button>
                    )}
                     <button onClick={handleReview} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                       {t('reviewThisLesson')}
                    </button>
                 </div>
              </>
            ) : <p className="text-slate-500">{t('recommendationFailed')}</p>}
          </div>
        </div>
    );
  }

  if (!learningModule) {
    return <div className="text-center"><p>{t('noContent')}</p></div>;
  }

  const sections = [
        { title: t('prerequisitesCheck'), content: learningModule.prerequisitesCheck, icon: LinkIcon, component: <StringListComponent items={learningModule.prerequisitesCheck} /> },
        { title: t('learningObjectives'), content: learningModule.learningObjectives, icon: CheckCircleIcon, component: <StringListComponent items={learningModule.learningObjectives} /> },
        { title: t('keyTheoremsAndProofs'), content: learningModule.keyTheoremsAndProofs, icon: VariableIcon, component: <TheoremsComponent items={learningModule.keyTheoremsAndProofs} renderText={renderTextWithTTS} /> },
        { title: t('formulaDerivations'), content: learningModule.formulaDerivations, icon: CalculatorIcon, component: <FormulaDerivationsComponent items={learningModule.formulaDerivations} renderText={renderTextWithTTS} /> },
        { title: t('formulaSheet'), content: learningModule.formulaSheet, icon: ClipboardDocumentListIcon, component: <FormulaSheetComponent items={learningModule.formulaSheet} /> },
        { title: t('problemSolvingTemplates'), content: learningModule.problemSolvingTemplates, icon: PuzzlePieceIcon, component: <ProblemSolvingTemplatesComponent items={learningModule.problemSolvingTemplates} /> },
        { title: t('categorizedProblems'), content: learningModule.categorizedProblems, icon: QuestionMarkCircleIcon, component: <CategorizedProblemsComponent problems={learningModule.categorizedProblems!} /> },
        { title: t('commonMistakes'), content: learningModule.commonMistakes, icon: ExclamationTriangleSolid, component: <CommonMistakesComponent items={learningModule.commonMistakes} /> },
        { title: t('keyLawsAndPrinciples'), content: learningModule.keyLawsAndPrinciples, icon: ScaleIcon, component: <SimpleTextComponent text={learningModule.keyLawsAndPrinciples?.map(p => `${p.name}: ${p.explanation}`).join('\n')} renderText={renderTextWithTTS} /> },
        { title: t('solvedNumericalProblems'), content: learningModule.solvedNumericalProblems, icon: CalculatorIcon, component: <TheoremsComponent items={learningModule.solvedNumericalProblems?.map(p => ({name: p.question, proof: p.solution}))} renderText={renderTextWithTTS} /> },
        { title: t('experiments'), content: learningModule.experiments, icon: BeakerIcon, component: <ExperimentsComponent items={learningModule.experiments} /> },
        { title: t('scientificMethodApplications'), content: learningModule.scientificMethodApplications, icon: LightBulbIcon, component: <SimpleTextComponent text={learningModule.scientificMethodApplications} renderText={renderTextWithTTS} /> },
        { title: t('currentDiscoveries'), content: learningModule.currentDiscoveries, icon: SparklesSolid, component: <SimpleTextComponent text={learningModule.currentDiscoveries} renderText={renderTextWithTTS} /> },
        { title: t('environmentalAwareness'), content: learningModule.environmentalAwareness, icon: GlobeAltIcon, component: <SimpleTextComponent text={learningModule.environmentalAwareness} renderText={renderTextWithTTS} /> },
        { title: t('interdisciplinaryConnections'), content: learningModule.interdisciplinaryConnections, icon: LinkIcon, component: <SimpleTextComponent text={learningModule.interdisciplinaryConnections} renderText={renderTextWithTTS} /> },
        { title: t('timelineOfEvents'), content: learningModule.timelineOfEvents, icon: ClockIcon, component: <TimelineComponent items={learningModule.timelineOfEvents} /> },
        { title: t('keyFigures'), content: learningModule.keyFigures, icon: UserGroupIcon, component: <KeyFiguresComponent items={learningModule.keyFigures} /> },
        { title: t('primarySourceAnalysis'), content: learningModule.primarySourceAnalysis, icon: DocumentTextIcon, component: <PrimarySourceAnalysisComponent items={learningModule.primarySourceAnalysis} renderText={renderTextWithTTS} /> },
        { title: t('inDepthCaseStudies'), content: learningModule.inDepthCaseStudies, icon: AcademicCapIcon, component: <CaseStudiesComponent items={learningModule.inDepthCaseStudies} renderText={renderTextWithTTS} /> },
        { title: t('grammarSpotlight'), content: learningModule.grammarSpotlight, icon: LanguageIcon, component: <GrammarSpotlightComponent items={learningModule.grammarSpotlight} /> },
        { title: t('literaryDeviceAnalysis'), content: learningModule.literaryDeviceAnalysis, icon: BookOpenIcon, component: <LiteraryDeviceAnalysisComponent items={learningModule.literaryDeviceAnalysis} /> },
        { title: t('vocabularyDeepDive'), content: learningModule.vocabularyDeepDive, icon: LanguageIcon, component: <VocabularyComponent items={learningModule.vocabularyDeepDive} renderText={renderTextWithTTS} /> },
        { title: t('selfAssessmentChecklist'), content: learningModule.selfAssessmentChecklist, icon: CheckBadgeIcon, component: <StringListComponent items={learningModule.selfAssessmentChecklist} /> },
        { title: t('extensionActivities'), content: learningModule.extensionActivities, icon: RocketLaunchIcon, component: <StringListComponent items={learningModule.extensionActivities} /> },
        { title: t('remedialActivities'), content: learningModule.remedialActivities, icon: ArrowPathIcon, component: <StringListComponent items={learningModule.remedialActivities} /> },
        { title: t('careerConnections'), content: learningModule.careerConnections, icon: AcademicCapIcon, component: <SimpleTextComponent text={learningModule.careerConnections} renderText={renderTextWithTTS} /> },
        { title: t('technologyIntegration'), content: learningModule.technologyIntegration, icon: CpuChipIcon, component: <SimpleTextComponent text={learningModule.technologyIntegration} renderText={renderTextWithTTS} /> },
        { title: t('summary'), content: learningModule.summary, icon: ArchiveBoxIcon, component: <SimpleTextComponent text={learningModule.summary} renderText={renderTextWithTTS} /> },
    ].filter(section => section.content && (Array.isArray(section.content) ? section.content.length > 0 : true));


  return (
    <div className="animate-fade-in relative pb-24">
      <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToChapters')}
      </button>

      {isFromDB && (
        <div role="status" className="flex items-center bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg mb-6">
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          {t('loadedFromCache')}
        </div>
      )}

      <header className="mb-8 prose prose-lg max-w-none prose-indigo dark:prose-invert">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{tCurriculum(learningModule.chapterTitle)}</h2>
        <div className="introduction-text">{renderTextWithTTS(learningModule.introduction)}</div>
      </header>

      <main className="space-y-12">
        <section>
          <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
            <MapIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
            {t('keyConcepts')}
          </h3>
          <div className="space-y-8">
            {learningModule.keyConcepts.map(concept => (
              <ConceptCard
                key={concept.conceptTitle}
                concept={concept}
                grade={grade}
                subject={subject}
                chapter={chapter}
                language={language}
                imageUrl={diagrams[concept.conceptTitle]?.url || null}
                isDiagramLoading={diagrams[concept.conceptTitle]?.isLoading || false}
                diagramError={diagrams[concept.conceptTitle]?.error || null}
                progressStatus={progress[concept.conceptTitle] || 'not-started'}
                onMarkAsInProgress={() => handleMarkAsInProgress(concept.conceptTitle)}
                renderText={renderTextWithTTS}
              />
            ))}
          </div>
        </section>
        
        {sections.map(section => (
            <section key={section.title}>
                 <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                    <section.icon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                    {section.title}
                </h3>
                <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                    {section.component}
                </div>
            </section>
        ))}

        <section className="text-center pt-8 border-t-2 border-dashed dark:border-slate-700">
          <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200">{t('readyToTestKnowledge')}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-xl mx-auto">{t('quizPrompt')}</p>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGeneratingQuiz || allConceptsMastered}
            className="flex items-center justify-center mx-auto px-8 py-4 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGeneratingQuiz ? (
              <><LoadingSpinner /><span className="ml-3">{t('generatingQuiz')}</span></>
            ) : (
              <><RocketLaunchIcon className="h-6 w-6 mr-3" />{t('challengeMe')}</>
            )}
          </button>
           {allConceptsMastered && <p className="text-green-600 dark:text-green-400 font-semibold mt-3">{t('allConceptsMastered')}</p>}
        </section>
      </main>

      {isSupported && fullText && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-sm text-white rounded-xl shadow-2xl p-3 flex items-center justify-center gap-4">
                <button onClick={isSpeaking ? stop : () => play(fullText)} className="p-2 hover:bg-white/20 rounded-full transition">
                    {isSpeaking ? <StopCircleIcon className="h-7 w-7" /> : <PlayCircleIcon className="h-7 w-7" />}
                </button>
                <button onClick={isPaused ? resume : pause} disabled={!isSpeaking} className="p-2 hover:bg-white/20 rounded-full transition disabled:opacity-50">
                    {isPaused ? <PlayCircleIcon className="h-7 w-7" /> : <PauseCircleIcon className="h-7 w-7" />}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChapterView;