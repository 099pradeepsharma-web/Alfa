import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grade, Subject, Chapter, LearningModule, QuizQuestion, NextStepRecommendation, ChapterProgress, Student, CategorizedProblems, VocabularyDeepDive, Theorem, FormulaDerivation, SolvedNumericalProblem, Formula, ProblemSolvingTemplate, CommonMistake, Experiment, TimelineEvent, KeyFigure, PrimarySourceSnippet, CaseStudy, GrammarRule, LiteraryDevice, HOTQuestion, KeyLawOrPrinciple, CulturalContext, MoralScienceCorner } from '../types';
import * as contentService from '../services/contentService';
import { generateQuiz, generateNextStepRecommendation, generateSectionContent, generatePrintableResource } from '../services/geminiService';
import { getChapterProgress, saveChapterProgress } from '../services/pineconeService';
import LoadingSpinner from './LoadingSpinner';
import ConceptCard from './ConceptCard';
import Quiz from './Quiz';
import Confetti from './Confetti';
import { RocketLaunchIcon, ArchiveBoxIcon, LightBulbIcon, ArrowPathIcon, ForwardIcon, CheckCircleIcon, BookOpenIcon, VariableIcon, ClipboardDocumentListIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon as ExclamationTriangleSolid, TrophyIcon as TrophySolid, BeakerIcon, GlobeAltIcon, LinkIcon, AcademicCapIcon, PlayCircleIcon, PauseCircleIcon, StopCircleIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, LanguageIcon, SparklesIcon as SparklesSolid, MapIcon, PuzzlePieceIcon, CalculatorIcon, ScaleIcon, ShareIcon, CheckBadgeIcon, CpuChipIcon, SpeakerWaveIcon, FilmIcon, ChevronRightIcon, WrenchScrewdriverIcon, ChatBubbleLeftRightIcon, BoltIcon, ArrowDownTrayIcon, HeartIcon } from '@heroicons/react/24/solid';
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
  onStartTutorSession: () => void;
  onStartMicrolearningSession: (module: LearningModule) => void;
}

// A more robust sentence tokenizer that handles abbreviations.
const getSentences = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];
    const sentences = text.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(Boolean);
};

// --- START: New Math Solution Presentation Component ---

const MathSolutionComponent: React.FC<{ content: string; renderText: (text: string) => React.ReactNode }> = ({ content, renderText }) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');

    const isLabel = (line: string) => /^(Given:|Solution:|Answer:|Therefore:|To Find:)/i.test(line);
    const isFinal = (line: string) => /^(Answer:|Therefore:)/i.test(line);

    return (
        <div className="math-solution-box">
            {lines.map((line, index) => {
                const trimmedLine = line.trim();
                
                if (isFinal(trimmedLine)) {
                    return (
                        <div key={index} className="math-solution-final-answer">
                            {renderText(trimmedLine)}
                        </div>
                    );
                }

                if (isLabel(trimmedLine)) {
                     return (
                        <div key={index} className="math-solution-label">
                            {renderText(trimmedLine)}
                        </div>
                    );
                }

                // Check for equation
                const eqIndex = trimmedLine.indexOf('=');
                if (eqIndex > 0 && !isLabel(trimmedLine)) {
                    const lhs = trimmedLine.substring(0, eqIndex).trim();
                    const rhs = trimmedLine.substring(eqIndex + 1).trim();
                    return (
                        <React.Fragment key={index}>
                            <div className="math-solution-lhs">{renderText(lhs)}</div>
                            <div className="math-solution-rhs">{renderText(`= ${rhs}`)}</div>
                        </React.Fragment>
                    );
                }
                
                // Otherwise, it's an explanation line
                return (
                     <div key={index} className="math-solution-explanation">
                        {renderText(trimmedLine)}
                    </div>
                );
            })}
        </div>
    );
};

// --- END: New Math Solution Presentation Component ---

const CulturalContextComponent: React.FC<{ context: CulturalContext, renderText: (text: string) => React.ReactNode }> = ({ context, renderText }) => {
    return (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/40 border-l-4 border-amber-400 rounded-r-md">
            <h4 className="font-bold text-lg text-amber-800 dark:text-amber-200">{context.title}</h4>
            <div className="mt-2 prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                <StructuredText text={context.content} renderText={renderText} />
            </div>
        </div>
    );
};

