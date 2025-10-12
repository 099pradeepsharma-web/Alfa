import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, AcademicCapIcon, DocumentTextIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Student, BoardPaper } from '../types';
import { BOARD_PAPERS } from '../data/boardPapers';
import StructuredText from '../components/StructuredText';

interface ExamPrepScreenProps {
  student: Student;
  onBack: () => void;
}

const ExamPrepScreen: React.FC<ExamPrepScreenProps> = ({ student, onBack }) => {
    const { t, tCurriculum } = useLanguage();

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedPaper, setSelectedPaper] = useState<BoardPaper | null>(null);
    const [activeTab, setActiveTab] = useState<'questions' | 'solutions'>('questions');
    
    const availableYears = useMemo(() => {
        return [...new Set(BOARD_PAPERS.map(p => p.year))].sort((a, b) => b - a);
    }, []);

    const availableSubjects = useMemo(() => {
        return ['all', ...new Set(BOARD_PAPERS.filter(p => p.grade === student.grade).map(p => p.subject))];
    }, [student.grade]);

    const filteredPapers = useMemo(() => {
        return BOARD_PAPERS.filter(p => 
            p.grade === student.grade &&
            p.year === selectedYear &&
            (selectedSubject === 'all' || p.subject === selectedSubject)
        );
    }, [student.grade, selectedYear, selectedSubject]);

    const handleSelectPaper = (paper: BoardPaper) => {
        setSelectedPaper(paper);
        setActiveTab('questions');
    };

    if (selectedPaper) {
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedPaper(null)} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    {t('back')}
                </button>
                <div className="dashboard-highlight-card p-8">
                    <h2 className="text-2xl font-bold text-text-primary">{selectedPaper.paperTitle}</h2>
                    <div className="mt-6 border-b border-border">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`whitespace-nowrap py-3 px-1 border-b-4 font-semibold text-sm ${activeTab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                {t('questionPaper')}
                            </button>
                             <button
                                onClick={() => setActiveTab('solutions')}
                                className={`whitespace-nowrap py-3 px-1 border-b-4 font-semibold text-sm ${activeTab === 'solutions' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                {t('solution')}
                            </button>
                        </nav>
                    </div>
                    <div className="mt-6 prose max-w-none dark:prose-invert">
                        {activeTab === 'questions' ? (
                            selectedPaper.questions.map((q, i) => <StructuredText key={i} text={q} />)
                        ) : (
                            selectedPaper.solutions.map((s, i) => <StructuredText key={i} text={s} />)
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center">
                    <AcademicCapIcon className="h-12 w-12 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('examPrepTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">
                        {t('examPrepDesc')}
                    </p>
                </div>

                <div className="my-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-4">
                    <div>
                        <label htmlFor="year-filter" className="block text-sm font-bold text-text-secondary mb-1">{t('filterByYear')}</label>
                        <select
                            id="year-filter"
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="min-w-[150px]"
                        >
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject-filter" className="block text-sm font-bold text-text-secondary mb-1">{t('filterBySubject')}</label>
                        <select
                            id="subject-filter"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="min-w-[200px]"
                        >
                            {availableSubjects.map(subject => <option key={subject} value={subject}>{subject === 'all' ? t('allSubjects') : tCurriculum(subject)}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredPapers.length > 0 ? (
                        filteredPapers.map((paper, index) => (
                            <div key={index} className="bg-surface p-4 rounded-lg border border-border flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-light rounded-lg">
                                        <DocumentTextIcon className="h-6 w-6 text-primary-dark"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">{paper.paperTitle}</p>
                                        <p className="text-sm text-text-secondary">{tCurriculum(paper.subject)} - {paper.year}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleSelectPaper(paper)} className="btn-accent px-4 py-2 text-sm">
                                    {t('viewPaper')}
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary py-8">{t('noPapersFound')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamPrepScreen;
