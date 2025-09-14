
import { Student } from '../types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: 1,
    name: 'Ananya Sharma',
    grade: 'Grade 10',
    avatarUrl: `https://i.pravatar.cc/150?u=ananya`,
    performance: [
      { subject: 'Mathematics', chapter: 'Real Numbers', score: 92, completedDate: '2024-05-20' },
      { subject: 'Mathematics', chapter: 'Polynomials', score: 85, completedDate: '2024-05-22' },
      { subject: 'Physics', chapter: 'Electricity', score: 68, completedDate: '2024-05-21' },
      { subject: 'Physics', chapter: 'Magnetic Effects of Electric Current', score: 75, completedDate: '2024-05-24' },
      { subject: 'Biology', chapter: 'Life Processes', score: 95, completedDate: '2024-05-19' },
    ],
  },
  {
    id: 2,
    name: 'Rohan Verma',
    grade: 'Grade 8',
    avatarUrl: `https://i.pravatar.cc/150?u=rohan`,
    performance: [
      { subject: 'Chemistry', chapter: 'Metals and Non-metals', score: 78, completedDate: '2024-05-23' },
      { subject: 'History', chapter: 'From Trade to Territory', score: 65, completedDate: '2024-05-22' },
      { subject: 'Mathematics', chapter: 'Linear Equations in One Variable', score: 95, completedDate: '2024-05-25' },
    ],
  },
  {
    id: 3,
    name: 'Priya Singh',
    grade: 'Grade 10',
    avatarUrl: `https://i.pravatar.cc/150?u=priya`,
    performance: [
      { subject: 'Geography', chapter: 'Resources and Development', score: 88, completedDate: '2024-05-20' },
      { subject: 'Chemistry', chapter: 'Carbon and its Compounds', score: 62, completedDate: '2024-05-24' },
    ],
  },
];