const MoralScienceCornerComponent: React.FC<{ corner: MoralScienceCorner, renderText: (text: string) => React.ReactNode }> = ({ corner, renderText }) => {
    const { t } = useLanguage();
    return (
        <div className="p-4 bg-sky-50 dark:bg-sky-900/40 border-l-4 border-sky-400 rounded-r-md">
            <h4 className="font-bold text-lg text-sky-800 dark:text-sky-200">{corner.title}</h4>
            <div className="mt-2 text-slate-600 dark:text-slate-300 italic">
                <StructuredText text={corner.story} renderText={renderText} />
            </div>
            <div className="mt-4 font-bold text-sky-700 dark:text-sky-300">
                <p>{t('moralOfTheStory')}: {renderText(corner.moral)}</p>
            </div>
        </div>
    );
};


// --- START: Section Configuration for Subject-Specific Content ---

type SectionKey = keyof LearningModule;

const commonSections: SectionKey[] = [
    'culturalContext', 'moralScienceCorner', 'prerequisitesCheck', 'interactiveExplainer', 'vocabularyDeepDive', 'higherOrderThinkingQuestions',
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
const isSolvedProblem = (item: any): item is SolvedNumericalProblem => 'solution' in item;
const isTheorem = (item: any): item is Theorem => 'proof' in item;
const isKeyLawOrPrinciple = (item: any): item is KeyLawOrPrinciple => 'explanation' in item && 'name' in item;
const isHOTQuestion = (item: any): item is HOTQuestion => 'hint' in item;

const SimpleTextComponent: React.FC<{ text: string | undefined, renderText: (text: string) => React.ReactNode }> = ({ text, renderText }) => text ? <StructuredText text={text} renderText={renderText} /> : null;

const StringListComponent: React.FC<{ items: string[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
    <ul className="styled-list">
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

const TheoremsComponent: React.FC<{ items: (Theorem[] | HOTQuestion[] | SolvedNumericalProblem[] | KeyLawOrPrinciple[]) | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-4">
            {items?.map((item, index) => {
                const title = 'name' in item ? item.name : ('question' in item ? item.question : 'Untitled');
                
                let label = '';
                let content = '';
                let isMath = false;

                if (isSolvedProblem(item)) {
                    label = t('solution');
                    content = item.solution;
                    isMath = true;
                } else if (isTheorem(item)) {
                    label = t('proof');
                    content = item.proof;
                } else if (isKeyLawOrPrinciple(item)) {
                    label = t('explanation');
                    content = item.explanation;
                } else if (isHOTQuestion(item)) {
                    label = t('hint');
                    content = item.hint;
                } else {
                    return null;
                }

                return (
                    <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h4>
                        {content && (
                            <div className="mt-2">
                                <h5 className="font-semibold text-slate-600 dark:text-slate-300">
                                    {label}:
                                </h5>
                                <div className="mt-1">
                                    {isMath ? (
                                        <MathSolutionComponent content={content} renderText={renderText} />
                                    ) : (
                                        <StructuredText text={content} renderText={renderText} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
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
                        <div className="mt-1">
                           <MathSolutionComponent content={item.derivation} renderText={renderText} />
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
                        <StructuredText text={item.mistake} renderText={renderText} />
                    </div>
                     <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400">{t('correction')}:</h4>
                        <StructuredText text={item.correction} renderText={renderText} />
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
                    <div className="mt-1"><StructuredText text={item.description} renderText={renderText} /></div>
                    <div className="mt-4">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('materials')}:</h5>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 styled-list">
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
                        <StructuredText text={item.safetyGuidelines} renderText={renderText} />
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
                 <StructuredText text={item.significance} renderText={renderText} />
            </div>
        ))}
    </div>
);

const KeyFiguresComponent: React.FC<{ items: KeyFigure[] | undefined, renderText: (text: string) => React.ReactNode }> = ({ items, renderText }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items?.map((item, index) => (
             <div key={index} className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{item.name}</h4>
                <div className="mt-1"><StructuredText text={item.contribution} renderText={renderText} /></div>
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
                        <StructuredText text={item.analysis} renderText={renderText} />
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
                        <StructuredText text={item.background} renderText={renderText} />
                    </div>
                     <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('analysis')}:</h5>
                        <StructuredText text={item.analysis} renderText={renderText} />
                    </div>
                     <div className="mt-3">
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200">{t('conclusion')}:</h5>
                        <StructuredText text={item.conclusion} renderText={renderText} />
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
                <div className="mt-1"><StructuredText text={item.explanation} renderText={renderText} /></div>
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 dark:text-slate-300 styled-list">
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
                <div className="mt-1"><StructuredText text={item.explanation} renderText={renderText} /></div>
                 <p className="mt-2 text-slate-600 dark:text-slate-300"><strong>e.g.,</strong> <em>"{renderText(item.example)}"</em></p>
            </div>
        ))}
    </div>
);

// --- END: Section Content Rendering Components ---

interface CategorizedProblemsComponentProps {
    problems: CategorizedProblems;
    renderText: (text: string) => React.ReactNode;
}
const CategorizedProblemsComponent: React.FC<CategorizedProblemsComponentProps> = ({ problems, renderText }) => {
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
                            <div className="mt-2">
                                <MathSolutionComponent content={problem.solution} renderText={renderText} />
                            </div>
                        </details>
                    </div>
                ))}
                 {currentProblems.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noProblemsAvailable')}</p>}
            </div>
        </div>
    );
};


const ChapterView: React.FC<ChapterViewProps> = ({ grade, subject, chapter, student, language, onBackToChapters, onBackToSubjects, onChapterSelect, onStartTutorSession, onStartMicrolearningSession }) => {
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

  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});
  const [generatingResourceType, setGeneratingResourceType] = useState<'worksheet' | 'study-notes' | null>(null);


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
        culturalContext: { title: t('culturalContext'), content: learningModule.culturalContext, icon: SparklesSolid, type: 'cultural' },
        moralScienceCorner: { title: t('moralScienceCorner'), content: learningModule.moralScienceCorner, icon: HeartIcon, type: 'moral' },
        prerequisitesCheck: { title: t('prerequisitesCheck'), content: learningModule.prerequisitesCheck, icon: LinkIcon, type: 'string-list' },
        interactiveExplainer: { title: t('interactiveExplainer'), content: learningModule.interactiveExplainer, icon: PlayCircleIcon, type: 'explainer' },
        keyTheoremsAndProofs: { title: t('keyTheoremsAndProofs'), content: learningModule.keyTheoremsAndProofs, icon: VariableIcon, type: 'theorems' },
        formulaDerivations: { title: t('formulaDerivations'), content: learningModule.formulaDerivations, icon: CalculatorIcon, type: 'derivations' },
        formulaSheet: { title: t('formulaSheet'), content: learningModule.formulaSheet, icon: ClipboardDocumentListIcon, type: 'formulas' },
        problemSolvingTemplates: { title: t('problemSolvingTemplates'), content: learningModule.problemSolvingTemplates, icon: PuzzlePieceIcon, type: 'templates' },
        categorizedProblems: { title: t('categorizedProblems'), content: learningModule.categorizedProblems, icon: QuestionMarkCircleIcon, type: 'problems' },
        commonMistakes: { title: t('commonMistakes'), content: learningModule.commonMistakes, icon: ExclamationTriangleSolid, type: 'mistakes' },
        keyLawsAndPrinciples: { title: t('keyLawsAndPrinciples'), content: learningModule.keyLawsAndPrinciples, icon: ScaleIcon, type: 'theorems' },
        solvedNumericalProblems: { title: t('solvedNumericalProblems'), content: learningModule.solvedNumericalProblems, icon: CalculatorIcon, type: 'theorems' },
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

    const mermaidContainerId = useMemo(() => `mermaid-graph-${chapter.title.replace(/\s/g, '-')}`, [chapter.title]);

    useEffect(() => {
        if (learningModule?.conceptMap) {
            const container = document.getElementById(mermaidContainerId);
            
            if (container) {
                // Clear previous render to avoid duplicates on re-render
                container.removeAttribute('data-processed');
                container.innerHTML = ''; // Clear previous content before attempting to parse/render
                
                try {
                    // First, try to parse. This will throw an error on invalid syntax.
                    mermaid.parse(learningModule.conceptMap);
                    // If parsing is successful, set the content and run the renderer.
                    container.innerHTML = learningModule.conceptMap;
                    mermaid.run({ nodes: [container] });
                } catch (e) {
                    console.error("Mermaid rendering error:", e);
                    container.innerHTML = `
                        <div class="mermaid-error">
                            <div class="mermaid-error-title">Could not display concept map.</div>
                            <p>There seems to be an issue with the diagram's data.</p>
                        </div>
                    `;
                }
            }
        }
    }, [learningModule?.conceptMap, mermaidContainerId]);

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
                case 'cultural':
                    textParts.push((section.content as CulturalContext).title);
                    textParts.push((section.content as CulturalContext).content);
                    break;
                case 'moral':
                    textParts.push((section.content as MoralScienceCorner).title);
                    textParts.push((section.content as MoralScienceCorner).story);
                    textParts.push((section.content as MoralScienceCorner).moral);
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
        case 'cultural': return <CulturalContextComponent context={section.content!} renderText={renderTextWithTTS} />;
        case 'moral': return <MoralScienceCornerComponent corner={section.content!} renderText={renderTextWithTTS} />;
        case 'string-list': return <StringListComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'explainer': return <InteractiveExplainerPlayer explainerData={section.content!} grade={grade} subject={subject} chapter={chapter} />;
        case 'simple-text': return <SimpleTextComponent text={section.text} renderText={renderTextWithTTS} />;
        case 'vocab': return <VocabularyComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'theorems': return <TheoremsComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'derivations': return <FormulaDerivationsComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'formulas': return <FormulaSheetComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'templates': return <ProblemSolvingTemplatesComponent items={section.content} renderText={renderTextWithTTS} />;
        case 'problems': return <CategorizedProblemsComponent problems={section.content!} renderText={renderTextWithTTS} />;
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
  }, [renderTextWithTTS, grade, subject, chapter]);

  const handleGenerateResource = async (type: 'worksheet' | 'study-notes') => {
    if (!learningModule) return;
    setGeneratingResourceType(type);
    setError(null);
    try {
        const chapterContext = `Chapter Title: ${learningModule.chapterTitle}. Introduction: ${learningModule.introduction}. Key Concepts: ${learningModule.keyConcepts.map(c => `${c.conceptTitle}: ${c.explanation}`).join('; ')}.`;
        
        const htmlContent = await generatePrintableResource(
            type,
            grade.level,
            subject.name,
            chapter.title,
            chapterContext,
            language
        );

        const newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        } else {
            alert("Please allow pop-ups for this site to download printable resources.");
        }

    } catch (err: any) {
        setError(err.message || t('unknownError'));
    } finally {
        setGeneratingResourceType(null);
    }
};


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
    <main className="animate-fade-in space-y-16 pb-24">
       <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-8">
        <button onClick={onBackToSubjects} className="breadcrumb-link transition-colors">
          {tCurriculum(grade.level)}
        </button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <button onClick={onBackToChapters} className="breadcrumb-link transition-colors">
          {tCurriculum(subject.name)}
        </button>
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-200 truncate" aria-current="page">
          {tCurriculum(chapter.title)}
        </span>
      </nav>

      {isFromDB && (
        <div role="status" className="flex items-center bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg">
          <ArchiveBoxIcon className="h-5 w-5 mr-2" />
          {t('loadedFromCache')}
        </div>
      )}
      
      {allConceptsMastered && (
          <div className="p-6 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl shadow-lg text-white animate-fade-in flex items-center gap-6">
              {showConfetti && <Confetti />}
              <TrophySolid className="h-16 w-16 text-amber-300 flex-shrink-0" />
              <div>
                  <h3 className="text-3xl font-bold">{t('chapterMasteredTitle')}</h3>
                  <p className="mt-1 text-lg opacity-90">{t('chapterMasteredDesc', { points: CHAPTER_BONUS_POINTS })}</p>
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
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

      <header className="prose prose-lg max-w-none prose-indigo dark:prose-invert space-y-4">
        <h2 className="!mb-0 text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{tCurriculum(learningModule.chapterTitle)}</h2>
        <div className="introduction-text !mt-0"><StructuredText text={learningModule.introduction} renderText={renderTextWithTTS} /></div>
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

      <>
        {learningObjectives && learningObjectives.length > 0 && (
            <section className="chapter-view-section">
                <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
                    <CheckCircleIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                    {t('learningObjectives')}
                </h3>
                <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                    <StringListComponent items={learningObjectives} renderText={renderTextWithTTS} />
                </div>
            </section>
        )}

        <section className="chapter-view-section">
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center gap-6">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-white/80 flex-shrink-0"/>
              <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold">{t('doubtResolutionTitle')}</h3>
                  <p className="mt-1 opacity-90">{t('doubtResolutionDescription')}</p>
              </div>
              <button 
                  onClick={onStartTutorSession} 
                  className="mt-4 md:mt-0 md:ml-auto flex-shrink-0 px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow-md hover:bg-indigo-50 transition-colors transform hover:scale-105"
              >
                  {t('startDoubtSession')}
              </button>
          </div>
        </section>

        <section className="chapter-view-section">
            <div className="p-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center gap-6">
                <BoltIcon className="h-16 w-16 text-white/80 flex-shrink-0"/>
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold">{t('focusedStudyTitle')}</h3>
                    <p className="mt-1 opacity-90">{t('focusedStudyDesc')}</p>
                </div>
                 <button 
                    onClick={() => onStartMicrolearningSession(learningModule)}
                    className="mt-4 md:mt-0 md:ml-auto flex-shrink-0 px-6 py-3 bg-white text-orange-600 font-bold rounded-lg shadow-md hover:bg-orange-50 transition-colors transform hover:scale-105"
                >
                    {t('startQuest')}
                </button>
            </div>
        </section>

        <section className="chapter-view-section">
          <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
            <LightBulbIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
            {t('keyConcepts')}
          </h3>
          <div className="space-y-8 mt-6">
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
             <section className="chapter-view-section">
                <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
                    <MapIcon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    {t('conceptMap')}
                </h3>
                <div id={mermaidContainerId} className="mermaid p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-6" />
            </section>
        )}

        {learningModule.interactiveVideoSimulation && (
             <section className="chapter-view-section">
                 <VideoSimulationPlayer 
                    simulationData={learningModule.interactiveVideoSimulation} 
                    dbKey={`video-${grade.level}-${subject.name}-${chapter.title}-${learningModule.interactiveVideoSimulation.title}`}
                    grade={grade}
                    subject={subject}
                    chapter={chapter}
                 />
             </section>
        )}

        {learningModule.virtualLab && (
            <section className="chapter-view-section">
                <VirtualLabPlayer labData={learningModule.virtualLab} grade={grade} subject={subject} chapter={chapter} />
            </section>
        )}

        {learningModule.adaptiveStory && (
            <section className="chapter-view-section">
                <AdaptiveStoryPlayer storyData={learningModule.adaptiveStory} />
            </section>
        )}
        
        {sections.filter(s => s.content).map(section => (
            <section key={section.key} className="chapter-view-section">
                <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
                    <section.icon className="h-8 w-8 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    {section.title}
                </h3>
                <div className="prose prose-lg max-w-none prose-indigo dark:prose-invert text-slate-600 dark:text-slate-300">
                    {renderSectionComponent(section)}
                </div>
            </section>
        ))}
      </>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mt-12">
        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-4">
            <ArrowDownTrayIcon className="h-7 w-7 mr-3 text-primary" style={{color: 'rgb(var(--c-primary))'}} />
            {t('printableResources')}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">{t('printableResourcesDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button 
                onClick={() => handleGenerateResource('worksheet')} 
                disabled={generatingResourceType === 'worksheet'}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-70"
            >
                {generatingResourceType === 'worksheet' ? <LoadingSpinner /> : <WrenchScrewdriverIcon className="h-5 w-5 mr-2"/>}
                {t('generateWorksheet')}
            </button>
            <button 
                onClick={() => handleGenerateResource('study-notes')}
                disabled={generatingResourceType === 'study-notes'}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-70"
            >
                {generatingResourceType === 'study-notes' ? <LoadingSpinner /> : <DocumentTextIcon className="h-5 w-5 mr-2" />}
                {t('generateStudyNotes')}
            </button>
        </div>
    </div>


      <div className="mt-16 text-center">
        <h3 className="text-3xl font-bold text-slate-700 dark:text-slate-200">{t('readyForAChallenge')}</h3>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">{t('readyForAChallengeDesc')}</p>
        <button 
          onClick={handleGenerateQuiz} 
          disabled={isGeneratingQuiz || !allConceptsMastered}
          className="mt-6 flex items-center justify-center mx-auto px-8 py-4 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGeneratingQuiz ? <><LoadingSpinner /> <span className="ml-2">{t('generatingQuiz')}</span></> : <><LightBulbIcon className="h-6 w-6 mr-2" />{t('startChapterQuiz')}</>}
        </button>
        {!allConceptsMastered && <p className="text-sm text-slate-500 mt-2">{t('masterAllConceptsPrompt')}</p>}
      </div>
    </main>
  );
};

export default React.memo(ChapterView);