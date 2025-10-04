import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, CubeIcon, LightBulbIcon, ChevronDownIcon, AcademicCapIcon, LinkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { MOCK_PROJECTS } from '../data/projects';
import { Project, ProjectSubmission } from '../types';

interface ProjectHubScreenProps {
  onBack: () => void;
}

const ProjectCard: React.FC<{
    project: Project;
    onSelect: () => void;
    isSelected: boolean;
    onPriorityChange: (priority: 'High' | 'Medium' | 'Low') => void;
}> = ({ project, onSelect, isSelected, onPriorityChange }) => {
    const { t, tCurriculum } = useLanguage();

    const priority = project.priority || 'Medium';
    const priorityClasses: Record<string, string> = {
        High: 'priority-high',
        Medium: 'priority-medium',
        Low: 'priority-low',
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 transition-all duration-300 ${isSelected ? 'border-primary shadow-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-sm text-primary" style={{color: 'rgb(var(--c-primary))'}}>{tCurriculum(project.subject)}</p>
                            <span className={`priority-tag ${priorityClasses[priority]}`}>{priority}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{project.title}</h3>
                    </div>
                     <div className="flex-shrink-0 ml-4 p-3 bg-primary-light rounded-full" style={{backgroundColor: 'rgb(var(--c-primary-light))'}}>
                        <CubeIcon className="h-7 w-7 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}} />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{project.problemStatement}</p>
                 <div className="flex justify-between items-center mt-4">
                    <button onClick={onSelect} className="text-sm font-bold text-primary hover:text-primary-dark flex items-center" style={{color: 'rgb(var(--c-primary))'}}>
                        {t('viewProject')}
                        <ChevronDownIcon className={`h-5 w-5 ml-1 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <select
                            value={priority}
                            onChange={(e) => onPriorityChange(e.target.value as 'High' | 'Medium' | 'Low')}
                            className="text-xs font-semibold appearance-none bg-bg-primary border border-border-color rounded-full py-1 pl-3 pr-7 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <ChevronDownIcon className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetailView: React.FC<{ project: Project, onNewSubmission: (submission: ProjectSubmission) => void }> = ({ project, onNewSubmission }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [solutionText, setSolutionText] = useState('');
    const [solutionUrl, setSolutionUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!solutionText.trim() || !currentUser) return;
        const newSubmission: ProjectSubmission = {
            studentId: currentUser.id,
            studentName: currentUser.name,
            studentAvatarUrl: currentUser.avatarUrl,
            solutionText: solutionText.trim(),
            solutionUrl: solutionUrl.trim() || undefined,
            submittedDate: new Date().toISOString()
        };
        onNewSubmission(newSubmission);
        setSolutionText('');
        setSolutionUrl('');
    };
    
    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 mt-[-8px] rounded-b-2xl border-x-2 border-b-2 border-primary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">{t('objectives')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        {project.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200 mt-6 mb-2">{t('guidingQuestions')}</h4>
                     <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        {project.guidingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">{t('submitYourProject')}</h4>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <textarea value={solutionText} onChange={e => setSolutionText(e.target.value)} required rows={4} placeholder={t('solutionDescription')} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-md focus:ring-1 focus:ring-primary"></textarea>
                        <input type="url" value={solutionUrl} onChange={e => setSolutionUrl(e.target.value)} placeholder={t('solutionLink')} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-md focus:ring-1 focus:ring-primary" />
                        <button type="submit" className="w-full flex items-center justify-center py-2 px-4 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary-dark transition"><PaperAirplaneIcon className="h-5 w-5 mr-2" /> {t('submitSolution')}</button>
                    </form>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-600">
                <h4 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-4">{t('showcase')}</h4>
                <div className="space-y-4">
                    {project.submissions.map(sub => (
                        <div key={sub.studentId} className="bg-white dark:bg-slate-700/50 p-4 rounded-lg shadow">
                            <div className="flex items-center mb-2">
                                <img src={sub.studentAvatarUrl} alt={sub.studentName} className="h-8 w-8 rounded-full mr-3" />
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{sub.studentName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(sub.submittedDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">{sub.solutionText}</p>
                            {sub.solutionUrl && <a href={sub.solutionUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-semibold mt-2 inline-flex items-center"><LinkIcon className="h-4 w-4 mr-1"/> View Work</a>}
                        </div>
                    ))}
                    {project.submissions.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm text-center italic">Be the first to submit a solution!</p>}
                </div>
            </div>
        </div>
    )
}

const ProjectHubScreen: React.FC<ProjectHubScreenProps> = ({ onBack }) => {
    const { t, tCurriculum } = useLanguage();
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<string>('all');
    const [sortByPriority, setSortByPriority] = useState<boolean>(false);

    const subjects = useMemo(() => ['all', ...Array.from(new Set(MOCK_PROJECTS.map(p => p.subject)))], []);
    
    const handlePriorityChange = (projectId: string, priority: 'High' | 'Medium' | 'Low') => {
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === projectId ? { ...p, priority } : p
            )
        );
    };

    const filteredProjects = useMemo(() => {
        let projectsToProcess = subjectFilter === 'all'
            ? [...projects]
            : projects.filter(p => p.subject === subjectFilter);
        
        if (sortByPriority) {
            const priorityOrder: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
            projectsToProcess.sort((a, b) => {
                const priorityA = priorityOrder[a.priority || 'Medium'];
                const priorityB = priorityOrder[b.priority || 'Medium'];
                return priorityA - priorityB;
            });
        }
        
        return projectsToProcess;
    }, [projects, subjectFilter, sortByPriority]);


    const handleNewSubmission = (projectId: string, submission: ProjectSubmission) => {
        setProjects(prevProjects => prevProjects.map(p => {
            if (p.id === projectId) {
                return { ...p, submissions: [submission, ...p.submissions] };
            }
            return p;
        }));
    };
    
    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('backToDashboard')}
            </button>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <LightBulbIcon className="h-12 w-12 mx-auto text-primary" style={{color: 'rgb(var(--c-primary))'}} />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{t('projectHubTitleScreen')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">{t('projectHubDescScreen')}</p>
                </div>

                <div className="my-6 flex flex-wrap items-center gap-4">
                    <label htmlFor="subject-filter" className="sr-only">{t('filterBySubject')}</label>
                    <select id="subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
                     className="w-full md:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-1 focus:ring-primary">
                        {subjects.map(s => <option key={s} value={s}>{s === 'all' ? t('allSubjects') : tCurriculum(s)}</option>)}
                    </select>

                    <button
                        onClick={() => setSortByPriority(prev => !prev)}
                        className={`px-4 py-2 border rounded-lg font-semibold text-sm transition ${sortByPriority 
                            ? 'bg-primary-light text-primary-dark border-primary' 
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`
                        }
                    >
                        Sort by Priority: {sortByPriority ? 'On' : 'Off'}
                    </button>
                </div>
                
                <div className="space-y-6">
                    {filteredProjects.map(project => (
                        <div key={project.id}>
                            <ProjectCard
                                project={project}
                                onSelect={() => setSelectedProject(prev => prev === project.id ? null : project.id)}
                                isSelected={selectedProject === project.id}
                                onPriorityChange={(newPriority) => handlePriorityChange(project.id, newPriority)}
                            />
                            {selectedProject === project.id && <ProjectDetailView project={project} onNewSubmission={(sub) => handleNewSubmission(project.id, sub)} />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectHubScreen;