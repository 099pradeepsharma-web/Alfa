import React, { useState } from 'react';
import { Grade, Subject, Chapter, NextStepRecommendation } from '../types';
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
  onRecommendation: (recommendation: NextStepRecommendation) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({ grade, selectedSubject, onSubjectSelect, onChapterSelect, onBack, onRecommendation }) => {
  const [showDiagnosticTest, setShowDiagnosticTest] = useState(false);
  const [testingChapter, setTestingChapter] = useState<Chapter | null>(null);
  const { t, tCurriculum, language } = useLanguage();

  // FIX: Removed reference to undeclared variable 'chapter'.
  if (showDiagnosticTest && selectedSubject) {
    return <DiagnosticTest language={language} grade={grade} subject={selectedSubject} onBack={() => setShowDiagnosticTest(false)} />;
  }
  
  if (testingChapter && selectedSubject && onChapterSelect) {
    return (
      <DiagnosticTest
        language={language}
        grade={grade}
        subject={selectedSubject}
        chapter={testingChapter}
        onBack={() => setTestingChapter(null)}
        onTestComplete={(recommendation) => {
          onRecommendation(recommendation);
          setTestingChapter(null);
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {selectedSubject ? t('backToSubjects') : t('backToGrades')}
        </button>
      </div>

      <div className="dashboard-highlight-card p-8">
        <h2 className="text-3xl font-bold text-text-primary mb-8">
          {tCurriculum(grade.level)}: <span className="text-primary">{selectedSubject ? tCurriculum(selectedSubject.name) : t('chooseSubject')}</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects Column */}
          <div className="lg:col-span-1 bg-bg-primary p-6 rounded-xl shadow-inner">
            <h3 className="text-xl font-bold text-text-primary border-b border-border-color pb-3 mb-4">{t('subjects')}</h3>
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
                        ? 'bg-surface text-primary font-semibold'
                        : 'hover:bg-surface text-text-secondary'
                    }`}
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
              <div className="bg-bg-primary p-6 rounded-xl shadow-inner animate-fade-in">
                <div className="border-b border-border-color pb-3 mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                  <div className="mt-4 bg-surface border border-border-color p-4 rounded-lg text-center">
                    <p className="text-text-secondary font-semibold mb-2">{t('notSureStart')}</p>
                    <button 
                      onClick={() => setShowDiagnosticTest(true)}
                      className="flex items-center justify-center w-full sm:w-auto mx-auto px-4 py-2 bg-bg-primary text-text-primary font-semibold rounded-lg border border-border-color shadow-sm hover:bg-surface transition"
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
                          onClick={() => setTestingChapter(chapter)}
                          className="group w-full text-left p-4 rounded-lg flex items-center justify-between transition-all duration-200 bg-surface hover:bg-bg-primary hover:shadow-sm hover:border-primary border-2 border-transparent"
                        >
                          <div className="flex-grow mr-2">
                            <span className="text-text-primary font-medium">{tCurriculum(chapter.title)}</span>
                            {chapter.tags && chapter.tags.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {chapter.tags.map(tag => (
                                  <span key={tag} className={`chapter-tag`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-text-secondary transition-transform duration-200 group-hover:translate-x-1 flex-shrink-0" />
                        </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-surface rounded-xl p-8">
                <p className="text-text-secondary text-lg">{t('selectSubjectPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubjectSelector);