// Type definitions for Alfanumrik application

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  school: string;
  masteryLevel: number;
  streakDays: number;
  totalPoints: number;
  achievements: Achievement[];
  studyGoals: StudyGoal[];
  performanceHistory: PerformanceRecord[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
  subjects: string[];
  students: Student[];
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  children: Student[];
}

export interface StudyGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'academic' | 'milestone' | 'consistency';
  timestamp: string;
}

export interface PerformanceRecord {
  id: string;
  subject: string;
  chapter: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  chapter: string;
}
