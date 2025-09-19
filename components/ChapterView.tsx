import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grade, Subject, Chapter, LearningModule, QuizQuestion, NextStepRecommendation, ChapterProgress, Student, CategorizedProblems, VocabularyDeepDive, Theorem, FormulaDerivation, Formula, ProblemSolvingTemplate, CommonMistake, Experiment, TimelineEvent, KeyFigure, PrimarySourceSnippet, CaseStudy, GrammarRule, LiteraryDevice, HOTQuestion } from '../types';
import * as contentService from '../services/contentService';
import { generateQuiz, generateNextStepRecommendation, generateConceptMapImage, generateSectionContent } from '../services/geminiService';
import { getChapterProgress, saveChapterProgress, getConceptMap, saveConceptMap } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import ConceptCard from './ConceptCard';
import Quiz from './Quiz';
import Confetti from './Confetti';
import { RocketLaunchIcon, ArchiveBoxIcon, LightBulbIcon, ArrowPathIcon, ForwardIcon, CheckCircleIcon, BookOpenIcon, VariableIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon as ExclamationTriangleSolid, TrophyIcon as TrophySolid, BeakerIcon, GlobeAltIcon, LinkIcon, AcademicCapIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, LanguageIcon, SparklesIcon as SparklesSolid, MapIcon, PuzzlePieceIcon, CalculatorIcon, ScaleIcon, ShareIcon, CheckBadgeIcon, CpuChipIcon, SpeakerWaveIcon, FilmIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { useTTS } from '../hooks/useTTS';
import { useAuth } from '../contexts/AuthContext';
import VideoSimulationPlayer from './VideoSimulationPlayer';


interface ChapterViewProps {
  grade: Grade;
  subject: Subject;
  chapter: Chapter;
  student: Student;
  language: string;
  onBackToChapters: () => void;
  onBackToSubjects: () => void;
  onChapterSelect: (chapter: Chapter) => void;
}

// A more robust sentence tokenizer that handles abbreviations.
const getSentences = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];
    const sentences = text.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(Boolean);
};

// --- START: Section Configuration for Subject-Specific Content ---

type SectionKey = keyof LearningModule;

const commonSections: SectionKey[] = [
    'prerequisitesCheck', 'vocabularyDeepDive', 'higherOrderThinkingQuestions',
    'learningTricksAndMnemonics', 'competitiveExamMapping', 'selfAssessmentChecklist',
    'extensionActivities', 'remedialActivities', 'careerConnections', 'technologyIntegration'
];

const subjectConfig: Record<string, SectionKey[]> = {
    'mathematics': ['keyTheoremsAndProofs', 'formulaDerivations', 'formulaSheet', 'problemSolvingTemplates', 'categorizedProblems', 'commonMistakes'],
    'physics': ['keyLawsAndPrinciples', 'formulaDerivations', 'formulaSheet', 'solvedNumericalProblems', 'problemSolvingTemplates', 'categorizedProblems', 'experiments', 'commonMistakes', 'scientificMethodApplications', 'interdisciplinaryConnections'],
    'chemistry': ['keyLawsAndPrinciples', 'formulaSheet', 'solvedNumericalProblems', 'categorizedProblems', 'experiments', 'commonMistakes', 'scientificMethodApplications', 'environmentalAwareness', 'interdisciplinaryConnections'],
    'biology': ['keyLawsAndPrinciples', 'experiments', 'scientificMethodApplications', 'environmentalAwareness', 'interdisciplinaryConnections', 'categorizedProblems'],
    'history': ['timelineOfEvents', 'keyFigures', 'primarySourceAnalysis', 'inDepthCaseStudies', 'interdisciplinaryConnections'],
    'geography': ['keyLawsAndPrinciples', 'inDepthCaseStudies', 'environmentalAwareness', 'interdisciplinaryConnections'],
    'political science': ['keyFigures', 'primarySourceAnalysis', 'inDepthCaseStudies', 'interdisciplinaryConnections'],
    'economics': ['keyLawsAndPrinciples', 'inDepthCaseStudies', 'categorizedProblems', 'interdisciplinaryConnections'],
    'english': ['grammarSpotlight', 'literaryDeviceAnalysis', 'vocabularyDeepDive'],
    'hindi': ['grammarSpotlight', 'literaryDeviceAnalysis', 'vocabularyDeepDive'],
    'computer science': ['problemSolvingTemplates', 'categorizedProblems', 'technologyIntegration'],
    'evs': ['keyLawsAndPrinciples', 'experiments', 'environmentalAwareness', 'interdisciplinaryConnections'],
    'social studies': ['timelineOfEvents', 'keyFigures', 'primarySourceAnalysis', 'inDepthCaseStudies', 'environmentalAwareness', 'interdisciplinaryConnections'],
    'accountancy': ['keyLawsAndPrinciples', 'problemSolvingTemplates', 'categorizedProblems', 'inDepthCaseStudies', 'commonMistakes'],
    'business studies': ['keyLawsAndPrinciples', 'problemSolvingTemplates', 'categorizedProblems', 'inDepthCaseStudies'],
    'sociology': ['keyFigures', 'primarySourceAnalysis', 'inDepthCaseStudies'],
    'robotics': ['problemSolvingTemplates', 'experiments', 'technologyIntegration', 'categorizedProblems'],
    'ai and machine learning': ['problemSolvingTemplates', 'inDepthCaseStudies', 'technologyIntegration'],
};

