import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

interface AtRiskCardProps {
  teacherId: string;
  orgId?: string;
  className?: string;
}

interface RiskStudent {
  id: string;
  name: string;
  grade: string;
  subject?: string;
  risk_level: 'low' | 'medium' | 'high';
  score: number;
  top_factors: {
    inactivity_days?: number;
    quizzes?: number;
    avg_score?: number;
  };
  recommended_actions: {
    assign_remedial?: boolean;
    notify_parent?: boolean;
    practice_more?: boolean;
    schedule_meeting?: boolean;
  };
}

export const AtRiskCard: React.FC<AtRiskCardProps> = ({
  teacherId,
  orgId,
  className = ''
}) => {
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRiskData();
    // Set up interval to refresh every 5 minutes
    const interval = setInterval(loadRiskData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [teacherId, orgId]);

  const loadRiskData = async () => {
    try {
      setError('');
      
      // Get teacher's assigned students from class_assignments
      const { data: assignments } = await supabase
        .from('class_assignments')
        .select(`
          student_id,
          student:profiles!class_assignments_student_id_fkey(id, full_name, grade)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) {
        setRiskStudents([]);
        setIsLoading(false);
        return;
      }

      const studentIds = assignments.map(a => a.student_id);
      
      // Get risk scores for these students
      let query = supabase
        .from('risk_scores')
        .select('*')
        .in('student_id', studentIds)
        .order('score', { ascending: false }); // Highest risk first
        
      if (orgId) {
        query = query.eq('org_id', orgId);
      }
      
      const { data: riskScores } = await query;
      
      if (!riskScores) {
        setRiskStudents([]);
        setIsLoading(false);
        return;
      }

      // Combine student info with risk data
      const studentsWithRisk: RiskStudent[] = riskScores.map(risk => {
        const assignment = assignments.find(a => a.student_id === risk.student_id);
        const student = assignment?.student;
        
        return {
          id: risk.student_id,
          name: student?.full_name || 'Unknown Student',
          grade: student?.grade || 'N/A',
          subject: risk.subject,
          risk_level: risk.risk_level,
          score: risk.score,
          top_factors: risk.top_factors || {},
          recommended_actions: risk.recommended_actions || {}
        };
      });

      setRiskStudents(studentsWithRisk);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Risk data loading error:', error);
      setError('Failed to load risk assessment data');
    } finally {
      setIsLoading(false);
    }
  };

  const computeRiskScores = async () => {
    if (!orgId) {
      setError('Organization ID required for risk computation');
      return;
    }

    setIsLoading(true);
    try {
      // Call edge function to compute risk scores
      const response = await fetch(
        `${process.env.VITE_SUPABASE_URL}/functions/v1/risk_compute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ org_id: orgId })
        }
      );

      if (!response.ok) {
        throw new Error('Risk computation failed');
      }

      await response.json();
      
      // Reload data after computation
      setTimeout(loadRiskData, 2000);
    } catch (error) {
      console.error('Risk computation error:', error);
      setError('Failed to compute risk scores');
    }
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string): string => {
    switch (level) {
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '✅';
      default: return '❔';
    }
  };

  const handleActionClick = (action: string, student: RiskStudent) => {
    // Placeholder for action handlers
    console.log(`Action: ${action} for student: ${student.name}`);
    // In real implementation:
    // - assign_remedial: Navigate to content assignment
    // - notify_parent: Send notification
    // - practice_more: Recommend specific topics
    // - schedule_meeting: Open calendar integration
  };

  const riskCounts = riskStudents.reduce(
    (acc, student) => {
      acc[student.risk_level] = (acc[student.risk_level] || 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<string, number>
  );

  if (isLoading && riskStudents.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <h3 className="text-lg font-semibold text-gray-900">Loading Risk Assessment...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 At-Risk Students
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={computeRiskScores}
            disabled={isLoading}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Computing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{riskCounts.high}</div>
          <div className="text-sm text-red-800">High Risk</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{riskCounts.medium}</div>
          <div className="text-sm text-yellow-800">Medium Risk</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{riskCounts.low}</div>
          <div className="text-sm text-green-800">Low Risk</div>
        </div>
      </div>

      {/* Risk Students List */}
      {riskStudents.length > 0 ? (
        <div className="space-y-3">
          {riskStudents.filter(s => s.risk_level !== 'low').slice(0, 5).map(student => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      {student.grade} {student.subject ? `• ${student.subject}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(student.risk_level)}`}>
                    {getRiskIcon(student.risk_level)} {student.risk_level.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Score: {Math.round(student.score)}
                  </span>
                </div>
              </div>
              
              {/* Risk Factors */}
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Risk Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {student.top_factors.inactivity_days && student.top_factors.inactivity_days > 3 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Inactive {student.top_factors.inactivity_days}d
                    </span>
                  )}
                  {student.top_factors.quizzes !== undefined && student.top_factors.quizzes < 3 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      Low practice ({student.top_factors.quizzes} quizzes)
                    </span>
                  )}
                  {student.top_factors.avg_score && student.top_factors.avg_score < 60 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Low scores ({student.top_factors.avg_score}% avg)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Recommended Actions */}
              <div className="flex flex-wrap gap-2">
                {student.recommended_actions.assign_remedial && (
                  <button
                    onClick={() => handleActionClick('assign_remedial', student)}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    📝 Assign Practice
                  </button>
                )}
                {student.recommended_actions.notify_parent && (
                  <button
                    onClick={() => handleActionClick('notify_parent', student)}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    📧 Notify Parent
                  </button>
                )}
                {student.recommended_actions.schedule_meeting && (
                  <button
                    onClick={() => handleActionClick('schedule_meeting', student)}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    📅 Schedule Meeting
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {riskStudents.filter(s => s.risk_level !== 'low').length > 5 && (
            <div className="text-center py-3">
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View all {riskStudents.filter(s => s.risk_level !== 'low').length} at-risk students →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">All Students On Track!</h4>
          <p className="text-gray-600 text-sm mb-4">
            No students are currently showing risk indicators. Great teaching!
          </p>
          <button
            onClick={computeRiskScores}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Re-compute Risk Assessment
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Never updated'}
        </span>
        <span>
          Risk scoring based on performance, activity, and engagement patterns
        </span>
      </div>
    </div>
  );
};

export default AtRiskCard;