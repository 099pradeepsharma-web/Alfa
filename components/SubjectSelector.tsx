import React, { useState } from 'react';
import { Grade, Subject, Chapter } from '../types';
import { ArrowLeftIcon, ChevronRightIcon, DocumentChartBarIcon } from '@heroicons/react/24/solid';
import DiagnosticTest from './DiagnosticTest';
import { useLanguage } from '../contexts/Language-context';
import { getIcon } from './IconMap';

interface SubjectSelectorProps {
  grade: Grade;
  selectedSubject?: Subject | null;
  onSubjectSelect: (subject: Subject) => void;
  onChapterSelect?: (chapter: Chapter) => void;
  onBack: () => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ grade, selectedSubject, onSubjectSelect, onChapterSelect, onBack }) => {
  const [showDiagnosticTest, setShowDiagnosticTest] = useState(false);
  const { t, tCurriculum, language } = useLanguage();

  if (showDiagnosticTest && selectedSubject) {
    return <DiagnosticTest language={language} grade={grade} subject={selectedSubject} onBack={() => setShowDiagnosticTest(false)} />;
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition" style={{color: 'rgb(var(--c-primary))', textDecorationColor: 'rgb(var(--c-primary-dark))'}}>
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToGrades')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mb-6">
          {tCurriculum(grade.level)}: <span className="text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}>{selectedSubject ? tCurriculum(selectedSubject.name) : t('chooseSubject')}</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects Column */}
          <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-3 mb-4">{t('subjects')}</h3>
            <ul className="space-y-2">
              {grade.subjects.map((subject) => {
                const Icon = getIcon(subject.icon);
                return (
                <li key={subject.name}>
                  <button
                    onClick={() => onSubjectSelect(subject)}
                    aria-current={selectedSubject?.name === subject.name}
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${
                      selectedSubject?.name === subject.name
                        ? 'bg-primary-light text-primary-dark font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    style={{
                        backgroundColor: selectedSubject?.name === subject.name ? 'rgb(var(--c-primary-light))' : '',
                        color: selectedSubject?.name === subject.name ? 'rgb(var(--c-primary-dark))' : '',
                    }}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{tCurriculum(subject.name)}</span>
                  </button>
                </li>
              )})}
            </ul>
          </div>

          {/* Chapters Column */}
          <div className="lg:col-span-2">
            {selectedSubject && onChapterSelect ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl shadow-md animate-fade-in">
                <div className="border-b dark:border-slate-600 pb-3 mb-4">
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                  <div className="mt-4 bg-primary-light border border-primary/30 p-4 rounded-lg text-center" style={{backgroundColor: 'rgb(var(--c-primary-light))', borderColor: 'rgba(var(--c-primary), 0.3)'}}>
                    <p className="text-primary-dark font-semibold mb-2" style={{color: 'rgb(var(--c-primary-dark))'}}>{t('notSureStart')}</p>
                    <button 
                      onClick={() => setShowDiagnosticTest(true)}
                      className="flex items-center justify-center w-full sm:w-auto mx-auto px-4 py-2 bg-white dark:bg-slate-700 text-primary-dark dark:text-slate-200 font-semibold rounded-lg border border-primary/50 dark:border-slate-500 shadow-sm hover:bg-primary-light dark:hover:bg-slate-600 transition"
                      style={{color: 'rgb(var(--c-primary-dark))', borderColor: 'rgba(var(--c-primary), 0.5)'}}
                    >
                      <DocumentChartBarIcon className="h-5 w-5 mr-2" />
                      {t('findMyLevel')}
                    </button>
                  </div>
                </div>
                <ul className="space-y-3 mt-4">
                  {selectedSubject.chapters.map((chapter) => (
                    <li key={chapter.title}>
                      <button
                        onClick={() => onChapterSelect(chapter)}
                        className="group w-full text-left p-4 rounded-lg flex items-center justify-between transition-all duration-200 bg-slate-50 dark:bg-slate-700 hover:bg-primary-light hover:shadow-sm dark:hover:bg-slate-600 hover:border-primary border-2 border-transparent"
                      >
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{tCurriculum(chapter.title)}</span>
                        <ChevronRightIcon className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-hover:translate-x-1" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-700/50 rounded-xl p-8">
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t('selectSubjectPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubjectSelector);