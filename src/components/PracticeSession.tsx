import React, { useEffect, useState } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

function PracticeSession({ studentId }) {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [rewardPoints, setRewardPoints] = useState(0);
  const { playCorrect, playWrong, playReward } = useSoundEffects();

  useEffect(() => {
    // Initialize or fetch practice session here
    // Example: assume session initialized and set
    setSessionId('dummy-session-id');

    // Fetch first question or resume
    fetchNextQuestion('dummy-session-id');
  }, [studentId]);

  async function fetchNextQuestion(sessionId) {
    // Fetch next question from backend
    // Simulated here, replace with real API call
    const question = {
      id: 'q1',
      question_text: 'What is 2 + 2?',
      options: [
        { id: 'a1', text: '3' },
        { id: 'a2', text: '4' },
        { id: 'a3', text: '5' },
      ],
    };
    setCurrentQuestion(question);
  }

  async function handleAnswer(optionId) {
    if (!sessionId || !currentQuestion) return;

    // Submit answer to edge function
    const response = await fetch('/api/adaptive_practice_session', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        session_id: sessionId,
        question_id: currentQuestion.id,
        answer: optionId,
      }),
    });

    const data = await response.json();

    if (data.isCorrect) {
      playCorrect();
      setRewardPoints((prev) => prev + 10);
      playReward();
    } else {
      playWrong();
    }

    if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
    } else {
      alert('Practice session complete!');
      setCurrentQuestion(null);
    }
  }

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div>
      <h2>{currentQuestion.question_text}</h2>
      <ul>
        {currentQuestion.options.map((option) => (
          <li key={option.id}>
            <button onClick={() => handleAnswer(option.id)}>{option.text}</button>
          </li>
        ))}
      </ul>
      <p>Reward Points: {rewardPoints}</p>
    </div>
  );
}

export default PracticeSession;
