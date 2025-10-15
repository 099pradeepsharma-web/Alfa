

import React, { useState } from 'react';
// FIX: Added Student to imports to resolve type errors
import { Grade, Subject, Chapter, NextStepRecommendation, Student } from '../types';
import { ArrowLeftIcon, ChevronDownIcon, DocumentChartBarIcon, RocketLaunchIcon, BookOpenIcon } from '@heroicons/react/24/solid';
import DiagnosticTest from './DiagnosticTest';
import { useLanguage } from '../contexts/Language-context';
import { getIcon } from './IconMap';
import RemediationScreen from '../screens/RemediationScreen';
import { useAuth } from '../contexts/AuthContext';

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
  const [remediationInfo, setRemediationInfo] = useState<{ recommendation: NextStepRecommendation; chapter: Chapter } | null>(null);
  const { t, tCurriculum, language } = useLanguage();
  const { currentUser } = useAuth();

  const handleDiagnosticComplete = (recommendation: NextStepRecommendation) => {
    if (!testingChapter) return;
    
    if (recommendation.action === 'CONTINUE') {
        if(onChapterSelect) onChapterSelect(testingChapter);
    } else {
        setRemediationInfo({ recommendation, chapter: testingChapter });
    }
    setTestingChapter(null);
  };

  const handleProceedFromRemediation = () => {
    if (remediationInfo && onChapterSelect) {
        onChapterSelect(remediationInfo.chapter);
    }
    setRemediationInfo(null);
  };


  if (remediationInfo && selectedSubject && currentUser) {
    return (
        <RemediationScreen
            grade={grade}
            subject={selectedSubject}
            chapter={remediationInfo.chapter}
            recommendation={remediationInfo.recommendation}
            onProceed={handleProceedFromRemediation}
            onBack={() => setRemediationInfo(null)}
            student={currentUser as Student}
            language={language}
        />
    );
  }

  if (testingChapter && selectedSubject && onChapterSelect && currentUser) {
    return (
      <DiagnosticTest
        language={language}
        grade={grade}
        subject={selectedSubject}
        chapter={testingChapter}
        onBack={() => setTestingChapter(null)}
        onTestComplete={handleDiagnosticComplete}
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
            <h3 className="text-xl font-bold text-text-primary border-b border-border pb-3 mb-4">{t('subjects')}</h3>
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

          {/* Chapters Accordion Column */}
          <div className="lg:col-span-2">
            {selectedSubject && onChapterSelect ? (
              <div className="bg-bg-primary p-6 rounded-xl shadow-inner animate-fade-in">
                <div className="border-b border-border pb-3 mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{t('chaptersIn')} {tCurriculum(selectedSubject.name)}</h3>
                  <p className="text-text-secondary text-sm">Select a chapter to see its topics and start your mission.</p>
                </div>
                <div className="space-y-4 mt-4">
                  {selectedSubject.chapters.map((chapter, index) => (
                    <details key={chapter.title} className="chapter-accordion-item">
                        <summary>
                            <span className="chapter-title">Chapter {index + 1}: {tCurriculum(chapter.title)}</span>
                            <div className="flex items-center gap-2">
                                {chapter.tags && chapter.tags.map(tag => (
                                  <span key={tag} className="chapter-tag hidden sm:inline-block">{tag}</span>
                                ))}
                                <ChevronDownIcon className="h-6 w-6 text-text-secondary chapter-chevron" />
                            </div>
                        </summary>
                        <div className="chapter-accordion-content">
                            <ul className="topic-list">
                                {chapter.topics.map((topic, topicIndex) => (
                                    <li key={topic.title}>
                                        <p className="font-semibold text-text-primary">
                                            Topic {index + 1}.{topicIndex + 1}: {tCurriculum(topic.title)}
                                        </p>
                                        {topic.objective && (
                                            <p className="objective-item">
                                                <strong>Objective:</strong> {tCurriculum(topic.objective)}
                                            </p>
                                        )}
                                        {/* You can add another nested loop here for subTopics if needed */}
                                    </li>
                                ))}
                            </ul>
                             <div className="mt-6 pt-4 border-t border-border flex items-center gap-4">
                                <button
                                    onClick={() => setTestingChapter(chapter)}
                                    className="w-full flex items-center justify-center py-2 px-4 btn-accent"
                                >
                                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                                    Start Mission
                                </button>
                                <button
                                    onClick={() => onChapterSelect(chapter)}
                                    className="w-full flex items-center justify-center py-2 px-4 bg-surface text-text-primary font-semibold rounded-lg shadow-sm border border-border hover:bg-bg-primary transition"
                                >
                                    <BookOpenIcon className="h-5 w-5 mr-2" />
                                    {t('justStudy')}
                                </button>
                            </div>
                        </div>
                    </details>
                  ))}
                </div>
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