const getSectionsForSubject = (subjectName: string): SectionKey[] => {
    const key = subjectName.toLowerCase();
    // Find the most specific matching key (e.g., "robotics & ai" should match "robotics")
    const specificConfigKey = Object.keys(subjectConfig).find(k => key.includes(k));
    const specificSections = specificConfigKey ? subjectConfig[specificConfigKey] : [];
    
    // Combine specific sections with common ones, ensuring no duplicates, and always add summary at the end.
    // FIX: Use Array.from(new Set(...)) to preserve the SectionKey[] type, as the spread operator was incorrectly inferring string[].
    return Array.from(new Set([...specificSections, ...commonSections, 'summary']));
};


// --- START: Section Content Rendering Components ---

const SimpleTextComponent: React.FC<{ text: string | undefined, renderText: (text: string) => React.ReactNode }> = ({ text, renderText }) => text ? <p>{renderText(text)}</p> : null;

const StringListComponent: React.FC<{ items: string[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <ul className="list-disc list-inside space-y-2">
        {items?.map((item, index) => <li key={index}>{renderText(item)}</li>)}
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

const TheoremsComponent: React.FC<{ items: (Theorem[] | HOTQuestion[]) | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    const isTheorem = (item: any): item is Theorem => 'proof' in item;

    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{isTheorem(item) ? item.name : item.question}</h4>
                    <div className="mt-2">
                        <h5 className="font-semibold text-slate-600 dark:text-slate-300">{isTheorem(item) ? t('proof') : 'Hint'}:</h5>
                        <div className="mt-1 p-3 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-mono text-sm">
                            <p className="whitespace-pre-wrap">{renderText(isTheorem(item) ? item.proof : item.hint)}</p>
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

const FormulaSheetComponent: React.FC<{ items: Formula[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-lg font-mono text-slate-800 dark:text-slate-100">{item.formula}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{renderText(item.description)}</p>
            </div>
        ))}
    </div>
);

const ProblemSolvingTemplatesComponent: React.FC<{ items: ProblemSolvingTemplate[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.problemType}</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    {item.steps.map((step, i) => <li key={i}>{renderText(step)}</li>)}
                </ol>
            </div>
        ))}
    </div>
);

