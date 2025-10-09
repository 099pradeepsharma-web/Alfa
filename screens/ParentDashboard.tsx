import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CheckCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { getWellbeingModuleStatus, setWellbeingModuleStatus, getLeadershipCircleStatus, setLeadershipCircleStatus } from '../services/pineconeService';
import LoadingSpinner from '../components/LoadingSpinner';

interface ParentDashboardProps {
  child: Student;
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = React.memo(({ child, onSelectStudent, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const [agreedWellbeing, setAgreedWellbeing] = useState(false);
  const [isWellbeingAssigned, setIsWellbeingAssigned] = useState(false);
  const [isLoadingWellbeing, setIsLoadingWellbeing] = useState(true);
  
  const [agreedLeadership, setAgreedLeadership] = useState(false);
  const [isLeadershipEnabled, setIsLeadershipEnabled] = useState(false);
  const [isLoadingLeadership, setIsLoadingLeadership] = useState(true);

  useEffect(() => {
    const checkStatuses = async () => {
        setIsLoadingWellbeing(true);
        setIsLoadingLeadership(true);

        const [wellbeingStatus, leadershipStatus] = await Promise.all([
            getWellbeingModuleStatus(child.id),
            getLeadershipCircleStatus(child.id)
        ]);
        
        setIsWellbeingAssigned(wellbeingStatus);
        setIsLeadershipEnabled(leadershipStatus);

        setIsLoadingWellbeing(false);
        setIsLoadingLeadership(false);
    };
    checkStatuses();
  }, [child.id]);

  const handleAssignModule = async () => {
    await setWellbeingModuleStatus(child.id, true);
    setIsWellbeingAssigned(true);
  };
  
  const handleEnableLeadership = async () => {
    await setLeadershipCircleStatus(child.id, true);
    setIsLeadershipEnabled(true);
  };

  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToRoleSelection')}
        </button>
        <div className="dashboard-highlight-card p-8">
            <h2 className="text-3xl font-bold text-text-primary border-b border-border pb-4 mb-6">{t('parentDashboard')}</h2>
            <p className="text-text-secondary mb-6">{t('parentDashboardPrompt')}</p>
            <div className="space-y-4">
                <button
                onClick={() => onSelectStudent(child)}
                className="w-full flex items-center justify-between bg-bg-primary p-4 rounded-lg hover:bg-surface hover:shadow-sm transition-all duration-200"
                >
                <div className="flex items-center">
                    <img src={child.avatarUrl} alt={child.name} className="h-12 w-12 rounded-full mr-4" />
                    <div>
                    <p className="font-bold text-text-primary text-lg">{child.name}</p>
                    <p className="text-text-secondary">{tCurriculum(child.grade)}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-text-secondary" />
                </button>
            </div>

            <div className="mt-8 bg-bg-primary p-6 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-surface rounded-full">
                        <CheckBadgeIcon className="h-8 w-8 text-text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">{t('curriculumAlignmentTitle')}</h3>
                        <p className="text-text-secondary mt-1">{t('curriculumAlignmentDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-bg-primary p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold text-text-primary">Special Module: Personal Growth & Well-being</h3>
                <p className="text-sm text-text-secondary mt-1">
                    Assign the "The Great Transformation" module to help your child navigate their journey from teen to adult.
                </p>

                {isLoadingWellbeing ? (
                    <div className="mt-4 flex justify-center"><LoadingSpinner /></div>
                ) : isWellbeingAssigned ? (
                    <div className="mt-4 p-3 bg-surface text-text-primary rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-status-success" />
                        Module has been assigned to {child.name}.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-start space-x-3">
                            <input
                                id="terms-agree"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                                checked={agreedWellbeing}
                                onChange={(e) => setAgreedWellbeing(e.target.checked)}
                            />
                            <label htmlFor="terms-agree" className="text-sm text-text-secondary">
                                I have reviewed the module's objectives and agree to assign this sensitive but important content to my child. I understand it covers topics related to adolescent development.
                            </label>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleAssignModule}
                                disabled={!agreedWellbeing}
                                className="px-4 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm hover:bg-bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Assign to {child.name}
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-8 bg-bg-primary p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold text-text-primary">Global Collaboration: Leadership Circle</h3>
                <p className="text-sm text-text-secondary mt-1">
                    Enable access for your child to participate in moderated, project-based collaborations with students from around the world. This feature helps develop communication, teamwork, and global awareness skills.
                </p>
                {isLoadingLeadership ? (
                    <div className="mt-4 flex justify-center"><LoadingSpinner /></div>
                ) : isLeadershipEnabled ? (
                    <div className="mt-4 p-3 bg-surface text-text-primary rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-status-success" />
                        Leadership Circle is enabled for {child.name}.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-start space-x-3">
                            <input
                                id="leadership-agree"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                                checked={agreedLeadership}
                                onChange={(e) => setAgreedLeadership(e.target.checked)}
                            />
                            <label htmlFor="leadership-agree" className="text-sm text-text-secondary">
                                I understand that the Leadership Circle involves moderated communication with students from other countries, and I consent to my child's participation.
                            </label>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleEnableLeadership}
                                disabled={!agreedLeadership}
                                className="px-4 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm hover:bg-bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enable Access for {child.name}
                            </button>
                        </div>
                    </>
                )}
            </div>

        </div>
    </div>
  );
});