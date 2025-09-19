import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { getWellbeingModuleStatus, setWellbeingModuleStatus } from '../services/pineconeService';
import LoadingSpinner from '../components/LoadingSpinner';

interface ParentDashboardProps {
  child: Student;
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ child, onSelectStudent, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const [agreed, setAgreed] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
        setIsLoading(true);
        const status = await getWellbeingModuleStatus(child.id);
        setIsAssigned(status);
        setIsLoading(false);
    };
    checkStatus();
  }, [child.id]);

  const handleAssignModule = async () => {
    await setWellbeingModuleStatus(child.id, true);
    setIsAssigned(true);
  };

  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToRoleSelection')}
        </button>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-600 pb-4 mb-6">{t('parentDashboard')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{t('parentDashboardPrompt')}</p>
            <div className="space-y-4">
                <button
                onClick={() => onSelectStudent(child)}
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-600 hover:shadow-sm transition-all duration-200"
                >
                <div className="flex items-center">
                    <img src={child.avatarUrl} alt={child.name} className="h-12 w-12 rounded-full mr-4" />
                    <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{child.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{tCurriculum(child.grade)}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </button>
            </div>

            <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Special Module: Personal Growth & Well-being</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Assign the "The Great Transformation" module to help your child navigate their journey from teen to adult.
                </p>

                {isLoading ? (
                    <div className="mt-4 flex justify-center"><LoadingSpinner /></div>
                ) : isAssigned ? (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-5 w-5" />
                        Module has been assigned to {child.name}.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-start space-x-3">
                            <input
                                id="terms-agree"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
                                style={{color: 'rgb(var(--c-primary))'}}
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <label htmlFor="terms-agree" className="text-sm text-slate-600 dark:text-slate-300">
                                I have reviewed the module's objectives and agree to assign this sensitive but important content to my child. I understand it covers topics related to adolescent development.
                            </label>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleAssignModule}
                                disabled={!agreed}
                                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{backgroundColor: 'rgb(var(--c-primary))'}}
                            >
                                Assign to {child.name}
                            </button>
                        </div>
                    </>
                )}
            </div>

        </div>
    </div>
  );
};

export default ParentDashboard;