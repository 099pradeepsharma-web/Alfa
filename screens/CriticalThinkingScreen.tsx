import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, PuzzlePieceIcon, LightBulbIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon, BookOpenIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Play } from 'lucide-react';

interface CriticalThinkingScreenProps {
  onBack: () => void;
}

// --- Challenge Data Structure ---
interface ChallengeQuestion {
  question: string;
  passage?: string; // For inferential reading
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Challenge {
  id: 'logical-reasoning' | 'data-credibility' | 'inferential-reading';
  title: string;
  description: string;
  icon: React.ElementType;
  questions: ChallengeQuestion[];
}

// --- Dynamic Challenge Content based on language ---
const getChallenges = (t: (key: string) => string): Challenge[] => [
  {
    id: 'logical-reasoning',
    title: t('ctGym_lr_title'),
    description: t('ctGym_lr_desc'),
    icon: PuzzlePieceIcon,
    questions: [
      { question: t('ctGym_lr_q1_q'), options: [t('ctGym_lr_q1_o1'), t('ctGym_lr_q1_o2'), t('ctGym_lr_q1_o3'), t('ctGym_lr_q1_o4')], correctAnswer: t('ctGym_lr_q1_a'), explanation: t('ctGym_lr_q1_e') },
      { question: t('ctGym_lr_q2_q'), options: [t('ctGym_lr_q2_o1'), t('ctGym_lr_q2_o2'), t('ctGym_lr_q2_o3'), t('ctGym_lr_q2_o4')], correctAnswer: t('ctGym_lr_q2_a'), explanation: t('ctGym_lr_q2_e') },
      { question: t('ctGym_lr_q3_q'), options: [t('ctGym_lr_q3_o1'), t('ctGym_lr_q3_o2'), t('ctGym_lr_q3_o3'), t('ctGym_lr_q3_o4')], correctAnswer: t('ctGym_lr_q3_a'), explanation: t('ctGym_lr_q3_e') },
      { question: t('ctGym_lr_q4_q'), options: [t('ctGym_lr_q4_o1'), t('ctGym_lr_q4_o2'), t('ctGym_lr_q4_o3'), t('ctGym_lr_q4_o4')], correctAnswer: t('ctGym_lr_q4_a'), explanation: t('ctGym_lr_q4_e') },
      { question: t('ctGym_lr_q5_q'), options: [t('ctGym_lr_q5_o1'), t('ctGym_lr_q5_o2'), t('ctGym_lr_q5_o3'), t('ctGym_lr_q5_o4')], correctAnswer: t('ctGym_lr_q5_a'), explanation: t('ctGym_lr_q5_e') },
    ]
  },
  {
    id: 'data-credibility',
    title: t('ctGym_dc_title'),
    description: t('ctGym_dc_desc'),
    icon: CheckBadgeIcon,
    questions: [
      { question: t('ctGym_dc_q1_q'), options: [t('ctGym_dc_q1_o1'), t('ctGym_dc_q1_o2')], correctAnswer: t('ctGym_dc_q1_a'), explanation: t('ctGym_dc_q1_e') },
      { question: t('ctGym_dc_q2_q'), options: [t('ctGym_dc_q2_o1'), t('ctGym_dc_q2_o2'), t('ctGym_dc_q2_o3'), t('ctGym_dc_q2_o4')], correctAnswer: t('ctGym_dc_q2_a'), explanation: t('ctGym_dc_q2_e') },
      { question: t('ctGym_dc_q3_q'), options: [t('ctGym_dc_q3_o1'), t('ctGym_dc_q3_o2'), t('ctGym_dc_q3_o3'), t('ctGym_dc_q3_o4')], correctAnswer: t('ctGym_dc_q3_a'), explanation: t('ctGym_dc_q3_e') },
      { question: t('ctGym_dc_q4_q'), options: [t('ctGym_dc_q4_o1'), t('ctGym_dc_q4_o2'), t('ctGym_dc_q4_o3'), t('ctGym_dc_q4_o4')], correctAnswer: t('ctGym_dc_q4_a'), explanation: t('ctGym_dc_q4_e') },
    ]
  },
  {
    id: 'inferential-reading',
    title: t('ctGym_ir_title'),
    description: t('ctGym_ir_desc'),
    icon: BookOpenIcon,
    questions: [
      { passage: t('ctGym_ir_q1_p'), question: t('ctGym_ir_q1_q'), options: [t('ctGym_ir_q1_o1'), t('ctGym_ir_q1_o2'), t('ctGym_ir_q1_o3'), t('ctGym_ir_q1_o4')], correctAnswer: t('ctGym_ir_q1_a'), explanation: t('ctGym_ir_q1_e') },
      { passage: t('ctGym_ir_q2_p'), question: t('ctGym_ir_q2_q'), options: [t('ctGym_ir_q2_o1'), t('ctGym_ir_q2_o2'), t('ctGym_ir_q2_o3'), t('ctGym_ir_q2_o4')], correctAnswer: t('ctGym_ir_q2_a'), explanation: t('ctGym_ir_q2_e') },
      { passage: t('ctGym_ir_q3_p'), question: t('ctGym_ir_q3_q'), options: [t('ctGym_ir_q3_o1'), t('ctGym_ir_q3_o2'), t('ctGym_ir_q3_o3'), t('ctGym_ir_q3_o4')], correctAnswer: t('ctGym_ir_q3_a'), explanation: t('ctGym_ir_q3_e') },
      { passage: t('ctGym_ir_q4_p'), question: t('ctGym_ir_q4_q'), options: [t('ctGym_ir_q4_o1'), t('ctGym_ir_q4_o2'), t('ctGym_ir_q4_o3'), t('ctGym_ir_q4_o4')], correctAnswer: t('ctGym_ir_q4_a'), explanation: t('ctGym_ir_q4_e') },
    ]
  }
];

// --- Sub-Components for Different Views ---

const ChallengePlayer: React.FC<{
  challenge: Challenge;
  onFinish: (finalScore: number) => void;
}> = ({ challenge, onFinish }) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = challenge.questions[currentIndex];

  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    const isLastQuestion = currentIndex === challenge.questions.length - 1;
    if (isLastQuestion) {
      onFinish(score);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };
  
