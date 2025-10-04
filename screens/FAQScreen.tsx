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
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-4 px-2"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-text-primary">{question}</span>
        <ChevronDownIcon className={`h-6 w-6 text-text-secondary transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="p-4 pt-0 text-text-secondary prose prose-lg max-w-none dark:prose-invert">
            <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQScreen: React.FC<FAQScreenProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState<Role>('student');

  const roleConfig: { [key in Role]: { icon: React.ElementType; title: string; data: FAQSection, animation: string; } } = {
    student: { icon: UserIcon, title: t('faqStudentTitle'), data: FAQS.find(f => f.role === 'student')!, animation: 'bounce-icon' },
    teacher: { icon: AcademicCapIcon, title: t('faqTeacherTitle'), data: FAQS.find(f => f.role === 'teacher')!, animation: 'bounce-icon' },
    parent: { icon: HeartIcon, title: t('faqParentTitle'), data: FAQS.find(f => f.role === 'parent')!, animation: 'bounce-icon' },
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        {t('backToHome')}
      </button>

      <div className="dashboard-highlight-card p-8">
        <header className="text-center border-b border-border pb-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-3">{t('faqTitle')}</h1>
          <p className="text-lg text-text-secondary mt-2">{t('faqSubtitle')}</p>
        </header>

        <div className="mb-6">
          <div className="tab-bar">
            <nav className="flex justify-center space-x-6" role="tablist">
                {Object.entries(roleConfig).map(([role, config]) => (
                <button
                    key={role}
                    onClick={() => setActiveRole(role as Role)}
                    className={`tab-button ${ activeRole === role ? 'active' : '' }`}
                    role="tab"
                    aria-selected={activeRole === role}
                >
                    <config.icon className={`h-5 w-5 mr-2 ${ activeRole === role ? `animate-${config.animation}` : '' }`} />
                    <span>{config.title}</span>
                </button>
                ))}
            </nav>
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