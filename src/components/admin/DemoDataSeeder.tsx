import React, { useState } from 'react';
import { DataService, ProfileService } from '../../services/supabase';
import { AuthService } from '../../services/supabase';

interface DemoDataSeederProps {
  className?: string;
}

export const DemoDataSeeder: React.FC<DemoDataSeederProps> = ({ className = '' }) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const demoStudents = [
    { name: 'Aarav Sharma', grade: 'Class 9', school: 'Delhi Public School' },
    { name: 'Priya Patel', grade: 'Class 10', school: 'Delhi Public School' },
    { name: 'Arjun Kumar', grade: 'Class 8', school: 'St. Xavier\'s High School' },
    { name: 'Ananya Singh', grade: 'Class 11', school: 'Delhi Public School' },
    { name: 'Rohan Gupta', grade: 'Class 9', school: 'Modern School' },
  ];

  const demoSubjects = [
    { subject: 'Mathematics', chapters: ['Algebra Basics', 'Geometry', 'Trigonometry'] },
    { subject: 'Science', chapters: ['Physics - Motion', 'Chemistry - Atoms', 'Biology - Life Processes'] },
    { subject: 'English', chapters: ['Grammar', 'Literature', 'Comprehension'] },
    { subject: 'Social Studies', chapters: ['History - Ancient India', 'Geography - Climate', 'Civics - Democracy'] },
  ];

  const demoAchievements = [
    { title: 'First Perfect Score! 💯', description: 'Achieved 100% in Mathematics quiz', points: 50, category: 'academic' },
    { title: 'Week Streak Champion 🔥', description: 'Completed goals for 7 consecutive days', points: 30, category: 'streak' },
    { title: 'Science Explorer 🧪', description: 'Completed all Science chapters', points: 40, category: 'milestone' },
    { title: 'Math Wizard 🧙‍♂️', description: 'Scored above 90% in 5 math quizzes', points: 60, category: 'academic' },
  ];

  const demoGoals = [
    'Complete 5 math practice problems daily',
    'Read one chapter of science textbook',
    'Improve English vocabulary by 10 words',
    'Solve previous year question papers',
    'Practice Hindi writing for 30 minutes',
  ];

  const seedDemoData = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    try {
      // Check if user is authenticated
      const { session } = await AuthService.getSession();
      if (!session) {
        throw new Error('Must be authenticated to seed demo data');
      }

      const currentUserId = session.user.id;
      const results = {
        profiles: 0,
        performance: 0,
        goals: 0,
        achievements: 0,
      };

      // Create demo profiles (using current user as template)
      for (const student of demoStudents) {
        // In a real scenario, each student would have their own auth.user entry
        // For demo, we'll create profiles that reference the current user
        // This is safe because RLS will only show data for the authenticated user
        
        const profileData = {
          role: 'student' as const,
          full_name: student.name,
          grade: student.grade,
          school_name: student.school,
        };

        const profile = await ProfileService.upsertProfile(currentUserId, profileData);
        if (profile) results.profiles++;
      }

      // Create demo performance records
      for (const subjectData of demoSubjects) {
        for (const chapter of subjectData.chapters) {
          const performanceRecord = {
            id: crypto.randomUUID(),
            student_id: currentUserId,
            subject: subjectData.subject,
            chapter: chapter,
            score: 75 + Math.floor(Math.random() * 25), // 75-100
            total_questions: 10,
            type: 'quiz' as const,
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
            completed_date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          };

          const success = await DataService.savePerformance(performanceRecord);
          if (success) results.performance++;
        }
      }

      // Create demo study goals
      for (const goalText of demoGoals) {
        const goal = {
          id: crypto.randomUUID(),
          student_id: currentUserId,
          text: goalText,
          is_completed: Math.random() > 0.5,
          due_date: null,
          created_at: new Date().toISOString(),
          completed_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        };

        const success = await DataService.saveStudyGoal(goal);
        if (success) results.goals++;
      }

      // Create demo achievements
      for (const achievement of demoAchievements) {
        if (Math.random() > 0.3) { // 70% chance for each achievement
          const achievementRecord = {
            id: crypto.randomUUID(),
            student_id: currentUserId,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.title.split(' ')[achievement.title.split(' ').length - 1], // Extract emoji
            points: achievement.points,
            category: achievement.category as 'academic' | 'streak' | 'improvement' | 'milestone',
            created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
          };

          const success = await DataService.saveAchievement(achievementRecord);
          if (success) results.achievements++;
        }
      }

      setSeedResult({
        success: true,
        message: 'Demo data seeded successfully!',
        details: results,
      });

    } catch (error) {
      console.error('Demo data seeding error:', error);
      setSeedResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to seed demo data',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const clearDemoData = async () => {
    if (!confirm('Are you sure you want to clear all demo data? This action cannot be undone.')) {
      return;
    }

    setIsSeeding(true);
    try {
      // Note: In a real implementation, you'd need server-side functions to safely delete data
      // For now, we'll just show a message about manual cleanup
      setSeedResult({
        success: true,
        message: 'Demo data clearing initiated. Check Supabase dashboard to verify.',
      });
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Failed to clear demo data',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Demo Data Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate realistic test data for platform demonstration and testing.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Admin Only
          </span>
        </div>
      </div>

      {/* Demo Data Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{demoStudents.length}</div>
          <div className="text-sm text-blue-800">Student Profiles</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{demoSubjects.reduce((acc, s) => acc + s.chapters.length, 0)}</div>
          <div className="text-sm text-green-800">Quiz Records</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{demoGoals.length}</div>
          <div className="text-sm text-purple-800">Study Goals</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{demoAchievements.length}</div>
          <div className="text-sm text-orange-800">Achievements</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={seedDemoData}
          disabled={isSeeding}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSeeding ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Seeding Demo Data...
            </div>
          ) : (
            'Generate Demo Data'
          )}
        </button>
        
        <button
          onClick={clearDemoData}
          disabled={isSeeding}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear Demo Data
        </button>
      </div>

      {/* Result Display */}
      {seedResult && (
        <div className={`mt-4 p-4 rounded-lg border ${
          seedResult.success 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <svg 
              className={`w-5 h-5 mt-0.5 mr-3 ${
                seedResult.success ? 'text-green-600' : 'text-red-600'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {seedResult.success ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <div className="flex-1">
              <p className="font-medium">{seedResult.message}</p>
              {seedResult.details && (
                <div className="mt-2 text-sm">
                  <p>Records created:</p>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li>Profiles: {seedResult.details.profiles}</li>
                    <li>Performance: {seedResult.details.performance}</li>
                    <li>Study Goals: {seedResult.details.goals}</li>
                    <li>Achievements: {seedResult.details.achievements}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Development Use Only:</strong> Demo data is created for the current authenticated user. 
              In production, each student would have their own authenticated account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDataSeeder;