// New type for authenticated users
export interface User {
  id: number;
  name: string;
  email: string;
  password_plaintext: string; // Stored as plaintext for this simulation. In a real app, this would be a hash.
  grade: string;
  avatarUrl: string;
  avatarSeed?: string;
  school?: string;
  city?: string;
  board?: string;
}

export interface Chapter {
  title: string;
  tags?: string[];
}

export interface Subject {
  name: string;
  icon: string;
  chapters: Chapter[];
}

export interface Grade {
  level: string;
  description: string;
  subjects: Subject[];
}

export interface Concept {
  conceptTitle: string;
  explanation: string;
  realWorldExample: string;
  diagramDescription: string;
}

// --- New Types for Deeper Pedagogical Content ---
export interface Theorem {
    name: string;
    proof: string;
}
export interface FormulaDerivation {
    formula: string;
    derivation: string;
}
export interface SolvedNumericalProblem {
    question: string;
    solution: string;
}
export interface KeyLawOrPrinciple {
    name: string;
    explanation: string;
}
export interface HOTQuestion {
    question: string;
    hint: string;
}


// --- Existing Types for Enhanced Content ---

export interface Formula {
  formula: string;
  description: string;
}

export interface ProblemSolvingTemplate {
  problemType: string;
  steps: string[];
}

export interface CommonMistake {
  mistake: string;
  correction: string;
}

export interface Experiment {
    title: string;
    description: string;
    materials: string[];
    steps: string[];
    safetyGuidelines: string;
}

export interface TimelineEvent {
    year: string;
    event: string;
    significance: string;
}
export interface KeyFigure {
    name: string;
    contribution: string;
}
export interface PrimarySourceSnippet {
    sourceTitle: string;
    snippet: string;
    analysis: string;
}
export interface CaseStudy {
    title: string;
    background: string;
    analysis: string;
    conclusion: string;
}

export interface GrammarRule {
    ruleName: string;
    explanation: string;
    examples: string[];
}
export interface LiteraryDevice {
    deviceName: string;
    explanation: string;
    example: string;
}

export interface VocabularyDeepDive {
    term: string;
    definition: string;
    usageInSentence: string;
    etymology?: string; // Optional: origin of the word
}

// --- New Type for Video Simulations ---
export interface InteractiveVideoSimulation {
    title: string;
    description: string; // Explains what the simulation will show and why it's useful.
    videoPrompt: string; // The detailed prompt for the VEO model.
}

// --- New Types for Virtual Labs & Interactive Explainers ---
export interface InteractiveVariable { // Renamed from VirtualLabVariable to be more generic
    name: string;
    options: string[];
}
export interface VirtualLab {
    title: string;
    description: string;
    baseScenarioPrompt: string;
    variables: InteractiveVariable[]; // Use renamed type
    outcomePromptTemplate: string;
}
export interface InteractiveExplainer {
    title: string;
    description: string;
    variables: InteractiveVariable[];
    videoPromptTemplate: string;
}


// --- New Types for Adaptive Storytelling ---
export interface StoryNodeChoice {
    text: string;
    nextNodeId: string;
    feedback: string; // Feedback to the student for making this choice
}

export interface StoryNode {
    id: string;
    text: string;
    choices: StoryNodeChoice[];
    isEnding: boolean; // Is this a concluding node?
}

export interface AdaptiveStory {
    title: string;
    introduction: string;
    startNodeId: string;
    nodes: StoryNode[];
}

// --- New Types for Offline & Printable Content ---
export interface PrintableResource {
    title: string;
    content: string; // HTML content
}

// --- New Types for Cultural & Value-Based Learning ---
export interface CulturalContext {
    title: string;
    content: string;
}

export interface MoralScienceCorner {
    title: string;
    story: string;
    moral: string;
}


export interface LearningModule {
  chapterTitle: string;
  introduction: string;
  learningObjectives: string[];
  keyConcepts: Concept[];
  summary: string;
  conceptMap?: string;
  learningTricksAndMnemonics?: string[];
  higherOrderThinkingQuestions?: HOTQuestion[];
  interactiveVideoSimulation?: InteractiveVideoSimulation;
  interactiveExplainer?: InteractiveExplainer;
  virtualLab?: VirtualLab;
  adaptiveStory?: AdaptiveStory;
  culturalContext?: CulturalContext;
  moralScienceCorner?: MoralScienceCorner;

