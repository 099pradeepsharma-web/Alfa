import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, TrophyIcon, StarIcon, AcademicCapIcon, FireIcon } from '@heroicons/react/24/solid';
import { MOCK_STUDENTS } from '../data/mockData';
import { MOCK_COMPETITIONS, HALL_OF_FAME } from '../data/competitions';
import { LeaderboardEntry, Competition, HallOfFameEntry } from '../types';

interface CompetitionScreenProps {
  onBack: () => void;
}

const LeaderboardTab: React.FC = () => {
    const { t } = useLanguage();
    const leaderboardData = useMemo((): LeaderboardEntry[] => {
        return MOCK_STUDENTS
            .map(student => ({
                studentId: student.id,
                name: student.name,
                avatarUrl: student.avatarUrl,
                points: student.points,
                rank: 0 // placeholder
            }))
            .sort((a, b) => b.points - a.points)
            .map((student, index) => ({ ...student, rank: index + 1 }));
    }, []);

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-amber-400 text-amber-900';
        if (rank === 2) return 'bg-slate-300 text-slate-800';
        if (rank === 3) return 'bg-amber-600 text-white';
        return 'bg-surface text-text-secondary';
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-text-primary mb-4">{t('overallRankings')}</h3>
            <div className="space-y-3">
                {leaderboardData.map(entry => (
                    <div key={entry.studentId} className="bg-bg-primary p-3 rounded-lg flex items-center gap-4 border border-border">
                        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${getRankColor(entry.rank)}`}>
                            {entry.rank}
                        </div>
                        <img src={entry.avatarUrl} alt={entry.name} className="w-12 h-12 rounded-full" />
                        <p className="font-bold text-text-primary flex-grow">{entry.name}</p>
                        <div className="text-right">
                            <p className="font-bold text-lg text-primary" style={{color: 'rgb(var(--c-primary))'}}>{entry.points.toLocaleString()}</p>
                            <p className="text-xs font-semibold text-text-secondary">{t('points')}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompetitionsTab: React.FC = () => {
    const { t, tCurriculum } = useLanguage();
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-text-primary mb-4">{t('liveCompetitions')}</h3>
            <div className="space-y-4">
                {MOCK_COMPETITIONS.map(comp => (
                    <div key={comp.id} className="bg-bg-primary p-4 rounded-lg border border-border">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary-light" style={{backgroundColor: 'rgb(var(--c-primary-light))', color: 'rgb(var(--c-primary))'}}>{tCurriculum(comp.subject)} - {tCurriculum(comp.grade)}</span>
                                <h4 className="font-bold text-lg text-text-primary mt-1">{comp.title}</h4>
                            </div>
                             <button className={`px-4 py-2 text-sm font-bold rounded-lg ${comp.status === 'Ongoing' ? 'bg-green-500 text-white' : 'bg-surface text-text-secondary cursor-default'}`}>
                                {comp.status === 'Ongoing' ? t('joinNow') : t(comp.status.toLowerCase())}
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary mt-2">{comp.description}</p>
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center"><TrophyIcon className="h-4 w-4 mr-1.5"/>{t('prize')}: {comp.prize}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HallOfFameTab: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-text-primary mb-4">{t('pastAchievers')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {HALL_OF_FAME.map(entry => (
                    <div key={entry.studentName} className="bg-bg-primary p-4 rounded-lg border border-border text-center">
                        <img src={entry.avatarUrl} alt={entry.studentName} className="w-20 h-20 rounded-full mx-auto border-4 border-amber-400" />
                        <h4 className="font-bold text-text-primary mt-3">{entry.studentName}</h4>
                        <p className="text-sm text-text-secondary font-medium">{entry.achievement}</p>
                        <p className="text-xs font-bold text-amber-500 mt-1">{entry.year}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompetitionScreen: React.FC<CompetitionScreenProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'competitions' | 'halloffame'>('leaderboard');

    const tabs = [
        { id: 'leaderboard', name: t('leaderboard'), icon: FireIcon, animation: 'flicker-icon' },
        { id: 'competitions', name: t('liveCompetitions'), icon: AcademicCapIcon, animation: 'bounce-icon' },
        { id: 'halloffame', name: t('hallOfFame'), icon: StarIcon, animation: 'glow-icon' }
    ];

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center border-b border-border pb-6 mb-6">
                    <TrophyIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('competitionHubTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('competitionHubDesc')}</p>
                </div>

                <div className="tab-bar">
                    <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`tab-button ${ activeTab === tab.id ? 'active' : '' }`}
                        >
                            <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${ activeTab === tab.id ? `animate-${tab.animation}` : '' }`} />
                            <span>{tab.name}</span>
                        </button>
                        ))}
                    </nav>
                </div>
                
                <div className="mt-6">
                    {activeTab === 'leaderboard' && <LeaderboardTab />}
                    {activeTab === 'competitions' && <CompetitionsTab />}
                    {activeTab === 'halloffame' && <HallOfFameTab />}
                </div>

            </div>
        </div>
    );
};

export default CompetitionScreen;