

export interface Topic {
  title: string;
  subTopics?: Topic[];
}

export interface Chapter {
  title: string;
  tags?: string[];
  topics: Topic[];
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

// --- NEW "GAMIFIED, HOOK-DRIVEN" LEARNING MODULE STRUCTURE ---

export interface Trigger {
    triggerType: 'paradoxicalQuestion' | 'realWorldVideo' | 'interdisciplinaryConnection';
    title: string; // The main hook/question.
    description: string; // Elaboration or context. For 'realWorldVideo', this is the video prompt.
    pushNotification: string; // A short, punchy text for a push notification.
}

export interface CoreConceptLesson {
    title: string;
    videoUrl?: string; // or videoPrompt for generation
    videoPrompt?: string;
    explanation: string;
    knowledgeCheck: QuizQuestion[]; // 2 questions
}

export interface PracticeProblem {
    level: 'Level 1: NCERT Basics' | 'Level 2: Reference Application' | 'Level 3: Competitive Challenge';
    problemStatement: string;
    solution: string;
}

export interface XpReward {
    type: 'xp';
    points: number;
}
export interface VideoReward {
    type: 'video';
    title: string;
    videoPrompt: string;
}

export interface PracticeArena {
    problems: PracticeProblem[];
    reward?: XpReward | VideoReward;
}

export interface PracticalApplicationLab {
    type: 'virtualLab' | 'simulation' | 'project';
    title: string;
    description: string;
    labInstructions?: string;
}

export interface LearningModule {
  chapterTitle: string;
  missionBriefing: Trigger[];
  coreConceptTraining: CoreConceptLesson[];
  practiceArena: PracticeArena;
  practicalApplicationLab: PracticalApplicationLab;
  bossFight: QuizQuestion[]; // The final chapter test
  // FIX: Added optional 'categorizedProblems' to support lazy-loading sections in ConceptCard.tsx.
  categorizedProblems?: CategorizedProblems;
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

// New type for student-set goals
export interface StudyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  email?: string;
  avatarUrl: string;
  avatarSeed?: string;
  school?: string;
  city?: string;
  board?: string;
  performance: PerformanceRecord[];
  achievements: Achievement[];
  points: number;
  studyGoals: StudyGoal[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  studentIds: string[];
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  childIds: string[];
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
  studentId: string;
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
  studentId: string;
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
  studentId: string;
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
  studentId: string;
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
  studentId: string;
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

// --- NEW: Type for Answer Writing Practice ---
export interface WrittenAnswerEvaluation {
    modelAnswer: string;
    markingScheme: string;
    personalizedFeedback: string;
    proTips: string;
}

// --- NEW: Type for SAT Answer Evaluation ---
export interface SATAnswerEvaluation {
    modelApproach: string;
    personalizedFeedback: string;
    keyConcept: string;
    proTips: string;
}


// --- FIX: Add missing types for interactive content components ---
export interface InteractiveVideoSimulation {
    title: string;
    // FIX: Added missing 'description' property used in VideoSimulationPlayer.tsx.
    description: string;
    videoPrompt: string;
}

export interface VirtualLabVariable {
    name: string;
    options: string[];
}

export interface VirtualLab {
    title: string;
    description: string;
    baseScenarioPrompt: string;
    outcomePromptTemplate: string;
    variables: VirtualLabVariable[];
}

export interface StoryNodeChoice {
  text: string;
  feedback: string;
  nextNodeId: string;
}
export interface StoryNode {
  id: string;
  text: string;
  choices: StoryNodeChoice[];
  isEnding: boolean;
}
export interface AdaptiveStory {
  title: string;
  introduction: string;
  startNodeId: string;
  nodes: StoryNode[];
}

export interface ExplainerVariable {
    name: string;
    options: string[];
}
export interface InteractiveExplainer {
    title: string;
    description: string;
    videoPromptTemplate: string;
    variables: ExplainerVariable[];
}