  const getOptionStyle = (option: string) => {
      if (!isAnswered) {
          return 'bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:border-primary';
      }
      const isCorrect = option === currentQuestion.correctAnswer;
      const isSelected = option === selectedAnswer;

      if (isCorrect) return 'bg-green-900/50 border-green-500 ring-2 ring-green-300';
      if (isSelected && !isCorrect) return 'bg-red-900/50 border-red-500 ring-2 ring-red-300';
      return 'bg-slate-700/50 border-slate-600 opacity-60 cursor-not-allowed';
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-text-primary">{challenge.title}</h3>
        <span className="font-semibold text-text-secondary">{currentIndex + 1} / {challenge.questions.length}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${((currentIndex + 1) / challenge.questions.length) * 100}%`, backgroundColor: 'rgb(var(--c-primary))' }}></div>
      </div>
      
      {currentQuestion.passage && <p className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-border italic text-slate-300">"{currentQuestion.passage}"</p>}
      <p className="font-semibold text-lg text-text-primary mb-6">{currentQuestion.question}</p>
      
      <div className="space-y-3">
        {currentQuestion.options.map(option => (
          <button key={option} onClick={() => handleSelectAnswer(option)} disabled={isAnswered} className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-start ${getOptionStyle(option)}`}>
              <span className="flex-shrink-0 mr-3 mt-1 h-5 w-5 rounded-full border-2 border-slate-400 flex items-center justify-center">
                  {selectedAnswer === option && <span className="h-2.5 w-2.5 rounded-full bg-primary" style={{backgroundColor: 'rgb(var(--c-primary))'}}></span>}
              </span>
              <span className="flex-grow">{option}</span>
          </button>
        ))}
      </div>

      {isAnswered && (
        <div className="mt-6 animate-fade-in">
          {selectedAnswer === currentQuestion.correctAnswer ? (
            <p className="font-bold text-lg flex items-center gap-2 text-green-400"><CheckCircleIcon className="h-6 w-6"/> {t('ctGymCorrect')}</p>
          ) : (
            <p className="font-bold text-lg flex items-center gap-2 text-red-400"><XCircleIcon className="h-6 w-6"/> {t('ctGymIncorrect')}</p>
          )}
          <div className="mt-2 p-3 bg-slate-900/50 rounded-md text-slate-300 flex items-start">
              <LightBulbIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
              <span><strong className="font-semibold text-text-primary">{t('explanation')}:</strong> {currentQuestion.explanation}</span>
          </div>
          <div className="text-right mt-4">
            <button onClick={handleNext} className="btn-accent flex items-center ml-auto">
              {currentIndex < challenge.questions.length - 1 ? t('ctGymNextQuestion') : t('ctGymFinishChallenge')}
              <ArrowRightIcon className="h-5 w-5 ml-2"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main Component ---

const CriticalThinkingScreen: React.FC<CriticalThinkingScreenProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'hub' | 'challenge' | 'results'>('hub');
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });
    
    const challenges = useMemo(() => getChallenges(t), [t]);

    const handleStartChallenge = (challenge: Challenge) => {
        setActiveChallenge(challenge);
        setView('challenge');
    };

    const handleFinishChallenge = (score: number) => {
        if (!activeChallenge) return;
        setFinalScore({ score, total: activeChallenge.questions.length });
        setView('results');
    };

    const handleRestart = () => {
        setView('hub');
        setActiveChallenge(null);
    };

    const renderHub = () => (
      <>
        <div className="text-center">
            <PuzzlePieceIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
            <h2 className="text-3xl font-bold text-text-primary mt-2">{t('ctGymTitle')}</h2>
            <p className="text-text-secondary mt-1 max-w-2xl mx-auto">
                {t('ctGymDescription')}
            </p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map(challenge => {
                const Icon = challenge.icon;
                return (
                    <div key={challenge.id} className="dashboard-highlight-card p-6 text-center flex flex-col">
                        <Icon className="h-10 w-10 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                        <h3 className="text-xl font-bold text-text-primary mt-4">{challenge.title}</h3>
                        <p className="text-sm text-text-secondary mt-2 flex-grow">{challenge.description}</p>
                        <button onClick={() => handleStartChallenge(challenge)} className="mt-4 btn-accent flex items-center justify-center gap-2">
                           <Play className="h-5 w-5"/> {t('ctGymStartChallenge')}
                        </button>
                    </div>
                );
            })}
        </div>
      </>
    );

    const renderResults = () => {
        const percentage = Math.round((finalScore.score / finalScore.total) * 100);
        return (
            <div className="text-center animate-fade-in">
                <h2 className="text-3xl font-bold text-text-primary">{t('ctGymChallengeComplete')}</h2>
                <p className="text-lg text-text-secondary mt-1">{t('ctGymYouScored')}</p>
                <div className="text-6xl font-bold my-4" style={{color: `rgb(var(--c-accent))`}}>{percentage}%</div>
                <p className="text-xl text-text-secondary">{t('ctGymScoreSummary', { score: finalScore.score, total: finalScore.total })}</p>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button onClick={() => activeChallenge && handleStartChallenge(activeChallenge)} className="px-6 py-2 bg-slate-700 text-text-primary font-semibold rounded-lg hover:bg-slate-600 transition flex items-center gap-2"><ArrowPathIcon className="h-5 w-5"/> {t('ctGymTryAgain')}</button>
                    <button onClick={handleRestart} className="btn-accent">{t('ctGymBackToGym')}</button>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <button onClick={view === 'hub' ? onBack : handleRestart} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {view === 'hub' ? t('backToDashboard') : t('ctGymBackToGym')}
            </button>

            <div className="dashboard-highlight-card p-8">
                {view === 'hub' && renderHub()}
                {view === 'challenge' && activeChallenge && <ChallengePlayer challenge={activeChallenge} onFinish={handleFinishChallenge} />}
                {view === 'results' && renderResults()}
            </div>
        </div>
    );
};

export default CriticalThinkingScreen;