const CommonMistakesComponent: React.FC<{ items: CommonMistake[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            {items?.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                        <h4 className="font-semibold text-red-600 dark:text-red-400">{t('mistake')}:</h4>
                        <p className="text-slate-700 dark:text-slate-300">{renderText(item.mistake)}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400">{t('correction')}:</h4>
                        <p className="text-slate-700 dark:text-slate-300">{renderText(item.correction)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ExperimentsComponent: React.FC<{ items: Experiment[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6">
            {items?.map((item, index) => (
                 <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100">{item.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{renderText(item.description)}</p>
                    <div className="mt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('materials')}:</h5>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
                            {item.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('steps')}:</h5>
                        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1">
                            {item.steps.map((step, i) => <li key={i}>{renderText(step)}</li>)}
                        </ol>
                    </div>
                     <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 rounded-r-md">
                        <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">{t('safetyGuidelines')}:</h5>
                        <p className="text-yellow-700 dark:text-yellow-300">{renderText(item.safetyGuidelines)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TimelineComponent: React.FC<{ items: TimelineEvent[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <div className="border-l-2 border-primary/50 dark:border-primary/50 ml-2 pl-6 space-y-6" style={{borderColor: 'rgba(var(--c-primary), 0.5)'}}>
        {items?.map((item, index) => (
            <div key={index} className="relative">
                 <div className="absolute -left-[35px] top-1 h-4 w-4 rounded-full bg-primary" style={{backgroundColor: 'rgb(var(--c-primary))'}}></div>
                 <p className="font-bold text-lg text-primary-dark dark:text-primary-light" style={{color: 'rgb(var(--c-primary-dark))'}}>{item.year}: {renderText(item.event)}</p>
                 <p className="text-slate-600 dark:text-slate-300">{renderText(item.significance)}</p>
            </div>
        ))}
    </div>
);

const KeyFiguresComponent: React.FC<{ items: KeyFigure[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.name}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{renderText(item.contribution)}</p>
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

const GrammarSpotlightComponent: React.FC<{ items: GrammarRule[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.ruleName}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{renderText(item.explanation)}</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                    {item.examples.map((ex, i) => <li key={i}><em>"{renderText(ex)}"</em></li>)}
                </ul>
            </div>
        ))}
    </div>
);

const LiteraryDeviceAnalysisComponent: React.FC<{ items: LiteraryDevice[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <div className="space-y-4">
        {items?.map((item, index) => (
            <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.deviceName}</h4>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{renderText(item.explanation)}</p>
                 <p className="mt-2 text-slate-600 dark:text-slate-300"><strong>e.g.,</strong> <em>"{renderText(item.example)}"</em></p>
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


const ChapterView: React.FC<ChapterViewProps> = ({ grade, subject, chapter, student, language, onBackToChapters, onBackToSubjects, onChapterSelect }) => {
  const [learningModule, setLearningModule] = useState<LearningModule | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [isLoadingModule, setIsLoadingModule] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isFromDB, setIsFromDB] = useState(false);
  const { t, tCurriculum } = useLanguage();
  
  const [progress, setProgress] = useState<ChapterProgress>({});
  const progressDbKey = `progress-${student.id}-${grade.level}-${subject.name}-${chapter.title}`;

  const [showPostQuizAnalysis, setShowPostQuizAnalysis] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [recommendation, setRecommendation] = useState<NextStepRecommendation | null>(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [conceptMapUrl, setConceptMapUrl] = useState<string | null>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});

  const { isSupported, isSpeaking, isPaused, currentSentenceIndex, play, pause, resume, stop } = useTTS();
  const [fullText, setFullText] = useState('');

  const [chapterPoints, setChapterPoints] = useState(0);
  const [chapterBonusPoints, setChapterBonusPoints] = useState(0);
  const CHAPTER_BONUS_POINTS = 100;

  const sentenceOffset = useRef(0);
    useEffect(() => {
        // This effect runs after every render, resetting the offset for the next render pass.
        sentenceOffset.current = 0;
    });

  const resetStateForNewChapter = () => {
    setLearningModule(null);
    setQuiz(null);
    setShowQuiz(false);
    setShowPostQuizAnalysis(false);
    setRecommendation(null);
    setConceptMapUrl(null);
    setMapError(null);
    setProgress({});
    setShowConfetti(false);
    setLoadingSections({});
    if (isSpeaking) stop();
    setFullText('');
    setChapterPoints(0);
    setChapterBonusPoints(0);
  }
  
  const sections = useMemo(() => {
    if (!learningModule) return [];
    
    // Defines all possible sections and their rendering configurations.
    const allSectionsMap: { [K in SectionKey]?: { title: string; content: LearningModule[K]; icon: React.ElementType; type: string; text?: string; } } = {
        prerequisitesCheck: { title: t('prerequisitesCheck'), content: learningModule.prerequisitesCheck, icon: LinkIcon, type: 'string-list' },
        keyTheoremsAndProofs: { title: t('keyTheoremsAndProofs'), content: learningModule.keyTheoremsAndProofs, icon: VariableIcon, type: 'theorems' },
        formulaDerivations: { title: t('formulaDerivations'), content: learningModule.formulaDerivations, icon: CalculatorIcon, type: 'derivations' },
        formulaSheet: { title: t('formulaSheet'), content: learningModule.formulaSheet, icon: ClipboardDocumentListIcon, type: 'formulas' },
        problemSolvingTemplates: { title: t('problemSolvingTemplates'), content: learningModule.problemSolvingTemplates, icon: PuzzlePieceIcon, type: 'templates' },
        categorizedProblems: { title: t('categorizedProblems'), content: learningModule.categorizedProblems, icon: QuestionMarkCircleIcon, type: 'problems' },
        commonMistakes: { title: t('commonMistakes'), content: learningModule.commonMistakes, icon: ExclamationTriangleSolid, type: 'mistakes' },
        keyLawsAndPrinciples: { title: t('keyLawsAndPrinciples'), content: learningModule.keyLawsAndPrinciples, icon: ScaleIcon, type: 'theorems' }, // Re-using theorem component
        solvedNumericalProblems: { title: t('solvedNumericalProblems'), content: learningModule.solvedNumericalProblems, icon: CalculatorIcon, type: 'theorems' }, // Re-using theorem component
        experiments: { title: t('experiments'), content: learningModule.experiments, icon: BeakerIcon, type: 'experiments' },
        scientificMethodApplications: { title: t('scientificMethodApplications'), content: learningModule.scientificMethodApplications, icon: LightBulbIcon, type: 'simple-text', text: learningModule.scientificMethodApplications },
        currentDiscoveries: { title: t('currentDiscoveries'), content: learningModule.currentDiscoveries, icon: SparklesSolid, type: 'simple-text', text: learningModule.currentDiscoveries },
        environmentalAwareness: { title: t('environmentalAwareness'), content: learningModule.environmentalAwareness, icon: GlobeAltIcon, type: 'simple-text', text: learningModule.environmentalAwareness },
        interdisciplinaryConnections: { title: t('interdisciplinaryConnections'), content: learningModule.interdisciplinaryConnections, icon: LinkIcon, type: 'simple-text', text: learningModule.interdisciplinaryConnections },
        timelineOfEvents: { title: t('timelineOfEvents'), content: learningModule.timelineOfEvents, icon: ClockIcon, type: 'timeline' },
        keyFigures: { title: t('keyFigures'), content: learningModule.keyFigures, icon: UserGroupIcon, type: 'key-figures' },
        primarySourceAnalysis: { title: t('primarySourceAnalysis'), content: learningModule.primarySourceAnalysis, icon: DocumentTextIcon, type: 'sources' },
        inDepthCaseStudies: { title: t('inDepthCaseStudies'), content: learningModule.inDepthCaseStudies, icon: AcademicCapIcon, type: 'case-studies' },
        grammarSpotlight: { title: t('grammarSpotlight'), content: learningModule.grammarSpotlight, icon: LanguageIcon, type: 'grammar' },
        literaryDeviceAnalysis: { title: t('literaryDeviceAnalysis'), content: learningModule.literaryDeviceAnalysis, icon: BookOpenIcon, type: 'literary' },
        vocabularyDeepDive: { title: t('vocabularyDeepDive'), content: learningModule.vocabularyDeepDive, icon: LanguageIcon, type: 'vocab' },
        selfAssessmentChecklist: { title: t('selfAssessmentChecklist'), content: learningModule.selfAssessmentChecklist, icon: CheckBadgeIcon, type: 'string-list' },
        extensionActivities: { title: t('extensionActivities'), content: learningModule.extensionActivities, icon: RocketLaunchIcon, type: 'string-list' },
        remedialActivities: { title: t('remedialActivities'), content: learningModule.remedialActivities, icon: ArrowPathIcon, type: 'string-list' },
        careerConnections: { title: t('careerConnections'), content: learningModule.careerConnections, icon: AcademicCapIcon, type: 'simple-text', text: learningModule.careerConnections },
        technologyIntegration: { title: t('technologyIntegration'), content: learningModule.technologyIntegration, icon: CpuChipIcon, type: 'simple-text', text: learningModule.technologyIntegration },
        summary: { title: t('summary'), content: learningModule.summary, icon: ArchiveBoxIcon, type: 'simple-text', text: learningModule.summary },
        learningTricksAndMnemonics: { title: t('learningTricksAndMnemonics'), content: learningModule.learningTricksAndMnemonics, icon: LightBulbIcon, type: 'string-list' },
        competitiveExamMapping: { title: t('competitiveExamMapping'), content: learningModule.competitiveExamMapping, icon: TrophySolid, type: 'simple-text', text: learningModule.competitiveExamMapping },
        higherOrderThinkingQuestions: { title: t('higherOrderThinkingQuestions'), content: learningModule.higherOrderThinkingQuestions, icon: QuestionMarkCircleIcon, type: 'theorems'},
    };

    // Get the list of relevant section keys for the current subject
    const relevantSectionKeys = getSectionsForSubject(subject.name);
    
    // Build the final array of sections to render, in the order defined by the config
    return relevantSectionKeys
        .map(key => {
            const sectionConfig = allSectionsMap[key];
            if (sectionConfig) {
                return { key, ...sectionConfig };
            }
            return null;
        })
        // FIX: Corrected the type predicate to use SectionKey (keyof LearningModule) instead of string for the 'key' property to match the inferred type.
        .filter((section): section is { key: SectionKey; title: string; content: any; icon: React.ElementType; type: string; text?: string; } => section !== null);

  }, [learningModule, t, subject.name]);

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
      setLearningModule(content);
    } catch (err: any) {
      setError(err.message || t('unknownError'));
    } finally {
        setIsLoadingModule(false);
    }
  }, [grade.level, subject.name, chapter.title, student, progressDbKey, language, t]);

    useEffect(() => {
        const generateAndCacheMap = async () => {
            if (!learningModule || !learningModule.conceptMap) {
                setConceptMapUrl(null);
                setMapError(null);
                return;
            }

            setIsGeneratingMap(true);
            setMapError(null);
            const mapDbKey = `concept-map-${grade.level}-${subject.name}-${chapter.title}-${language}`;
            
            try {
                const cachedMap = await getConceptMap(mapDbKey);
                if (cachedMap) {
                    setConceptMapUrl(cachedMap);
                    return;
                }
                const generatedMapUrl = await generateConceptMapImage(learningModule.conceptMap);
                await saveConceptMap(mapDbKey, generatedMapUrl);
                setConceptMapUrl(generatedMapUrl);

            } catch (err: any) {
                console.error("Failed to generate concept map:", err);
                setMapError(t('conceptMapError'));
            } finally {
                setIsGeneratingMap(false);
            }
        };

        generateAndCacheMap();
    }, [learningModule, grade.level, subject.name, chapter.title, language, t]);

    useEffect(() => {
        if (!learningModule) return;

        const learningObjectivesText = learningModule.learningObjectives ? learningModule.learningObjectives.join('. ') : '';

        // Construct the full text for TTS in render order
        const textParts: (string | undefined)[] = [
            learningModule.introduction,
            learningObjectivesText
        ];
        
        learningModule.keyConcepts.forEach(c => {
            textParts.push(c.explanation);
            textParts.push(c.realWorldExample);
        });
        
        sections.forEach(section => {
             const sectionContent = learningModule[section.key as keyof LearningModule];
             if (!sectionContent) return; // Don't include text for unloaded sections
             switch(section.type) {
                case 'simple-text':
                    textParts.push(section.text);
                    break;
                case 'vocab':
                    (section.content as VocabularyDeepDive[])?.forEach(item => {
                        textParts.push(item.definition);
                        textParts.push(item.usageInSentence);
                        if (item.etymology) textParts.push(item.etymology);
                    });
                    break;
                case 'theorems':
                    (section.content as (Theorem[] | HOTQuestion[]))?.forEach(item => {
                        if ('proof' in item) {
                            textParts.push(item.name);
                            textParts.push(item.proof);
                        } else {
                            textParts.push(item.question);
                            textParts.push(item.hint);
                        }
                    });
                    break;
                case 'derivations':
                    (section.content as FormulaDerivation[])?.forEach(item => {
                        textParts.push(item.formula);
                        textParts.push(item.derivation);
                    });
                    break;
                case 'sources':
                     (section.content as PrimarySourceSnippet[])?.forEach(item => {
                        textParts.push(item.snippet);
                        textParts.push(item.analysis);
                    });
                    break;
                case 'case-studies':
                     (section.content as CaseStudy[])?.forEach(item => {
                        textParts.push(item.title);
                        textParts.push(item.background);
                        textParts.push(item.analysis);
                        textParts.push(item.conclusion);
                    });
                    break;
             }
        });
      
        setFullText(textParts.filter(Boolean).join(' '));

  }, [learningModule, sections]);

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
  
  const allConceptsMastered = useMemo(() => {
    if (!learningModule || !learningModule.keyConcepts.length) return false;
    return learningModule.keyConcepts.every(c => progress[c.conceptTitle] === 'mastered');
  }, [learningModule, progress]);

  const handleConceptMastered = useCallback((conceptTitle: string) => {
    if (progress[conceptTitle] === 'mastered') {
      return; 
    }
    const newProgress = { ...progress, [conceptTitle]: 'mastered' as const };
    setProgress(newProgress);
    saveChapterProgress(progressDbKey, newProgress, language);
    
    const totalConcepts = learningModule?.keyConcepts.length || 0;
    const newMasteredCount = Object.values(newProgress).filter(p => p === 'mastered').length;

    if (totalConcepts > 0 && newMasteredCount === totalConcepts) {
        setShowConfetti(true);
        setChapterBonusPoints(CHAPTER_BONUS_POINTS);
    }
  }, [progress, progressDbKey, language, learningModule]);

  useEffect(() => {
    const masteredCount = Object.values(progress).filter(p => p === 'mastered').length;
    setChapterPoints(masteredCount * 50);
    
    if (allConceptsMastered) {
        setChapterBonusPoints(CHAPTER_BONUS_POINTS);
    } else {
        setChapterBonusPoints(0);
    }
  }, [progress, allConceptsMastered]);

  const renderTextWithTTS = useCallback((text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') return text;
    const localSentences = getSentences(text);
    const startIndex = sentenceOffset.current;
    sentenceOffset.current += localSentences.length;

    return (
        <>
            {localSentences.map((sentence, index) => {
                const globalIndex = startIndex + index;
                const isSpeaking = globalIndex === currentSentenceIndex;
                return (
                    <span key={index} className={isSpeaking ? 'tts-highlight' : ''}>
                        {sentence}{' '}
                    </span>
                );
            })}
        </>
    );
  }, [currentSentenceIndex]);
  
  const handleLoadSection = async (sectionKey: keyof LearningModule) => {
      if (!learningModule) return;
      setLoadingSections(prev => ({ ...prev, [sectionKey]: true }));
      setError(null);
      try {
          const chapterContext = `Introduction: ${learningModule.introduction}. Key Concepts: ${learningModule.keyConcepts.map(c => c.conceptTitle).join(', ')}.`;
          const sectionData = await generateSectionContent(
              grade.level, subject.name, chapter.title, language, sectionKey, chapterContext
          );
          const newModule = { ...learningModule, ...sectionData };
          setLearningModule(newModule);
          await contentService.updateChapterContent(grade.level, subject.name, chapter.title, language, newModule);
      } catch (err: any) {
          setError(err.message || t('unknownError'));
      } finally {
          setLoadingSections(prev => ({ ...prev, [sectionKey]: false }));
      }
  }

  const renderSectionComponent = useCallback((section: any) => {
    switch (section.type) {
        case 'string-list': return <StringListComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'simple-text': return <SimpleTextComponent text={section.text} renderText={renderTextWithTTS} />;
        case 'vocab': return <VocabularyComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'theorems': return <TheoremsComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'derivations': return <FormulaDerivationsComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'formulas': return <FormulaSheetComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'templates': return <ProblemSolvingTemplatesComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'problems': return <CategorizedProblemsComponent problems={section.content!} />;
        case 'mistakes': return <CommonMistakesComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'experiments': return <ExperimentsComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'timeline': return <TimelineComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'key-figures': return <KeyFiguresComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'sources': return <PrimarySourceAnalysisComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'case-studies': return <CaseStudiesComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'grammar': return <GrammarSpotlightComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'literary': return <LiteraryDeviceAnalysisComponent items={section.content} renderText={renderTextWithTTS} />;
        default: return null;
    }
  }, [renderTextWithTTS]);

  const masteredConcepts = useMemo(() => {
    if (!learningModule) return 0;
    return Object.values(progress).filter(p => p === 'mastered').length;
  }, [progress, learningModule]);

  const totalConcepts = learningModule?.keyConcepts.length || 0;
  const chapterProgressPercentage = totalConcepts > 0 ? (masteredConcepts / totalConcepts) * 100 : 0;

  if (isLoadingModule) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)]">
        <LoadingSpinner />
        <p className="mt-4 text-slate-600 dark:text-slate-300 text-lg">{isFromDB ? t('loadingFromCache') : t('aiGeneratingLesson')}</p>
        {isFromDB && <p className="text-sm text-slate-500">{t('loadingFromCacheSubtext')}</p>}
      </div>
    );
  }

  if (error && !learningModule) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">{t('errorOccurred')}</h3>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
        <button onClick={onBackToChapters} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">{t('back')}</button>
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
  
  const learningObjectives = learningModule.learningObjectives;

  return (
    <div className="animate-fade-in relative pb-24">
       <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">
        <button onClick={onBackToSubjects} className="hover:text-primary dark:hover:text-primary-light transition-colors">
          {tCurriculum(grade.level)}
        </button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <button onClick={onBackToChapters} className="hover:text-primary dark:hover:text-primary-light transition-colors">
          {tCurriculum(subject.name)}
        </button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-200 truncate" aria-current="page">
          {tCurriculum(chapter.title)}
        </span>
      </nav>

      {isFromDB && (
        <div role="status" className="flex items-center bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg mb-6">
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          {t('loadedFromCache')}
        </div>
      )}
      
      {allConceptsMastered && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl shadow-lg text-white animate-fade-in flex items-center gap-6">
              {showConfetti && <Confetti />}
              <TrophySolid className="h-16 w-16 text-amber-300 flex-shrink-0" />
              <div>
                  <h3 className="text-3xl font-bold">{t('chapterMasteredTitle')}</h3>
                  <p className="mt-1 text-lg opacity-90">{t('chapterMasteredDesc', { points: CHAPTER_BONUS_POINTS })}</p>
              </div>
          </div>
      )}

      <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('chapterProgress')}</h3>
            <div className="flex items-center gap-2 font-bold text-amber-500">
                <TrophySolid className="h-5 w-5"/>
                <span>{chapterPoints + chapterBonusPoints} {t('points')}</span>
                {chapterBonusPoints > 0 && <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">+{chapterBonusPoints} {t('bonusPoints')}</span>}
            </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
            <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${chapterProgressPercentage}%` }}
            ></div>
        </div>
        <p className="text-right text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {masteredConcepts} / {totalConcepts} {t('conceptsMastered')}
        </p>
      </div>

      <header className="mb-8 prose prose-lg max-w-none prose-indigo dark:prose-invert">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{tCurriculum(learningModule.chapterTitle)}</h2>
        <div className="introduction-text">{renderTextWithTTS(learningModule.introduction)}</div>
      </header>
      
       {isSupported && fullText && (
        <div className="my-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary-light rounded-full" style={{backgroundColor: 'rgb(var(--c-primary-light))'}}>
                    <SpeakerWaveIcon className="h-7 w-7 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Listen to this Lesson</h4>
            </div>
            <div className="flex items-center gap-3">
                {!isSpeaking ? (
                    <button 
                        onClick={() => play(fullText)} 
                        className="flex items-center justify-center px-5 py-2.5 text-white font-bold rounded-lg btn-primary-gradient"
                        aria-label="Play lesson audio"
                    >
                        <PlayCircleIcon className="h-6 w-6 mr-2" />
                        <span>Play</span>
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={isPaused ? resume : pause} 
                            className="flex items-center justify-center px-5 py-2.5 text-white font-bold rounded-lg btn-primary-gradient"
                            aria-label={isPaused ? "Resume audio" : "Pause audio"}
                        >
                            {isPaused ? <PlayCircleIcon className="h-6 w-6 mr-2" /> : <PauseCircleIcon className="h-6 w-6 mr-2" />}
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        <button 
                            onClick={stop}
                            className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition"
                            aria-label="Stop audio playback"
                        >
                            <StopCircleIcon className="h-6 w-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )}


      <main className="space-y-12">
        {learningObjectives && learningObjectives.length > 0 && (
            <section>
                <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                    <CheckCircleIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                    {t('learningObjectives')}
                </h3>
                <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                    <StringListComponent items={learningObjectives} renderText={renderTextWithTTS} />
                </div>
            </section>
        )}
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
                progressStatus={progress[concept.conceptTitle] || 'not-started'}
                onMarkAsInProgress={() => handleMarkAsInProgress(concept.conceptTitle)}
                onConceptMastered={handleConceptMastered}
                renderText={renderTextWithTTS}
              />
            ))}
          </div>
        </section>

        {learningModule.conceptMap && (
            <section>
                <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                    <SparklesSolid className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                    {t('conceptMapTitle')}
                </h3>
                <div className="mt-4 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg min-h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                    {isGeneratingMap && (
                        <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                            <div className="text-primary h-8 w-8" style={{color: 'rgb(var(--c-primary))'}}><LoadingSpinner /></div>
                            <p className="text-sm mt-2">{t('generatingConceptMap')}</p>
                        </div>
                    )}
                    {mapError && (
                         <div className="text-red-500 dark:text-red-400 text-center font-semibold">
                            <p>{mapError}</p>
                        </div>
                    )}
                    {conceptMapUrl && !isGeneratingMap && !mapError && (
                        <img src={conceptMapUrl} alt={`${learningModule.chapterTitle} concept map`} className="rounded-md mx-auto max-h-[400px] w-auto bg-white"/>
                    )}
                </div>
            </section>
        )}

        {learningModule.interactiveVideoSimulation && (
            <section>
                 <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                    <FilmIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                    {t('interactiveSimulation')}
                </h3>
                <VideoSimulationPlayer 
                    simulationData={learningModule.interactiveVideoSimulation}
                    dbKey={`video-${grade.level}-${subject.name}-${chapter.title}-${learningModule.interactiveVideoSimulation.title}`}
                    grade={grade}
                    subject={subject}
                    chapter={chapter}
                />
            </section>
        )}
        
        {sections.map(section => {
            const sectionKey = section.key as keyof LearningModule;
            const sectionContent = learningModule[sectionKey];
            const isLoadingSection = loadingSections[section.key];

            return (
                 <section key={section.key}>
                    {sectionContent ? (
                        <>
                            <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                                <section.icon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                                {section.title}
                            </h3>
                            <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                                {renderSectionComponent(section)}
                            </div>
                        </>
                    ) : (
                        <div className="p-6 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center transition hover:border-primary dark:hover:border-primary-light hover:bg-slate-200/50 dark:hover:bg-slate-700/80">
                            <section.icon className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-3">{section.title}</h3>
                            <button 
                                onClick={() => handleLoadSection(sectionKey)}
                                disabled={isLoadingSection}
                                className="mt-4 flex items-center justify-center mx-auto px-6 py-2.5 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoadingSection ? (
                                    <><LoadingSpinner /><span className="ml-2">{t('loadingSection')}</span></>
                                ) : (
                                    t('loadSection')
                                )}
                            </button>
                        </div>
                    )}
                </section>
            )
        })}


        <section className="text-center pt-8 border-t-2 border-dashed dark:border-slate-700">
          <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200">{t('readyToTestKnowledge')}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-xl mx-auto">{t('quizPrompt')}</p>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGeneratingQuiz || !allConceptsMastered}
            className="flex items-center justify-center mx-auto px-8 py-4 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGeneratingQuiz ? (
              <><LoadingSpinner /><span className="ml-3">{t('generatingQuiz')}</span></>
            ) : (
              <><RocketLaunchIcon className="h-6 w-6 mr-3" />{t('challengeMe')}</>
            )}
          </button>
           {!allConceptsMastered && <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-3">You must master all concepts before taking the final quiz.</p>}
        </section>
      </main>

    </div>
  );
};

export default ChapterView;