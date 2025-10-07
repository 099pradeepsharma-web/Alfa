import React, { useState } from 'react';
import { Grade, Subject, Chapter, NextStepRecommendation } from '../types';
import { ArrowLeftIcon, ChevronDownIcon, DocumentChartBarIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
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
  const [testingChapter, setTestingChapter] = useState<Chapter | null>(null);
  const { t, tCurriculum, language } = useLanguage();

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
          {/* Subjects "Realms" Column */}
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
                    className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 realm-card ${
                      selectedSubject?.name === subject.name
                        ? 'bg-surface text-primary font-semibold border-primary'
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

          {/* Chapters "Missions" Column */}
          <div className="lg:col-span-2">
            {selectedSubject && onChapterSelect ? (
              <div className="bg-bg-primary p-6 rounded-xl shadow-inner animate-fade-in">
                <div className="border-b border-border-color pb-3 mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                  <p className="text-text-secondary text-sm">Select a mission to begin your learning journey.</p>
                </div>
                <ul className="space-y-4 mt-4">
                  {selectedSubject.chapters.map((chapter) => (
                    <li key={chapter.title} className="mission-card">
                        <div className="mission-card-header">
                            <h4 className="font-bold text-lg text-text-primary">Mission: {tCurriculum(chapter.title)}</h4>
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
                        <div className="p-4">
                            <p className="text-sm text-text-secondary mb-4">Ready to master this topic? Start the mission to begin your step-by-step learning journey.</p>
                            <button
                                onClick={() => setTestingChapter(chapter)}
                                className="w-full flex items-center justify-center py-2 px-4 btn-accent"
                            >
                                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                                Start Mission
                            </button>
                        </div>
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