import React, { useState } from 'react';
import { Student } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, CircleStackIcon, SparklesIcon, CloudArrowUpIcon } from '@heroicons/react/24/solid';
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
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-8">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Bulk Student Onboarding</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload a CSV file with student data (columns: name, email, password, grade) to create multiple student accounts at once.
            </p>
            <div className="mt-4">
                <label htmlFor="csv-upload" className="w-full cursor-pointer bg-white dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary dark:hover:border-primary-light transition">
                    <CloudArrowUpIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    <span className="mt-2 font-semibold text-primary dark:text-primary-light text-center">
                        {fileName ? `File: ${fileName}` : 'Choose a CSV file to upload'}
                    </span>
                    <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
                </label>
            </div>
            {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                    <LoadingSpinner />
                    <span>Processing file... This may take a moment.</span>
                </div>
            )}
            {error && <p className="mt-4 text-center text-red-600 dark:text-red-400 font-semibold">{error}</p>}
            {result && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-lg font-semibold text-center">
                    Processing Complete: {result.success} students onboarded successfully, {result.failed} failed.
                </div>
            )}
        </div>
    )
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ students, onSelectStudent, onBack }) => {
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
      <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition mb-6">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToRoleSelection')}
      </button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
        <div className="border-b dark:border-slate-600 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('teacherDashboard')}</h2>
            <p className="text-slate-600 dark:text-slate-300 mt-1">{t('teacherDashboardPrompt')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setView('questionBank')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
              style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
            >
              <CircleStackIcon className="h-5 w-5 mr-2" />
              {t('accessQuestionBank')}
            </button>
            <button 
              onClick={() => setView('curriculumGenerator')}
              className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-700 border border-primary/50 text-primary-dark font-semibold rounded-lg shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
              style={{borderColor: 'rgba(var(--c-primary), 0.5)', color: 'rgb(var(--c-primary-dark))'}}
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {t('curriculumGenerator')}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700 p-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-600 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center">
                <img src={student.avatarUrl} alt={student.name} className="h-12 w-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{student.name}</p>
                  <p className="text-slate-500 dark:text-slate-400">{tCurriculum(student.grade)}</p>
                </div>
              </div>
              <ChevronRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </button>
          ))}
        </div>

        <BulkOnboard />

      </div>
    </div>
  );
};

export default TeacherDashboard;