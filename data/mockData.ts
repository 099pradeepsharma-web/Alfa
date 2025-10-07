import { Student, Teacher, Parent } from '../types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ananya Sharma',
    grade: 'Grade 10',
    avatarUrl: `https://i.pravatar.cc/150?u=ananya`,
    points: 1250,
    performance: [
      { subject: 'Mathematics', chapter: 'Real Numbers', score: 92, completedDate: '2024-05-20' },
      { subject: 'Mathematics', chapter: 'Polynomials', score: 85, completedDate: '2024-05-22' },
      { subject: 'Physics', chapter: 'Electricity', score: 68, completedDate: '2024-05-21' },
      { subject: 'Physics', chapter: 'Magnetic Effects of Electric Current', score: 75, completedDate: '2024-05-24' },
      { subject: 'Biology', chapter: 'Life Processes', score: 95, completedDate: '2024-05-19' },
    ],
    achievements: [],
    studyGoals: [],
  },
  {
    id: '2',
    name: 'Rohan Verma',
    grade: 'Grade 8',
    avatarUrl: `https://i.pravatar.cc/150?u=rohan`,
    points: 980,
    performance: [
      { subject: 'Chemistry', chapter: 'Metals and Non-metals', score: 78, completedDate: '2024-05-23' },
      { subject: 'History', chapter: 'From Trade to Territory', score: 65, completedDate: '2024-05-22' },
      { subject: 'Mathematics', chapter: 'Linear Equations in One Variable', score: 95, completedDate: '2024-05-25' },
    ],
    achievements: [],
    studyGoals: [],
  },
  {
    id: '3',
    name: 'Priya Singh',
    grade: 'Grade 10',
    avatarUrl: `https://i.pravatar.cc/150?u=priya`,
    points: 1100,
    performance: [
      { subject: 'Geography', chapter: 'Resources and Development', score: 88, completedDate: '2024-05-20' },
      { subject: 'Chemistry', chapter: 'Carbon and its Compounds', score: 62, completedDate: '2024-05-24' },
    ],
    achievements: [],
    studyGoals: [],
  },
];

export const MOCK_TEACHERS: (Teacher & { password?: string })[] = [
  {
    id: 'teacher-1',
    name: 'Mrs. Gita Kapoor',
    email: 'teacher@alfanumrik.com',
    password: 'password123',
    studentIds: ['1', '3'], // Ananya and Priya
  }
];

export const MOCK_PARENTS: (Parent & { password?: string })[] = [
  {
    id: 'parent-1',
    name: 'Mr. Raj Verma',
    email: 'parent@alfanumrik.com',
    password: 'password123',
    childIds: ['2'], // Rohan Verma
  }
];
