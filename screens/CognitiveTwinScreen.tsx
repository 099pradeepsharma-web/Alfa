import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, SparklesIcon, ArrowPathIcon, BeakerIcon } from '@heroicons/react/24/solid';
import { Student, CognitiveProfile } from '../types';
import * as geminiService from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BrainCircuit } from 'lucide-react';

interface CognitiveTwinScreenProps {
  student: Student;
  onBack: () => void;
  onStartCalibration: () => void;
}

const Gauge: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const rotation = (value / 100) * 180;
    return (
        <div className="text-center">
            <div className="cognitive-gauge mx-auto">
                <div className="cognitive-gauge-body">
                    <div className="cognitive-gauge-fill" style={{ '--rotation': `${rotation}deg` } as React.CSSProperties}></div>
                    <div className="cognitive-gauge-cover">
                        <span>{value}</span>
                    </div>
                </div>
            </div>
            <p className="font-bold text-text-primary mt-2">{label}</p>
        </div>
    );
};


const CognitiveTwinScreen: React.FC<CognitiveTwinScreenProps> = ({ student, onBack, onStartCalibration }) => {
    const { t, language } = useLanguage();
    const [profile, setProfile] = useState<CognitiveProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await geminiService.analyzeCognitiveProfile(student, language);
            setProfile(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [student, language]);

    const learningStyleData = [
        { subject: t('visual'), value: profile?.learningStyle.style === 'Visual' ? 90 : 40, fullMark: 100 },
        { subject: t('textual'), value: profile?.learningStyle.style === 'Textual' ? 90 : 40, fullMark: 100 },
        { subject: t('practical'), value: profile?.learningStyle.style === 'Practical' ? 90 : 60, fullMark: 100 },
        { subject: t('theoretical'), value: profile?.learningStyle.style === 'Theoretical' ? 90 : 60, fullMark: 100 },
    ];
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <LoadingSpinner />
                <p className="mt-4 text-text-secondary text-lg">{t('generatingCognitiveProfile')}</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-status-danger p-8 bg-status-danger rounded-lg">{error}</div>;
    }

    if (!profile) {
        return <div className="text-center text-text-secondary">Could not load cognitive profile.</div>;
    }

    const { cognitiveTraits, learningStyle, memoryMatrix } = profile;

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="dashboard-highlight-card p-8">
                <div className="text-center">
                    <BrainCircuit className="h-12 w-12 mx-auto text-primary" />
                    <h2 className="text-3xl font-bold text-text-primary mt-2">{t('cognitiveTwinTitle')}</h2>
                    <p className="text-text-secondary mt-1 max-w-2xl mx-auto">{t('cognitiveTwinSubtitle')}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-border cognitive-twin-grid">
                    {/* Column 1: Traits & Style */}
                    <div className="space-y-8">
                        {/* Cognitive Traits */}
                        <div className="bg-surface p-6 rounded-xl border border-border">
                            <h3 className="section-title !mb-6">{t('cognitiveTraits')}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Gauge label={t('attentionSpan')} value={cognitiveTraits.attentionSpan.value} />
                                    <p className="text-xs text-text-secondary text-center mt-2 italic">"{cognitiveTraits.attentionSpan.analysis}"</p>
                                </div>
                                <div>
                                    <Gauge label={t('confidence')} value={cognitiveTraits.confidence.value} />
                                     <p className="text-xs text-text-secondary text-center mt-2 italic">"{cognitiveTraits.confidence.analysis}"</p>
                                </div>
                                <div>
                                    <Gauge label={t('resilience')} value={cognitiveTraits.resilience.value} />
                                     <p className="text-xs text-text-secondary text-center mt-2 italic">"{cognitiveTraits.resilience.analysis}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Learning Style */}
                        <div className="bg-surface p-6 rounded-xl border border-border">
                             <h3 className="section-title !mb-6">{t('learningStyleProfile')}</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={learningStyleData}>
                                        <PolarGrid stroke="rgba(var(--c-border-color), 0.5)"/>
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--c-text-secondary))', fontSize: 12 }} />
                                        <Radar name="Profile" dataKey="value" stroke="rgb(var(--c-primary))" fill="rgb(var(--c-primary))" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-sm text-text-secondary text-center italic mt-4"><strong>{t('analysis')}:</strong> "{learningStyle.analysis}"</p>
                        </div>
                    </div>

                    {/* Column 2: Memory & Actions */}
                     <div className="space-y-6">
                        <div className="bg-surface p-6 rounded-xl border border-border h-full">
                            <h3 className="section-title !mb-6">{t('memoryMatrix')}</h3>
                            <p className="text-text-secondary text-sm mb-4">{t('conceptsToReinforce')}</p>
                            <div className="space-y-3">
                                {memoryMatrix.map(concept => (
                                    <div key={concept.concept} className="bg-bg-primary p-3 rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <div>
                                                <p className="font-bold text-text-primary">{concept.concept}</p>
                                                <p className="text-xs text-text-secondary">{concept.subject} - {t('lastRevised')}: {concept.lastRevised}</p>
                                            </div>
                                            <span className="font-mono font-bold text-lg text-primary">{concept.retentionStrength}%</span>
                                        </div>
                                        <div className="w-full bg-border rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${concept.retentionStrength}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <button onClick={onStartCalibration} className="w-full btn-accent flex items-center justify-center gap-2">
                                <BeakerIcon className="h-5 w-5" /> {t('runCalibration')}
                            </button>
                             <button onClick={fetchProfile} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface text-text-primary font-semibold rounded-lg shadow-sm border border-border hover:bg-bg-primary transition">
                                <ArrowPathIcon className="h-5 w-5" /> {t('refreshAnalysis')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CognitiveTwinScreen;