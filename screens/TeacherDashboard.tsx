import React, { useState } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CircleStackIcon, SparklesIcon, CloudArrowUpIcon, CheckBadgeIcon, ChartPieIcon, WrenchScrewdriverIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import QuestionBankScreen from './QuestionBankScreen';
import CurriculumGeneratorScreen from './CurriculumGeneratorScreen';
import LoadingSpinner from '../components/LoadingSpinner';

interface TeacherDashboardProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onBack: () => void;
}

// New component for bulk onboarding to support production scaling
const BulkOnboard: React.FC = () => {
    const { t } = useLanguage();
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{success: number, failed: number} | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv') {
                setError("Invalid file type. Please upload a CSV file.");
                setFileName(null);
                setResult(null);
                return;
            }
            setError(null);
            setResult(null);
            setFileName(file.name);
            // In a real app, you'd parse the CSV and send it to a backend service.
            // For this demo, we'll just simulate the async process.
            setIsProcessing(true);
            setTimeout(() => {
                // Simulate a processing result
                setResult({ success: Math.floor(Math.random() * 20) + 10, failed: Math.floor(Math.random() * 3) });
                setIsProcessing(false);
            }, 2000);
        }
    };
    
    return (
        <div className="bg-bg-primary p-6 rounded-xl border border-border mt-8">
            <h3 className="text-xl font-bold text-text-primary">Bulk Student Onboarding</h3>
            <p className="text-sm text-text-secondary mt-1">
                Upload a CSV file with student data (columns: name, email, password, grade) to create multiple student accounts at once.
            </p>
            <div className="mt-4">
                <label htmlFor="csv-upload" className="w-full cursor-pointer bg-surface border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary transition">
                    <CloudArrowUpIcon className="h-10 w-10 text-text-secondary" />
                    <span className="mt-2 font-semibold text-text-primary text-center">
                        {fileName ? `File: ${fileName}` : 'Choose a CSV file to upload'}
                    </span>
                    <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                </label>
            </div>
            {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-text-secondary">
                    <LoadingSpinner />
                    <span>Processing file... This may take a moment.</span>
                </div>
            )}
            {error && <p className="mt-4 text-center text-status-danger font-semibold">{error}</p>}
            {result && (
                <div className="mt-4 p-3 bg-surface text-text-primary rounded-lg font-semibold text-center">
                    Processing Complete: {result.success} students onboarded successfully, {result.failed} failed.
                </div>
            )}
        </div>
    )
}

const ImplementationFramework: React.FC = () => {
    const { t } = useLanguage();

    const frameworkSteps = [
        {
            icon: ChartPieIcon,
            title: t('implementationStep1Title'),
            description: t('implementationStep1Desc'),
        },
        {
            icon: WrenchScrewdriverIcon,
            title: t('implementationStep2Title'),
            description: t('implementationStep2Desc'),
        },
        {
            icon: AcademicCapIcon,
            title: t('implementationStep3Title'),
            description: t('implementationStep3Desc'),
        },
    ];

    return (
        <div className="bg-bg-primary p-6 rounded-xl border border-border mt-8">
            <h3 className="text-xl font-bold text-text-primary">{t('implementationFrameworkTitle')}</h3>
            <p className="text-sm text-text-secondary mt-1">
                {t('implementationFrameworkDesc')}
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {frameworkSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-surface rounded-full">
                            <step.icon className="h-6 w-6 text-text-secondary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-primary">{step.title}</h4>
                            <p className="text-sm text-text-secondary mt-1">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const TeacherDashboard: React.FC<TeacherDashboardProps> = React.memo(({ students, onSelectStudent, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const [view, setView] = useState<'students' | 'questionBank' | 'curriculumGenerator'>('students');

  if (view === 'questionBank') {
    return <QuestionBankScreen onBack={() => setView('students')} />;
  }
  
  if (view === 'curriculumGenerator') {
    return <CurriculumGeneratorScreen onBack={() => setView('students')} />;
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToRoleSelection')}
      </button>
      <div className="dashboard-highlight-card p-8">
        <div className="border-b border-border pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">{t('teacherDashboard')}</h2>
            <p className="text-text-secondary mt-1">{t('teacherDashboardPrompt')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setView('questionBank')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-surface border border-border text-text-primary font-semibold rounded-lg shadow-sm hover:bg-bg-primary transition"
            >
              <CircleStackIcon className="h-5 w-5 mr-2" />
              {t('accessQuestionBank')}
            </button>
            <button 
              onClick={() => setView('curriculumGenerator')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-surface border border-border text-text-primary font-semibold rounded-lg shadow-sm hover:bg-bg-primary transition"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {t('curriculumGenerator')}
            </button>
          </div>
        </div>

        <div className="mb-6 bg-bg-primary p-6 rounded-xl border border-border">
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
        
        <div className="space-y-4">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="w-full flex items-center justify-between bg-surface p-4 rounded-lg hover:bg-bg-primary hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center">
                <img src={student.avatarUrl} alt={student.name} className="h-12 w-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-text-primary text-lg">{student.name}</p>
                  <p className="text-text-secondary">{tCurriculum(student.grade)}</p>
                </div>
              </div>
              <ChevronRightIcon className="h-6 w-6 text-text-secondary" />
            </button>
          ))}
        </div>
        
        <ImplementationFramework />

        <BulkOnboard />

      </div>
    </div>
  );
});

export default TeacherDashboard;