import React from 'react';
import { Container } from '../components/Container';
import { Card } from '../components/Card';

interface DashboardProps {
  studentName?: string;
  masteryLevel?: number;
  onStartLearning?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ studentName = 'Student', masteryLevel = 50, onStartLearning }) => {
  return (
    <Container>
      <Card title={`Welcome, ${studentName}`}> 
        <p>Your current mastery level: {masteryLevel}%</p>
        <button onClick={onStartLearning}>Start Learning</button>
      </Card>
      <Card title="Next Steps">
        <ul>
          <li>Review concepts</li>
          <li>Take a quiz</li>
          <li>Practice exercises</li>
        </ul>
      </Card>
      <Card title="Achievements">
        <p>You have earned 120 points this week.</p>
      </Card>
    </Container>
  );
};
