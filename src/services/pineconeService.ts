import { StudyGoal, Achievement } from '../types';

// Mock service for study goals and achievements
// In production, this would connect to a real database

export const getStudyGoals = async (userId: string): Promise<StudyGoal[]> => {
  // Mock study goals
  return [
    {
      id: '1',
      text: 'Complete Math Chapter 5',
      isCompleted: false,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      text: 'Practice 10 Physics problems',
      isCompleted: true,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
};

export const addStudyGoal = async (userId: string, goalText: string, dueDate?: string): Promise<StudyGoal> => {
  const newGoal: StudyGoal = {
    id: Math.random().toString(36).substr(2, 9),
    text: goalText,
    isCompleted: false,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  
  return newGoal;
};

export const updateStudyGoal = async (userId: string, goal: StudyGoal): Promise<StudyGoal> => {
  // Mock update - in production, update in database
  return goal;
};

export const removeStudyGoal = async (userId: string, goalId: string): Promise<void> => {
  // Mock removal - in production, remove from database
  console.log(`Removing goal ${goalId} for user ${userId}`);
};

export const addAchievement = async (userId: string, achievement: Achievement): Promise<Achievement> => {
  // Mock add achievement - in production, save to database
  console.log(`Adding achievement ${achievement.id} for user ${userId}`);
  return achievement;
};
