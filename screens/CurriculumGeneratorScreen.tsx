import React, { useState, useMemo } from 'react';
import { CurriculumOutlineChapter, Grade, Subject } from '../types';
import { generateCurriculumOutline, validateCurriculumOutline } from '../services/geminiService';
import { getCachedData, setCachedData } from '../services/cacheService';
import { CURRICULUM } from '../data/curriculum';
import { useLanguage } from '../contexts/Language-context';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, SparklesIcon, BookOpenIcon, CheckIcon, ArrowDownTrayIcon, DocumentCheckIcon } from '@heroicons/react/24/solid';

interface CurriculumGeneratorScreenProps {
  onBack: () => void;
}

const formatReport = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('HEADING: ')) {
            const headingText = line.substring('HEADING: '.length).replace(/:$/, '');
            return <h4 key={index} className="text-lg font-bold text-text-primary mt-4 mb-2">{headingText}</h4>;
        }
        if (line.match(/^\s*[-*]\s/)) {
            return <li key={index} className="ml-5 list-disc text-text-secondary mb-1">{line.replace(/^\s*[-*]\s/, '')}</li>;
        }
        if (line.trim()) {
            return <p key={index} className="text-text-secondary mb-2">{line}</p>;
        }
        return null;
    }).filter(Boolean);
};

