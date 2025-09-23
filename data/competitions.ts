import { Competition, HallOfFameEntry } from '../types';

export const MOCK_COMPETITIONS: Competition[] = [
    {
        id: 'comp-math-10-olympiad',
        title: 'National Maths Olympiad Qualifier',
        subject: 'Mathematics',
        grade: 'Grade 10',
        description: 'Test your problem-solving skills against the best in the country. Top 100 performers will be invited to the final round.',
        prize: 'Entry to National Olympiad + Merit Certificate',
        status: 'Ongoing'
    },
    {
        id: 'comp-sci-9-hackathon',
        title: 'Junior Innovator Hackathon',
        subject: 'Science',
        grade: 'Grade 9',
        description: 'Build a project that solves a real-world problem using scientific principles. Submit your idea and a prototype.',
        prize: '₹10,000 Scholarship + Mentorship',
        status: 'Upcoming'
    },
    {
        id: 'comp-hist-8-quiz',
        title: 'Inter-School History Quiz',
        subject: 'History',
        grade: 'Grade 8',
        description: 'A quiz competition covering the Indian freedom struggle and world history. Form a team of 3 from your school.',
        prize: 'Trophy for School + Book Vouchers',
        status: 'Completed'
    }
];

export const HALL_OF_FAME: HallOfFameEntry[] = [
    {
        studentName: 'Aarav Gupta',
        achievement: 'Winner, National Science Fair 2023',
        year: 2023,
        avatarUrl: 'https://i.pravatar.cc/150?u=aarav'
    },
    {
        studentName: 'Sneha Reddy',
        achievement: 'Top Rank, National Cyber Olympiad 2023',
        year: 2023,
        avatarUrl: 'https://i.pravatar.cc/150?u=sneha'
    },
    {
        studentName: 'Vikram Singh',
        achievement: 'Winner, National Maths Olympiad 2022',
        year: 2022,
        avatarUrl: 'https://i.pravatar.cc/150?u=vikram'
    }
];