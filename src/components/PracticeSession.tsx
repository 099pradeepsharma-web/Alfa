import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';

function PracticeSession({ studentId }) {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [showWrongAnimation, setShowWrongAnimation] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
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
      setShowCorrectAnimation(true);
      setRewardPoints((prev) => prev + 10);
      setShowRewardAnimation(true);
      setTimeout(() => {
        setShowCorrectAnimation(false);
        setShowRewardAnimation(false);
      }, 1500);
    } else {
      playWrong();
      setShowWrongAnimation(true);
      setTimeout(() => setShowWrongAnimation(false), 1000);
    }

    if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
    } else {
      alert('Practice session complete!');
      setCurrentQuestion(null);
    }
  }

  return (
    <div style={{ position: 'relative', padding: 20 }}>
      {currentQuestion ? (
        <>
          <h2>{currentQuestion.question_text}</h2>
          <ul>
            {currentQuestion.options.map((option) => (
              <li key={option.id}>
                <button onClick={() => handleAnswer(option.id)}>{option.text}</button>
              </li>
            ))}
          </ul>
          <p>Reward Points: {rewardPoints}</p>
        </>
      ) : (
        <div>No more questions. Well done!</div>
      )}

      <AnimatePresence>
        {showCorrectAnimation && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            exit={{ scale: 0 }}
            style={{ position: 'absolute', top: 10, right: 10, color: 'green', fontSize: 48 }}
          >
            ✔️
          </motion.div>
        )}

        {showWrongAnimation && (
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: [0, -10, 10, -10, 10, 0] }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 10, right: 10, color: 'red', fontSize: 48 }}
          >
            ❌
          </motion.div>
        )}

        {showRewardAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 20, left: '50%', color: 'gold', fontWeight: 'bold' }}
          >
            +10 Points!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PracticeSession;
