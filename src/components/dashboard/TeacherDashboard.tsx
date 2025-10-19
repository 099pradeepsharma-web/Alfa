import React, { useState, useEffect } from 'react';
import { ClassroomService, EnhancedDataService } from '../../services/enhanced-supabase';
import { DataService } from '../../services/supabase';
import { CloudStatus } from '../status/CloudStatus';

interface TeacherDashboardProps {
  user: any;
  profile: any;
  organization?: any;
}

interface StudentSummary {
  id: string;
  name: string;
  grade: string;
  subjects: string[];
  avgScore: number;
  totalQuizzes: number;
  lastActive: string;
  recentAchievements: number;
  pendingGoals: number;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  profile,
  organization
}) => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'analytics' | 'classes'>('overview');

  useEffect(() => {
    loadTeacherData();
  }, [user.id, selectedSubject]);

  const loadTeacherData = async () => {
    setIsLoading(true);
    
    try {
      // Get assigned students
      const assignedStudents = await ClassroomService.getStudentsForTeacher(
        user.id,
        selectedSubject === 'all' ? undefined : selectedSubject
      );

      // Get detailed data for each student
      const studentSummaries: StudentSummary[] = [];
      
      for (const student of assignedStudents) {
        // Get performance data
        const performance = await DataService.getPerformance(student.id, 10);
        const achievements = await DataService.getAchievements(student.id);
        const goals = await DataService.getStudyGoals(student.id);
        
        const avgScore = performance.length > 0 
          ? performance.reduce((sum, p) => sum + p.score, 0) / performance.length
          : 0;
          
        const pendingGoals = goals.filter(g => !g.is_completed).length;
        const recentAchievements = achievements.filter(a => {
          const achievementDate = new Date(a.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return achievementDate >= weekAgo;
        }).length;
        
        studentSummaries.push({
          id: student.id,
          name: student.full_name || 'Student',
          grade: student.grade || 'N/A',
          subjects: student.subjects,
          avgScore: Math.round(avgScore * 10) / 10,
          totalQuizzes: performance.length,
          lastActive: student.last_active_at || 'Never',
          recentAchievements,
          pendingGoals
        });
      }
      
      setStudents(studentSummaries);
      
      // Get org-wide analytics if available
      if (organization?.id) {
        const analytics = await EnhancedDataService.getOrgPerformanceAnalytics(
          organization.id,
          'month'
        );
        setAnalyticsData(analytics);
      }
      
    } catch (error) {
      console.error('Teacher data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUniqueSubjects = (): string[] => {
    const subjects = new Set<string>();
    students.forEach(student => {
      student.subjects.forEach(subject => subjects.add(subject));
    });
    return Array.from(subjects).sort();
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatLastActive = (dateString: string): string => {
    if (dateString === 'Never') return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 5) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.full_name || 'Teacher'}!
              </h1>
              <p className="text-gray-600 mt-1">
                {organization?.name || 'Your School'} • {students.length} Students
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <CloudStatus />
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 mt-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'students', label: 'Students', icon: '👥' },
              { key: 'analytics', label: 'Analytics', icon: '📈' },
              { key: 'classes', label: 'Classes', icon: '🏫' },
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                    <p className="text-sm text-gray-600">Active Students</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.reduce((sum, s) => sum + s.totalQuizzes, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Quizzes Completed</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.length > 0 
                        ? Math.round((students.reduce((sum, s) => sum + s.avgScore, 0) / students.length) * 10) / 10
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600">Class Average</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.filter(s => {
                        const lastActive = new Date(s.lastActive);
                        const dayAgo = new Date();
                        dayAgo.setDate(dayAgo.getDate() - 1);
                        return lastActive >= dayAgo;
                      }).length}
                    </p>
                    <p className="text-sm text-gray-600">Active Today</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Student Activity</h3>
              <div className="space-y-4">
                {students.slice(0, 5).map(student => (
                  <div key={student.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          {student.grade} • {student.subjects.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium px-2 py-1 rounded ${getPerformanceColor(student.avgScore)}`}>
                          {student.avgScore}% avg
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {student.totalQuizzes} quizzes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {student.recentAchievements} 🏆
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatLastActive(student.lastActive)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Subject Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Student Performance Overview ({students.length} students)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subjects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-medium text-sm">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.grade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {student.subjects.map(subject => (
                              <span key={subject} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(student.avgScore)}`}>
                              {student.avgScore}% average
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {student.totalQuizzes} quizzes taken
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-900">
                              {formatLastActive(student.lastActive)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.recentAchievements} achievements this week
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Goals</span>
                                <span>{Math.max(0, 5 - student.pendingGoals)}/5</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.max(0, (5 - student.pendingGoals) / 5 * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Class Performance Analytics</h3>
            
            {analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Subject Performance</h4>
                  <div className="space-y-3">
                    {analyticsData.subjectBreakdown.map((subject: any) => (
                      <div key={subject.subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{subject.subject}</span>
                        <div className="text-right">
                          <span className={`font-semibold ${getPerformanceColor(subject.avgScore)}`}>
                            {subject.avgScore.toFixed(1)}%
                          </span>
                          <p className="text-xs text-gray-500">{subject.count} quizzes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Overall Metrics</h4>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg text-center">
                      <p className="text-3xl font-bold text-blue-600">{analyticsData.avgScore}%</p>
                      <p className="text-sm text-gray-600">Class Average Score</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600">{analyticsData.totalQuizzes}</p>
                      <p className="text-sm text-gray-600">Total Quizzes This Month</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600">Analytics data will appear here as students complete more activities.</p>
              </div>
            )}
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'students' && (
          <div className="text-center py-12">
            <p className="text-gray-600">Detailed student management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'classes' && (
          <div className="text-center py-12">
            <p className="text-gray-600">Class management interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;