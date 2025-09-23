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
        return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200';
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('overallRankings')}</h3>
            <div className="space-y-3">
                {leaderboardData.map(entry => (
                    <div key={entry.studentId} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${getRankColor(entry.rank)}`}>
                            {entry.rank}
                        </div>
                        <img src={entry.avatarUrl} alt={entry.name} className="w-12 h-12 rounded-full" />
                        <p className="font-bold text-slate-800 dark:text-slate-100 flex-grow">{entry.name}</p>
                        <div className="text-right">
                            <p className="font-bold text-lg text-primary" style={{color: 'rgb(var(--c-primary))'}}>{entry.points.toLocaleString()}</p>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('points')}</p>
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
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('liveCompetitions')}</h3>
            <div className="space-y-4">
                {MOCK_COMPETITIONS.map(comp => (
                    <div key={comp.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary-light" style={{backgroundColor: 'rgb(var(--c-primary-light))', color: 'rgb(var(--c-primary))'}}>{tCurriculum(comp.subject)} - {tCurriculum(comp.grade)}</span>
                                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-1">{comp.title}</h4>
                            </div>
                             <button className={`px-4 py-2 text-sm font-bold rounded-lg ${comp.status === 'Ongoing' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-default'}`}>
                                {comp.status === 'Ongoing' ? t('joinNow') : t(comp.status.toLowerCase())}
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{comp.description}</p>
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
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('pastAchievers')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {HALL_OF_FAME.map(entry => (
                    <div key={entry.studentName} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                        <img src={entry.avatarUrl} alt={entry.studentName} className="w-20 h-20 rounded-full mx-auto border-4 border-amber-400" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-3">{entry.studentName}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{entry.achievement}</p>
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
        { id: 'leaderboard', name: t('leaderboard'), icon: FireIcon },
        { id: 'competitions', name: t('liveCompetitions'), icon: AcademicCapIcon },
        { id: 'halloffame', name: t('hallOfFame'), icon: StarIcon }
    ];

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                    <TrophyIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{t('competitionHubTitle')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">{t('competitionHubDesc')}</p>
                </div>

                <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap
                            ${ activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                            style={{borderColor: activeTab === tab.id ? 'rgb(var(--c-primary))' : 'transparent', color: activeTab === tab.id ? 'rgb(var(--c-primary))' : ''}}
                        >
                            <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                            <span>{tab.name}</span>
                        </button>
                        ))}
                    </nav>
                </div>
                
                <div>
                    {activeTab === 'leaderboard' && <LeaderboardTab />}
                    {activeTab === 'competitions' && <CompetitionsTab />}
                    {activeTab === 'halloffame' && <HallOfFameTab />}
                </div>

            </div>
        </div>
    );
};

export default CompetitionScreen;