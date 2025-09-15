import { FAQSection } from '../types';

export const FAQS: FAQSection[] = [
  {
    role: 'student',
    titleKey: 'faqStudentTitle',
    items: [
      {
        questionKey: 'faqStudentQ1',
        answerKey: 'faqStudentA1',
      },
      {
        questionKey: 'faqStudentQ2',
        answerKey: 'faqStudentA2',
      },
      {
        questionKey: 'faqStudentQ3',
        answerKey: 'faqStudentA3',
      },
    ],
  },
  {
    role: 'teacher',
    titleKey: 'faqTeacherTitle',
    items: [
      {
        questionKey: 'faqTeacherQ1',
        answerKey: 'faqTeacherA1',
      },
      {
        questionKey: 'faqTeacherQ2',
        answerKey: 'faqTeacherA2',
      },
      {
        questionKey: 'faqTeacherQ3',
        answerKey: 'faqTeacherA3',
      },
    ],
  },
  {
    role: 'parent',
    titleKey: 'faqParentTitle',
    items: [
      {
        questionKey: 'faqParentQ1',
        answerKey: 'faqParentA1',
      },
      {
        questionKey: 'faqParentQ2',
        answerKey: 'faqParentA2',
      },
    ],
  },
];
