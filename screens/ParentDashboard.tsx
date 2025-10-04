import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CheckCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { getWellbeingModuleStatus, setWellbeingModuleStatus } from '../services/pineconeService';
import LoadingSpinner from '../components/LoadingSpinner';

interface ParentDashboardProps {
  child: Student;
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = React.memo(({ child, onSelectStudent, onBack }) => {
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
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToRoleSelection')}
        </button>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-6">{t('parentDashboard')}</h2>
            <p className="text-slate-600 mb-6">{t('parentDashboardPrompt')}</p>
            <div className="space-y-4">
                <button
                onClick={() => onSelectStudent(child)}
                className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all duration-200"
                >
                <div className="flex items-center">
                    <img src={child.avatarUrl} alt={child.name} className="h-12 w-12 rounded-full mr-4" />
                    <div>
                    <p className="font-bold text-slate-800 text-lg">{child.name}</p>
                    <p className="text-slate-500">{tCurriculum(child.grade)}</p>
                    </div>
                </div>
                <ChevronRightIcon className="h-6 w-6 text-slate-400" />
                </button>
            </div>

            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/50 rounded-full">
                        <CheckBadgeIcon className="h-8 w-8 text-slate-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{t('curriculumAlignmentTitle')}</h3>
                        <p className="text-slate-600 mt-1">{t('curriculumAlignmentDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-700">Special Module: Personal Growth & Well-being</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Assign the "The Great Transformation" module to help your child navigate their journey from teen to adult.
                </p>

                {isLoading ? (
                    <div className="mt-4 flex justify-center"><LoadingSpinner /></div>
                ) : isAssigned ? (
                    <div className="mt-4 p-3 bg-slate-100 text-slate-800 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-5 w-5" />
                        Module has been assigned to {child.name}.
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-start space-x-3">
                            <input
                                id="terms-agree"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-slate-600 focus:ring-slate-500 mt-0.5"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <label htmlFor="terms-agree" className="text-sm text-slate-600">
                                I have reviewed the module's objectives and agree to assign this sensitive but important content to my child. I understand it covers topics related to adolescent development.
                            </label>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleAssignModule}
                                disabled={!agreed}
                                className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
});

export default ParentDashboard;