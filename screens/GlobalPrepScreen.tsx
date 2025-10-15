import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, GlobeAltIcon, BookOpenIcon, CheckIcon, LanguageIcon, LightbulbIcon, ChatBubbleBottomCenterTextIcon, TrophyIcon, StarIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon, ForwardIcon, RocketLaunchIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/solid';
import { PlayCircle } from 'lucide-react';
import { QuizQuestion, SATAnswerEvaluation } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import StructuredText from '../components/StructuredText';

interface GlobalPrepScreenProps {
  onBack: () => void;
}

const EvaluationCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="p-4 bg-bg-primary rounded-lg border border-border">
        <h5 className="font-bold text-lg text-primary mb-3 flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {title}
        </h5>
        <div className="prose max-w-none dark:prose-invert text-sm">{children}</div>
    </div>
);


const GlobalPrepScreen: React.FC<GlobalPrepScreenProps> = ({ onBack }) => {
    const { t, language } = useLanguage();
    const [view, setView] = useState<'hub' | 'testing'>('hub');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testQuestions, setTestQuestions] = useState<QuizQuestion[] | null>(null);

    // State for the interactive player
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [approachText, setApproachText] = useState('');
    const [evaluation, setEvaluation] = useState<SATAnswerEvaluation | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    const exams = [
        { id: 'sat', title: t('satTitle'), description: t('satDescription'), icon: BookOpenIcon, status: 'active' },
        { id: 'act', title: t('actTitle'), description: t('actDescription'), icon: CheckIcon, status: 'coming_soon' },
        { id: 'toefl', title: t('toeflTitle'), description: t('toeflDescription'), icon: LanguageIcon, status: 'coming_soon' },
        { id: 'ielts', title: t('ieltsTitle'), description: t('ieltsDescription'), icon: DocumentTextIcon, status: 'coming_soon' },
    ];

    const handleStartPractice = async (examId: string) => {
        if (examId !== 'sat') return;
        setIsLoading(true);
        setError(null);
        try {
            const questions = await geminiService.generateSATPracticeTest(language);
            setTestQuestions(questions);
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setApproachText('');
            setEvaluation(null);
            setView('testing');
        } catch (err: any) {
            setError(err.message || 'Failed to generate test.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBackToHub = () => {
        setView('hub');
        setTestQuestions(null);
        setError(null);
    };

    const handleSelectAnswer = (option: string) => {
        if (isAnswered) return;
        setSelectedAnswer(option);
        setIsAnswered(true);
    };

    const handleEvaluateApproach = async () => {
        if (!testQuestions || !approachText) return;
        setIsEvaluating(true);
        setEvaluation(null);
        try {
            const currentQuestion = testQuestions[currentIndex];
            const result = await geminiService.evaluateSATAnswerApproach(currentQuestion.question, approachText, language);
            setEvaluation(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNextQuestion = () => {
        if (testQuestions && currentIndex < testQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setApproachText('');
            setEvaluation(null);
            setError(null);
        } else {
            handleBackToHub();
        }
    };
    
    const getOptionStyle = (option: string, correctAnswer: string) => {
        if (!isAnswered) {
            return 'bg-surface border-border text-text-primary hover:border-primary';
        }
        const isCorrect = option === correctAnswer;
        const isSelected = selectedAnswer === option;

        if (isCorrect) return 'bg-status-success border-status-success text-status-success';
        if (isSelected && !isCorrect) return 'bg-status-danger border-status-danger text-status-danger';
        return 'bg-surface border-border opacity-60';
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary text-lg">{t('generatingTest')}</p>
            </div>
        );
    }
    
    if (view === 'testing' && testQuestions) {
        const currentQuestion = testQuestions[currentIndex];
        const isLastQuestion = currentIndex === testQuestions.length - 1;
        return (
            <div className="animate-fade-in">
                <button onClick={handleBackToHub} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('globalPrepTitle')}
                </button>
                <div className="dashboard-highlight-card p-8">
                     <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">{t('satPracticeTestTitle')}</h2>
                            <p className="text-text-secondary">{currentQuestion.conceptTitle}</p>
                        </div>
                        <div className="text-lg font-semibold text-text-secondary">
                            {t('question')} {currentIndex + 1} <span className="text-slate-600">/ {testQuestions.length}</span>
                        </div>
                    </div>
                    
                    <p className="text-xl font-semibold text-text-primary mb-6">{currentQuestion.question}</p>
                    <div className="space-y-4">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(option)}
                                disabled={isAnswered}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center ${getOptionStyle(option, currentQuestion.correctAnswer)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {isAnswered && (
                        <div className="mt-6 animate-fade-in space-y-6">
                            <div className="p-4 bg-surface rounded-lg">
                                <p className={`font-bold text-lg flex items-center gap-2 ${selectedAnswer === currentQuestion.correctAnswer ? 'text-status-success' : 'text-status-danger'}`}>
                                    {selectedAnswer === currentQuestion.correctAnswer ? <CheckCircleIcon className="h-6 w-6"/> : <XCircleIcon className="h-6 w-6"/>}
                                    {selectedAnswer === currentQuestion.correctAnswer ? t('correct') : t('incorrect')}
                                </p>
                                <div className="mt-2 prose max-w-none dark:prose-invert text-sm">
                                    <StructuredText text={currentQuestion.explanation} />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-surface rounded-lg">
                                <h4 className="font-bold text-lg text-text-primary mb-3">{t('getFeedbackOnApproach')}</h4>
                                <textarea 
                                    value={approachText}
                                    onChange={(e) => setApproachText(e.target.value)}
                                    rows={4}
                                    placeholder={t('yourApproach')}
                                    className="w-full text-sm"
                                />
                                <button onClick={handleEvaluateApproach} disabled={isEvaluating || !approachText} className="btn-accent mt-2 flex items-center justify-center">
                                    {isEvaluating ? <><LoadingSpinner /><span className="ml-2">{t('evaluatingApproach')}</span></> : t('submitForFeedback')}
                                </button>
                            </div>

                            {evaluation && (
                                <div className="mt-6 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <EvaluationCard title={t('modelApproach')} icon={DocumentTextIcon}><StructuredText text={evaluation.modelApproach}/></EvaluationCard>
                                    <EvaluationCard title={t('feedbackOnYourApproach')} icon={ChatBubbleBottomCenterTextIcon}><StructuredText text={evaluation.personalizedFeedback}/></EvaluationCard>
                                    <EvaluationCard title={t('keyConceptTested')} icon={TrophyIcon}><p>{evaluation.keyConcept}</p></EvaluationCard>
                                    <EvaluationCard title={t('proTipsForSAT')} icon={StarIcon}><StructuredText text={evaluation.proTips}/></EvaluationCard>
                                </div>
                            )}
                             <div className="text-right mt-6">
                                <button onClick={handleNextQuestion} className="btn-accent flex items-center ml-auto">
                                    {isLastQuestion ? t('finishTest') : t('nextQuestion')} <ChevronRightIcon className="h-5 w-5 ml-1"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center">
                    <GlobeAltIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('globalPrepTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">
                        {t('globalPrepDescription')}
                    </p>
                </div>
                
                {error && <p className="text-center text-status-danger mt-4">{error}</p>}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map(exam => {
                        const Icon = exam.icon;
                        const isActive = exam.status === 'active';
                        return (
                            <div key={exam.id} className={`bg-bg-primary p-6 rounded-xl border border-border flex flex-col ${!isActive ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-light rounded-lg">
                                        <Icon className="h-7 w-7 text-primary-dark"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary">{exam.title}</h3>
                                </div>
                                <p className="text-sm text-text-secondary mt-3 flex-grow">{exam.description}</p>
                                <button
                                    onClick={() => handleStartPractice(exam.id)}
                                    disabled={!isActive}
                                    className={`w-full mt-4 py-2 px-4 font-bold rounded-lg transition flex items-center justify-center gap-2 ${isActive ? 'btn-accent' : 'bg-border text-text-secondary cursor-not-allowed'}`}
                                >
                                    {isActive ? <><PlayCircle className="h-5 w-5"/>{t('startPractice')}</> : t('comingSoon')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GlobalPrepScreen;