  // New pedagogical fields
  prerequisitesCheck?: string[];
  selfAssessmentChecklist?: string[];
  extensionActivities?: string[];
  remedialActivities?: string[];
  careerConnections?: string;
  technologyIntegration?: string;
  
  // Mathematics
  keyTheoremsAndProofs?: Theorem[];
  formulaDerivations?: FormulaDerivation[];
  formulaSheet?: Formula[];
  problemSolvingTemplates?: ProblemSolvingTemplate[];
  categorizedProblems?: CategorizedProblems;
  commonMistakes?: CommonMistake[];
  
  // Science
  keyLawsAndPrinciples?: KeyLawOrPrinciple[];
  solvedNumericalProblems?: SolvedNumericalProblem[];
  experiments?: Experiment[];
  scientificMethodApplications?: string;
  currentDiscoveries?: string;
  environmentalAwareness?: string;
  interdisciplinaryConnections?: string;
  
  // Social Science, Commerce, Humanities
  timelineOfEvents?: TimelineEvent[];
  keyFigures?: KeyFigure[];
  primarySourceAnalysis?: PrimarySourceSnippet[];
  inDepthCaseStudies?: CaseStudy[];

  // Language Arts
  grammarSpotlight?: GrammarRule[];
  literaryDeviceAnalysis?: LiteraryDevice[];

  // Shared across subjects
  vocabularyDeepDive?: VocabularyDeepDive[];
  competitiveExamMapping?: string;

  // New offline/printable content (generated on-demand)
  printableWorksheet?: PrintableResource;
  printableStudyNotes?: PrintableResource;
}


export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTitle: string; // Link question to a specific concept
  type?: 'ACADEMIC' | 'IQ' | 'EQ';
  skill?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

// New type for adaptive learning recommendation
export interface NextStepRecommendation {
    recommendationText: string;
    nextChapterTitle: string | null;
    action: 'REVIEW' | 'CONTINUE' | 'REVISE_PREREQUISITE' | 'START_CRITICAL_THINKING' | 'START_WELLBEING';
    prerequisiteChapterTitle?: string | null;
}


// New types for Teacher/Parent roles
export interface PerformanceRecord {
  subject: string;
  chapter: string;
  score: number; // as a percentage
  completedDate: string;
  type?: 'quiz' | 'exercise' | 'iq' | 'eq';
  context?: string; // e.g., concept title for exercises, or skill for IQ/EQ
}

// --- New Type for Gamified Learning ---
export interface Achievement {
  id: string; // e.g., 'chapter-champion'
  name: string;
  description: string;
  icon: string; // Heroicon name or URL
  timestamp: string; // ISO date string when it was earned
}


export interface Student {
  id: number;
  name: string;
  grade: string;
  avatarUrl: string;
  avatarSeed?: string;
  school?: string;
  city?: string;
  board?: string;
  performance: PerformanceRecord[];
  achievements: Achievement[];
  points: number;
}

// New type for progress tracking
export type ChapterProgress = {
  [conceptTitle: string]: {
    status: 'locked' | 'novice' | 'competent' | 'master';
    score: number;
    failedAttempts: number;
  };
};

// New types for Student Q&A feature
export interface AIAnalysis {
  modelAnswer: string;
  pedagogicalNotes: string; // Private notes for the teacher
}

export interface FittoResponse {
    isRelevant: boolean;
    responseText: string;
}

export interface StudentQuestion {
  id: string; // a unique id like a timestamp
  studentId: number;
  studentName: string;
  grade: string;
  subject: string;
  chapter: string;
  concept: string;
  questionText: string;
  timestamp: string;
  analysis?: AIAnalysis; // To store the AI feedback for the teacher
  fittoResponse?: FittoResponse; // To store the AI mentor's direct response to the student
}

// New Type for AI Tutor Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  state?: 'thinking' | 'error';
}


// --- New Types for Adaptive Learning Engine ---

export interface IQExercise {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    skill: 'Pattern Recognition' | 'Logic Puzzle' | 'Spatial Reasoning' | 'Analogical Reasoning';
}

export interface EQExercise {
    scenario: string;
    question: string;
    options: string[];
    bestResponse: string;
    explanation: string;
    skill: 'Empathy' | 'Self-awareness' | 'Resilience' | 'Social Skills';
}

