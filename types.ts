// --- Core Curriculum & User Types ---

export interface Topic {
  title: string;
  subTopics?: Topic[];
}

export interface Chapter {
  title: string;
  // imageUrl?: string; // This is part of the LearningModule now, not the static curriculum.
  topics: Topic[];
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

export interface PerformanceRecord {
  subject: string;
  chapter: string;
  score: number;
  completedDate: string;
  type?: 'quiz' | 'exercise' | 'iq' | 'eq';
  context?: string;
}

export interface StudyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    timestamp: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  grade: string;
  avatarUrl: string;
  avatarSeed?: string;
  points: number;
  performance: PerformanceRecord[];
  achievements: Achievement[];
  studyGoals: StudyGoal[];
  school?: string;
  city?: string;
  board?: string;
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


// --- Content & Learning Module Types ---

export interface Trigger {
    triggerType: 'paradoxicalQuestion' | 'realWorldVideo' | 'interdisciplinaryConnection';
    title: string;
    description: string;
    pushNotification: string;
}

export interface CoreConceptLesson {
    title: string;
    videoPrompt?: string | null;
    explanation: string;
    knowledgeCheck: QuizQuestion[];
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

// Union type for all possible lab types
export type Lab = InteractiveVideoSimulation | VirtualLab | InteractiveExplainer | AdaptiveStory | {
    type: 'project';
    title: string;
    description: string;
    labInstructions?: string;
};

// FIX: Redefined PracticalApplicationLab as a discriminated union to enable type narrowing in switch statements.
// This resolves type errors when passing the lab content to specific player components.
export type PracticalApplicationLab = InteractiveVideoSimulation | VirtualLab | InteractiveExplainer | AdaptiveStory | {
    type: 'project';
    title: string;
    description: string;
    labInstructions?: string;
};


export interface LearningModule {
    chapterTitle: string;
    missionBriefing: Trigger[];
    coreConceptTraining: CoreConceptLesson[];
    practiceArena: PracticeArena;
    practicalApplicationLab: PracticalApplicationLab;
    bossFight: QuizQuestion[];
    categorizedProblems?: any; // Added to satisfy ConceptCard
}


// --- Quiz & Exercise Types ---

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    conceptTitle: string;
    type?: 'ACADEMIC' | 'IQ' | 'EQ';
    skill?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
}

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


// --- AI & Recommendation Types ---

export interface Concept {
    conceptTitle: string;
    explanation: string;
    realWorldExample: string;
    diagramDescription: string;
}

export interface NextStepRecommendation {
    recommendationText: string;
    action: 'REVIEW' | 'CONTINUE' | 'REVISE_PREREQUISITE' | 'START_CRITICAL_THINKING' | 'START_WELLBEING';
    nextChapterTitle?: string | null;
    prerequisiteChapterTitle?: string | null;
}

export interface AdaptiveAction {
    type: 'ACADEMIC_REVIEW' | 'ACADEMIC_PRACTICE' | 'ACADEMIC_NEW' | 'IQ_EXERCISE' | 'EQ_EXERCISE';
    details: {
        subject?: string;
        chapter?: string;
        concept?: string;
        skill?: string;
        reasoning: string;
        confidence?: number;
    };
}

export interface StudentQuestion {
    id: string;
    studentId: string;
    studentName: string;
    grade: string;
    subject: string;
    chapter: string;
    concept: string;
    questionText: string;
    timestamp: string;
    fittoResponse?: FittoResponse;
}

export interface FittoResponse {
    isRelevant: boolean;
    responseText: string;
}

export interface AIAnalysis {
    modelAnswer: string;
    pedagogicalNotes: string;
}

export interface WrittenAnswerEvaluation {
    modelAnswer: string;
    markingScheme: string;
    personalizedFeedback: string;
    proTips: string;
}

export interface SATAnswerEvaluation {
    modelApproach: string;
    personalizedFeedback: string;
    keyConcept: string;
    proTips: string;
}


// --- Feature-specific Types ---

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    state?: 'thinking' | 'error';
}

export interface StoryNodeChoice {
  text: string;
  nextNodeId: string;
  feedback: string;
}

export interface StoryNode {
  id: string;
  text: string;
  choices: StoryNodeChoice[];
  isEnding: boolean;
}

export interface AdaptiveStory {
  type: 'adaptiveStory';
  id: string;
  title: string;
  introduction: string;
  startNodeId: string;
  nodes: StoryNode[];
}

export type AptitudeTrait = 'Logical Reasoning' | 'Verbal Ability' | 'Numerical Aptitude' | 'Spatial Awareness';

export interface AptitudeQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    trait: AptitudeTrait;
    explanation: string;
}

export interface CareerGuidance {
    introduction: string;
    streamRecommendations: {
        streamName: 'Science' | 'Commerce' | 'Humanities/Arts';
        recommendationReason: string;
        suggestedCareers: {
            careerName: string;
            description: string;
            requiredSubjects: string[];
        }[];
    }[];
    conclusion: string;
}

export interface CurriculumOutlineChapter {
    chapterTitle: string;
    learningObjectives: string[];
}

export interface QuestionBankItem {
    questionText: string;
    questionType: 'MCQ' | 'Short Answer' | 'Long Answer';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    bloomTaxonomy: 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';
    isCompetencyBased: boolean;
    isPreviousYearQuestion: boolean;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    markingScheme?: string;
    modelAnswer?: string;
    answerWritingGuidance?: string;
}

export interface ChapterProgress {
    completedConcepts: string[];
    lastAccessed: string;
}

export interface AIFeedback {
    id: string;
    userRole: 'teacher' | 'parent';
    studentId: string;
    contentIdentifier: string;
    rating: 'up' | 'down';
    comment?: string;
    timestamp: string;
}

export interface LearningStreak {
    count: number;
    lastDate: string; // YYYY-MM-DD
}

export interface FAQItem {
    questionKey: string;
    answerKey: string;
}

export interface FAQSection {
    role: 'student' | 'teacher' | 'parent';
    titleKey: string;
    items: FAQItem[];
}

export interface InteractiveVideoSimulation {
    type: 'simulation';
    title: string;
    description: string;
    videoPrompt: string;
}

export interface VirtualLab {
    type: 'virtualLab';
    title: string;
    description: string;
    variables: { name: string; options: string[] }[];
    baseScenarioPrompt: string;
    outcomePromptTemplate: string;
}
export interface InteractiveExplainer {
    type: 'interactiveExplainer';
    title: string;
    description: string;
    variables: { name: string; options: string[] }[];
    videoPromptTemplate: string;
}

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

export interface Project {
  id: string;
  title: string;
  subject: string;
  grade: string;
  priority: 'High' | 'Medium' | 'Low';
  problemStatement: string;
  objectives: string[];
  guidingQuestions: string[];
  submissions: ProjectSubmission[];
}

export interface ProjectSubmission {
  studentId: string;
  studentName: string;
  studentAvatarUrl: string;
  solutionText: string;
  solutionUrl?: string;
  submittedDate: string;
}

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

export interface BoardPaper {
    year: number;
    grade: string;
    subject: string;
    paperTitle: string;
    questions: string[];
    solutions: string[];
}
