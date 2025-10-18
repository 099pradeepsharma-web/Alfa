// This file defines all the core data structures and types used throughout the application.

// --- Core Curriculum Types ---

export interface MiniQuiz {
  question: string;
  answer: string;
}

export interface Topic {
  title: string;
  objective?: string;
  subTopics?: Topic[];
  // New detailed content format
  hook?: string;
  explanation?: string;
  keyIdea?: string;
  visualHint?: string;
  mentorVoice?: string;
  quickTip?: string;
  miniQuiz?: MiniQuiz[];
  challenge?: string;
  closingLine?: string;
}

export interface Chapter {
  title: string;
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

// --- User & Profile Types ---

export interface PerformanceRecord {
  subject: string;
  chapter: string;
  score: number;
  completedDate: string;
  type?: 'quiz' | 'exercise' | 'iq' | 'eq';
  context?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  timestamp?: string;
}

export interface StudyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
  dueDate?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
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

// --- AI & Learning Flow Types ---

export interface NextStepRecommendation {
  recommendationText: string;
  nextChapterTitle?: string | null;
  action: 'REVIEW' | 'CONTINUE' | 'REVISE_PREREQUISITE' | 'START_CRITICAL_THINKING' | 'START_WELLBEING';
  prerequisiteChapterTitle?: string | null;
}

export interface Concept {
  conceptTitle: string;
  explanation: string;
  realWorldExample: string;
  diagramDescription: string;
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

export interface Trigger {
  triggerType: 'paradoxicalQuestion' | 'realWorldVideo' | 'interdisciplinaryConnection';
  title: string;
  description: string;
  pushNotification: string;
}

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
  reward?: XpReward | VideoReward | null;
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
  description: string;
  introduction: string;
  startNodeId: string;
  nodes: StoryNode[];
}
export interface InteractiveExplainer {
  type: 'interactiveExplainer';
  title: string;
  description: string;
  variables: { name: string; options: string[] }[];
  videoPromptTemplate: string;
}
export interface ProjectLab {
    type: 'project';
    title: string;
    description: string;
    labInstructions?: string | null;
}

export type PracticalApplicationLab = InteractiveVideoSimulation | VirtualLab | AdaptiveStory | InteractiveExplainer | ProjectLab;


export interface LearningModule {
  chapterTitle: string;
  missionBriefing: Trigger[];
  coreConceptTraining: CoreConceptLesson[];
  practiceArena: PracticeArena;
  practicalApplicationLab: PracticalApplicationLab;
  bossFight: QuizQuestion[];
  categorizedProblems?: any;
}

export interface FittoResponse {
  isRelevant: boolean;
  responseText: string;
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

export interface AIAnalysis {
  modelAnswer: string;
  pedagogicalNotes: string;
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

export interface CurriculumOutlineChapter {
  chapterTitle: string;
  learningObjectives: string[];
}

export interface AptitudeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  trait: 'Logical Reasoning' | 'Verbal Ability' | 'Numerical Aptitude' | 'Spatial Awareness';
  explanation: string;
}

export type AptitudeTrait = AptitudeQuestion['trait'];

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

// --- Data Persistence & Misc Types ---

export interface ChapterProgress {
  completedConcepts: string[];
  masteredConcepts: string[];
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

export interface ChatMessage {
  id: string | number;
  role: 'user' | 'model';
  text: string;
  state?: 'thinking' | 'error';
}

export interface QuestionBankItem {
    questionText: string;
    questionType: 'MCQ' | 'Short Answer' | 'Long Answer';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    bloomTaxonomy: 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';
    isCompetencyBased: boolean;
    isPreviousYearQuestion: boolean;
    options: string[];
    correctAnswer: string;
    explanation: string;
    markingScheme?: string;
    modelAnswer?: string;
    answerWritingGuidance?: string;
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
    upvotes: string[];
    downvotes: string[];
    flags: string[];
}

// --- NEW BOARD EXAM PREP TYPES ---

export interface BoardPaperQuestion {
  q_no: string;
  text: string;
  marks: number;
  type: 'MCQ' | 'ASSERTION_REASON' | 'VSA' | 'SA' | 'LA' | 'CASE_BASED';
  options?: string[];
  solution: string;
  diagramSvg?: string;
}

export interface BoardPaperSection {
  name: string;
  description: string;
  questions: BoardPaperQuestion[];
}

export interface BoardPaper {
  year: number;
  grade: string;
  subject: string;
  paperTitle: string;
  totalMarks: number;
  timeAllowed: number; // in minutes
  sections: BoardPaperSection[];
  isGenerated?: boolean;
}


// --- NEW COGNITIVE TWIN TYPES ---

export interface CognitiveTraits {
    attentionSpan: { value: number; analysis: string; };
    confidence: { value: number; analysis: string; };
    resilience: { value: number; analysis: string; };
}

export interface LearningStyleProfile {
    style: 'Visual' | 'Textual' | 'Practical' | 'Theoretical' | 'Balanced';
    analysis: string;
}

export interface MemoryConcept {
    concept: string;
    subject: string;
    retentionStrength: number; // 0-100
    lastRevised: string;
}

export interface CognitiveProfile {
    cognitiveTraits: CognitiveTraits;
    learningStyle: LearningStyleProfile;
    memoryMatrix: MemoryConcept[];
}