export type AdaptiveActionType = 'ACADEMIC_REVIEW' | 'ACADEMIC_PRACTICE' | 'ACADEMIC_NEW' | 'IQ_EXERCISE' | 'EQ_EXERCISE';

export interface AdaptiveAction {
    type: AdaptiveActionType;
    details: {
        subject?: string;
        chapter?: string;
        concept?: string;
        skill?: string;
        reasoning: string; // AI's explanation for why this action was chosen
        confidence?: number;
    };
}

// --- New Type for Learning Streak ---
export interface LearningStreak {
    count: number;
    lastDate: string; // YYYY-MM-DD
}


// --- New Types for Question Bank ---
export type QuestionType = 'MCQ' | 'Short Answer' | 'Long Answer';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type BloomTaxonomyLevel = 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';

interface BaseQuestion {
    questionText: string;
    difficulty: DifficultyLevel;
    bloomTaxonomy: BloomTaxonomyLevel;
    isCompetencyBased: boolean;
    isPreviousYearQuestion: boolean;
}

interface MCQDetails extends BaseQuestion {
    questionType: 'MCQ';
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface ShortAnswerDetails extends BaseQuestion {
    questionType: 'Short Answer';
    markingScheme: string;
    modelAnswer: string;
    answerWritingGuidance: string;
}

interface LongAnswerDetails extends BaseQuestion {
    questionType: 'Long Answer';
    markingScheme: string;
    modelAnswer: string;
    answerWritingGuidance: string;
}

export type QuestionBankItem = MCQDetails | ShortAnswerDetails | LongAnswerDetails;

export interface CategorizedProblems {
  conceptual: QuestionBankItem[];
  application: QuestionBankItem[];
  higherOrderThinking: QuestionBankItem[];
}

// --- New Types for Curriculum Generation ---
export interface CurriculumOutlineChapter {
    chapterTitle: string;
    learningObjectives: string[];
}

// --- New Type for AI Content Feedback ---
export interface AIFeedback {
    id: string;
    userRole: 'teacher' | 'parent';
    studentId: number;
    contentIdentifier: string; // e.g., report-teacher-1-en
    rating: 'up' | 'down';
    comment?: string;
    timestamp: string;
}

// --- New Types for FAQ/Tutorial ---
export interface FAQItem {
  questionKey: string;
  answerKey: string;
}

export interface FAQSection {
  role: 'student' | 'teacher' | 'parent';
  titleKey: string;
  items: FAQItem[];
}

// --- New Types for Project-Based Learning ---
export interface ProjectSubmission {
  studentId: number;
  studentName: string;
  studentAvatarUrl: string;
  solutionText: string;
  solutionUrl?: string; // Optional link to a presentation, video, etc.
  submittedDate: string;
}

export interface Project {
  id: string;
  title: string;
  subject: string;
  grade: string;
  priority?: 'High' | 'Medium' | 'Low';
  problemStatement: string;
  objectives: string[];
  guidingQuestions: string[];
  submissions: ProjectSubmission[];
}


// --- New Types for Peer Teaching Network ---
export interface PeerExplanation {
  id: string;
  studentId: number;
  studentName: string;
  studentAvatarUrl: string;
  subject: string;
  chapter: string;
  concept: string;
  explanationText: string;
  submittedDate: string;
}

// --- New Types for Competitive Features ---
export interface LeaderboardEntry {
  studentId: number;
  name: string;
  avatarUrl: string;
  points: number;
  rank: number;
}

export interface Competition {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  prize: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
}

export interface HallOfFameEntry {
    studentName: string;
    achievement: string;
    year: number;
    avatarUrl: string;
}

// --- New Types for Career Guidance ---
export type AptitudeTrait = 'Logical Reasoning' | 'Verbal Ability' | 'Numerical Aptitude' | 'Spatial Awareness';

export interface AptitudeQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    trait: AptitudeTrait;
    explanation: string;
}

export interface AptitudeTestResult {
    scores: { [trait: string]: { correct: number; total: number } };
    summary: string; // AI-generated summary
}

export interface CareerSuggestion {
    careerName: string;
    description: string;
    requiredSubjects: string[];
}

export interface StreamRecommendation {
    streamName: 'Science' | 'Commerce' | 'Humanities/Arts';
    recommendationReason: string;
    suggestedCareers: CareerSuggestion[];
}

export interface CareerGuidance {
    introduction: string;
    streamRecommendations: StreamRecommendation[];
    conclusion: string;
}