const CurriculumGeneratorScreen: React.FC<CurriculumGeneratorScreenProps> = ({ onBack }) => {
    const { t, tCurriculum, language } = useLanguage();

    const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const [outline, setOutline] = useState<CurriculumOutlineChapter[] | null>(null);
    const [sqlScript, setSqlScript] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [validationReport, setValidationReport] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const availableGrades = useMemo(() => CURRICULUM.filter(g => parseInt(g.level.split(' ')[1]) >= 6), []);
    
    const escapeSql = (str: string) => str.replace(/'/g, "''");

    const generateSqlScript = (
        grade: Grade, 
        subject: Subject, 
        curriculumOutline: CurriculumOutlineChapter[]
    ): string => {
        let script = `-- Alfanumrik AI Curriculum Generator SQL Export\n`;
        script += `-- Grade: ${grade.level}\n`;
        script += `-- Subject: ${subject.name}\n`;
        script += `-- Generated on: ${new Date().toISOString()}\n\n`;

        script += `-- NOTE: This script populates grades, subjects, and chapters.\n\n`;

        const gradeId = Math.floor(Math.random() * 1000);
        const subjectId = Math.floor(Math.random() * 1000);
        
        script += `INSERT INTO grades (id, grade_level, description) VALUES (${gradeId}, '${escapeSql(grade.level)}', '${escapeSql(grade.description)}');\n`;
        script += `INSERT INTO subjects (id, name, grade_id) VALUES (${subjectId}, '${escapeSql(subject.name)}', ${gradeId});\n\n`;

        curriculumOutline.forEach((chapter, index) => {
            const chapterId = Math.floor(Math.random() * 10000);
            script += `INSERT INTO chapters (id, title, chapter_number, subject_id) VALUES (${chapterId}, '${escapeSql(chapter.chapterTitle)}', ${index + 1}, ${subjectId});\n`;
        });
        
        return script;
    };

    const handleGenerate = async () => {
        if (!selectedGrade || !selectedSubject) return;
        setIsLoading(true);
        setError(null);
        setOutline(null);
        setSqlScript(null);
        setValidationReport(null);
        
        const cacheKey = `curriculum-${selectedGrade.level}-${selectedSubject.name}-${language}`;
        const cachedOutline = getCachedData<CurriculumOutlineChapter[]>(cacheKey);

        if (cachedOutline) {
            setOutline(cachedOutline);
            const script = generateSqlScript(selectedGrade, selectedSubject, cachedOutline);
            setSqlScript(script);
            setIsLoading(false);
            return;
        }

        try {
            const results = await generateCurriculumOutline(selectedGrade.level, selectedSubject.name, language);
            if (results.length === 0) {
                setError(t('noOutlineGenerated'));
            } else {
                setOutline(results);
                setCachedData(cacheKey, results, 1440); // Cache for 24 hours
                const script = generateSqlScript(selectedGrade, selectedSubject, results);
                setSqlScript(script);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!outline || !selectedGrade || !selectedSubject) return;
        setIsValidating(true);
        setError(null);
        setValidationReport(null);

        try {
            const report = await validateCurriculumOutline(outline, selectedGrade.level, selectedSubject.name, language);
            setValidationReport(report);
        } catch (err: any) {
            setError(err.message || t('validationError'));
        } finally {
            setIsValidating(false);
        }
    };

    const handleDownloadSql = () => {
        if (!sqlScript || !selectedGrade || !selectedSubject) return;

        const blob = new Blob([sqlScript], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const gradeName = selectedGrade.level.replace(/\s+/g, '_');
        const subjectName = selectedSubject.name.replace(/\s+/g, '_');
        a.download = `alfanumrik_curriculum_${gradeName}_${subjectName}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-fade-in">
             <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center border-b border-border pb-6 mb-6">
                    <SparklesIcon className="h-12 w-12 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('curriculumGenerator')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('curriculumGeneratorPrompt')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <select
                        value={selectedGrade?.level || ''}
                        onChange={(e) => {
                            setSelectedGrade(availableGrades.find(g => g.level === e.target.value) || null);
                            setSelectedSubject(null);
                        }}
                        className="w-full"
                    >
                        <option value="" disabled>{t('selectGradePlaceholder')}</option>
                        {availableGrades.map(g => <option key={g.level} value={g.level}>{tCurriculum(g.level)}</option>)}
                    </select>

                    <select
                        value={selectedSubject?.name || ''}
                        disabled={!selectedGrade}
                        onChange={(e) => {
                            setSelectedSubject(selectedGrade?.subjects.find(s => s.name === e.target.value) || null);
                        }}
                        className="w-full disabled:opacity-50"
                    >
                        <option value="" disabled>{t('selectSubjectPrompt')}</option>
                        {selectedGrade?.subjects.map(s => <option key={s.name} value={s.name}>{tCurriculum(s.name)}</option>)}
                    </select>
                </div>
                
                <div className="text-center mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                     <button
                        onClick={handleGenerate}
                        disabled={!selectedSubject || isLoading}
                        className="flex items-center justify-center w-full sm:w-auto btn-accent"
                    >
                        {isLoading ? (
                            <><LoadingSpinner /><span className="ml-2">{t('generatingOutline')}</span></>
                        ) : (
                             <><SparklesIcon className="h-5 w-5 mr-2"/><span>{t('generateOutline')}</span></>
                        )}
                    </button>
                    {sqlScript && (
                        <button
                            onClick={handleDownloadSql}
                            disabled={isLoading}
                            className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md transition disabled:opacity-70"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            <span>{t('downloadAsSql')}</span>
                        </button>
                    )}
                    {outline && !isLoading && (
                        <button
                            onClick={handleValidate}
                            disabled={isValidating}
                            className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-md transition disabled:opacity-70"
                        >
                             {isValidating ? (
                                <><LoadingSpinner /><span className="ml-2">{t('validatingCurriculum')}</span></>
                            ) : (
                                <><DocumentCheckIcon className="h-5 w-5 mr-2" /><span>{t('validateCurriculum')}</span></>
                            )}
                        </button>
                    )}
                </div>
                
                {error && <p className="text-red-400 text-center font-semibold">{error}</p>}
                
                {outline && (
                    <div className="mt-8 pt-6 border-t border-border space-y-4 max-h-[800px] overflow-y-auto pr-2">
                        {outline.map((item, index) => (
                            <div key={index} className="bg-surface p-4 rounded-lg border border-border">
                                <h3 className="font-bold text-lg text-primary flex items-center mb-3">
                                    <BookOpenIcon className="h-5 w-5 mr-2" />
                                    {item.chapterTitle}
                                </h3>
                                <ul className="space-y-2">
                                    {item.learningObjectives.map((obj, i) => (
                                        <li key={i} className="flex items-start text-text-secondary">
                                            <CheckIcon className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-green-500" />
                                            <span>{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
                
                {isValidating && (
                    <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
                        <LoadingSpinner />
                        <p className="mt-2 text-primary font-semibold">{t('validatingCurriculum')}</p>
                    </div>
                )}

                {validationReport && (
                    <div className="mt-8 pt-6 border-t-2 border-dashed border-border">
                         <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-text-primary flex items-center justify-center">
                                <DocumentCheckIcon className="h-7 w-7 mr-2 text-primary"/>
                                {t('qualityReportTitle')}
                            </h3>
                        </div>
                        <div className="p-4 bg-surface border border-border rounded-lg">
                           {formatReport(validationReport)}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CurriculumGeneratorScreen;