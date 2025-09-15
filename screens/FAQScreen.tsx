import React, { useState } from 'react';
import { useLanguage } from '../contexts/Language-context';
import { ArrowLeftIcon, ChevronDownIcon, UserIcon, AcademicCapIcon, HeartIcon } from '@heroicons/react/24/solid';
import { FAQS } from '../data/faq';
import { FAQSection } from '../types';

interface FAQScreenProps {
  onBack: () => void;
}

type Role = 'student' | 'teacher' | 'parent';

const AccordionItem: React.FC<{ question: string; answer: string; }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-4 px-2"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">{question}</span>
        <ChevronDownIcon className={`h-6 w-6 text-slate-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="p-4 pt-0 text-slate-600 dark:text-slate-300 prose prose-lg max-w-none">
            <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQScreen: React.FC<FAQScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState<Role>('student');

  const roleConfig: { [key in Role]: { icon: React.ElementType, title: string, data: FAQSection } } = {
    student: { icon: UserIcon, title: t('faqStudentTitle'), data: FAQS.find(f => f.role === 'student')! },
    teacher: { icon: AcademicCapIcon, title: t('faqTeacherTitle'), data: FAQS.find(f => f.role === 'teacher')! },
    parent: { icon: HeartIcon, title: t('faqParentTitle'), data: FAQS.find(f => f.role === 'parent')! },
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{ color: 'rgb(var(--c-primary))' }}>
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <header className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mt-3">{t('faqTitle')}</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">{t('faqSubtitle')}</p>
        </header>

        <div className="mb-6">
          <div className="flex justify-center border-b border-slate-200 dark:border-slate-700" role="tablist">
            {Object.entries(roleConfig).map(([role, config]) => (
              <button
                key={role}
                onClick={() => setActiveRole(role as Role)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold -mb-px border-b-2 transition-colors ${
                  activeRole === role
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary'
                }`}
                role="tab"
                aria-selected={activeRole === role}
                style={{borderColor: activeRole === role ? 'rgb(var(--c-primary))' : 'transparent', color: activeRole === role ? 'rgb(var(--c-primary))' : ''}}
              >
                <config.icon className="h-5 w-5" />
                {config.title}
              </button>
            ))}
          </div>
        </div>
        
        <div role="tabpanel">
            {roleConfig[activeRole].data.items.map((item) => (
                <AccordionItem 
                    key={item.questionKey} 
                    question={t(item.questionKey)} 
                    answer={t(item.answerKey)} 
                />
            ))}
        </div>

      </div>
    </div>
  );
};

export default FAQScreen;
