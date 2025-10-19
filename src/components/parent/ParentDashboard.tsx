import React, { useState, useEffect } from 'react';
import { FamilyService, ClassroomService } from '../../services/enhanced-supabase';
import { DataService } from '../../services/supabase';
import { CloudStatus } from '../status/CloudStatus';

interface ParentDashboardProps {
  user: any;
  profile: any;
  organization?: any;
}

interface ChildSummary {
  id: string;
  name: string;
  grade: string;
  school: string;
  avgScore: number;
  totalQuizzes: number;
  completedGoals: number;
  totalGoals: number;
  recentAchievements: any[];
  subjects: { subject: string; avgScore: number; lastQuiz: string }[];
  teachers: { name: string; subject: string; email?: string }[];
  lastActive: string;
  weeklyProgress: { day: string; score: number }[];
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  user,
  profile,
  organization
}) => {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'teachers' | 'goals'>('overview');

  useEffect(() => {
    loadParentData();
  }, [user.id]);

  const loadParentData = async () => {
    setIsLoading(true);
    
    try {
      // Get linked children
      const linkedChildren = await FamilyService.getChildrenForParent(user.id);
      
      const childSummaries: ChildSummary[] = [];
      
      for (const child of linkedChildren) {
        // Get child's performance data
        const performance = await DataService.getPerformance(child.id, 20);
        const achievements = await DataService.getAchievements(child.id);
        const goals = await DataService.getStudyGoals(child.id);
        const teachers = await ClassroomService.getTeachersForStudent(child.id);
        
        // Calculate metrics
        const avgScore = performance.length > 0 
          ? performance.reduce((sum, p) => sum + p.score, 0) / performance.length
          : 0;
          
        const completedGoals = goals.filter(g => g.is_completed).length;
        
        // Recent achievements (last 2 weeks)
        const recentAchievements = achievements.filter(a => {
          const achievementDate = new Date(a.created_at);
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return achievementDate >= twoWeeksAgo;
        });
        
        // Subject breakdown
        const subjectMap = new Map();
        performance.forEach(p => {
          if (!subjectMap.has(p.subject)) {
            subjectMap.set(p.subject, { scores: [], dates: [] });
          }
          subjectMap.get(p.subject).scores.push(p.score);
          subjectMap.get(p.subject).dates.push(p.completed_date);
        });
        
        const subjects = Array.from(subjectMap.entries()).map(([subject, data]) => ({
          subject,
          avgScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
          lastQuiz: Math.max(...data.dates.map((d: string) => new Date(d).getTime()))
        }));
        
        // Weekly progress (last 7 days)
        const weeklyProgress = generateWeeklyProgress(performance);
        
        childSummaries.push({
          id: child.id,
          name: child.full_name || 'Student',
          grade: child.grade || 'N/A',
          school: child.school_name || organization?.name || 'School',
          avgScore: Math.round(avgScore * 10) / 10,
          totalQuizzes: performance.length,
          completedGoals,
          totalGoals: goals.length,
          recentAchievements,
          subjects: subjects.map(s => ({
            ...s,
            avgScore: Math.round(s.avgScore * 10) / 10,
            lastQuiz: new Date(s.lastQuiz).toLocaleDateString()
          })),
          teachers: teachers.map(t => ({
            name: t.full_name || 'Teacher',
            subject: t.subjects.join(', '),
            email: t.email
          })),
          lastActive: child.last_active_at || 'Never',
          weeklyProgress
        });
      }
      
      setChildren(childSummaries);
      if (childSummaries.length > 0 && !selectedChild) {
        setSelectedChild(childSummaries[0].id);
      }
      
    } catch (error) {
      console.error('Parent data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyProgress = (performance: any[]): { day: string; score: number }[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyData = performance.filter(p => 
      new Date(p.completed_date) >= weekAgo
    );
    
    // Group by day and average scores
    const dayMap = new Map();
    weeklyData.forEach(p => {
      const day = new Date(p.completed_date).toLocaleDateString('en-US', { weekday: 'short' });
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day).push(p.score);
    });
    
    return days.map(day => ({
      day,
      score: dayMap.has(day) 
        ? dayMap.get(day).reduce((a: number, b: number) => a + b, 0) / dayMap.get(day).length
        : 0
    }));
  };

  const getSelectedChild = (): ChildSummary | null => {
    return children.find(c => c.id === selectedChild) || null;
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceTrend = (weeklyProgress: { day: string; score: number }[]): 'up' | 'down' | 'stable' => {
    const validDays = weeklyProgress.filter(d => d.score > 0);
    if (validDays.length < 2) return 'stable';
    
    const firstHalf = validDays.slice(0, Math.floor(validDays.length / 2));
    const secondHalf = validDays.slice(Math.floor(validDays.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'up';
    if (secondAvg < firstAvg - 5) return 'down';
    return 'stable';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Children Linked</h2>
          <p className="text-gray-600 mb-6">
            You don't have any children linked to your parent account yet. 
            Contact your school administrator to link your children's accounts.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@alfanumrik.com'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  const selectedChildData = getSelectedChild();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parent Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitoring {children.length} {children.length === 1 ? 'child' : 'children'}'s progress
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <CloudStatus />
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Child Selector */}
          {children.length > 1 && (
            <div className="mt-4">
              <div className="flex space-x-2">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedChild === child.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mt-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'progress', label: 'Progress', icon: '📈' },
              { key: 'teachers', label: 'Teachers', icon: '👩‍🏫' },
              { key: 'goals', label: 'Goals', icon: '🎯' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {selectedChildData && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Child Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {selectedChildData.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedChildData.name}</h2>
                        <p className="text-gray-600">
                          {selectedChildData.grade} • {selectedChildData.school}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Last active: {new Date(selectedChildData.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(selectedChildData.avgScore)}`}>
                        {selectedChildData.avgScore}% Overall Average
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedChildData.totalQuizzes} quizzes completed
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedChildData.totalQuizzes}
                      </div>
                      <div className="text-sm text-blue-800">Quizzes Taken</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedChildData.completedGoals}/{selectedChildData.totalGoals}
                      </div>
                      <div className="text-sm text-green-800">Goals Completed</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedChildData.recentAchievements.length}
                      </div>
                      <div className="text-sm text-purple-800">New Achievements</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedChildData.subjects.length}
                      </div>
                      <div className="text-sm text-orange-800">Active Subjects</div>
                    </div>
                  </div>
                </div>

                {/* Recent Achievements */}
                {selectedChildData.recentAchievements.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🏆 Recent Achievements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedChildData.recentAchievements.slice(0, 4).map(achievement => (
                        <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <p className="font-medium text-gray-900">{achievement.title}</p>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                              +{achievement.points} points • {new Date(achievement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject Performance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
                  <div className="space-y-4">
                    {selectedChildData.subjects.map(subject => (
                      <div key={subject.subject} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{subject.subject}</p>
                          <p className="text-sm text-gray-600">Last quiz: {subject.lastQuiz}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getPerformanceColor(subject.avgScore)}`}>
                            {subject.avgScore}%
                          </span>
                          <div className="flex items-center mt-2">
                            {getPerformanceTrend(selectedChildData.weeklyProgress) === 'up' && (
                              <span className="text-green-500 text-sm">↑ Improving</span>
                            )}
                            {getPerformanceTrend(selectedChildData.weeklyProgress) === 'down' && (
                              <span className="text-red-500 text-sm">↓ Declining</span>
                            )}
                            {getPerformanceTrend(selectedChildData.weeklyProgress) === 'stable' && (
                              <span className="text-gray-500 text-sm">→ Stable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress Trend</h3>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {selectedChildData.weeklyProgress.map(day => (
                      <div key={day.day} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all duration-300"
                          style={{ 
                            height: `${Math.max(8, (day.score / 100) * 200)}px`,
                            opacity: day.score > 0 ? 1 : 0.2
                          }}
                        ></div>
                        <div className="mt-2 text-xs text-gray-600 text-center">
                          <div>{day.day}</div>
                          <div className="font-medium">{day.score > 0 ? `${Math.round(day.score)}%` : '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Study Goals Progress */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Goals Progress</h3>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Completed Goals</span>
                      <span>{selectedChildData.completedGoals} of {selectedChildData.totalGoals}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${selectedChildData.totalGoals > 0 ? (selectedChildData.completedGoals / selectedChildData.totalGoals * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your child is making great progress on their learning objectives!
                  </p>
                </div>
              </div>
            )}

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Child's Teachers</h3>
                <div className="space-y-4">
                  {selectedChildData.teachers.map((teacher, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {teacher.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-sm text-gray-600">{teacher.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {teacher.email && (
                          <button
                            onClick={() => window.location.href = `mailto:${teacher.email}`}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                          >
                            📧 Contact
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Study Goals & Objectives
                </h3>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Detailed goals tracking interface coming soon...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Currently showing: {selectedChildData.completedGoals} of {selectedChildData.totalGoals} goals completed
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;