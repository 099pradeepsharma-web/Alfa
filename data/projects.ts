import { Project } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'pbl-phy-10-1',
    title: 'Design a Solar-Powered Phone Charger',
    subject: 'Science',
    grade: 'Grade 10',
    problemStatement: 'Many rural areas in India face inconsistent electricity. Design and create a blueprint for a simple, cost-effective solar-powered phone charger that can be built using locally available materials.',
    objectives: [
      'Apply principles of electricity and solar energy from the chapter "Sources of Energy".',
      'Design a simple circuit for charging a device.',
      'Consider cost-effectiveness and material availability.',
      'Create a detailed blueprint and instruction manual.'
    ],
    guidingQuestions: [
      'What components are essential for a solar charger?',
      'How does a solar panel convert sunlight into electricity?',
      'What voltage and current are required to charge a standard smartphone?',
      'How can you make the design weatherproof and durable?'
    ],
    submissions: [
      {
        studentId: 1,
        studentName: 'Ananya Sharma',
        studentAvatarUrl: `https://i.pravatar.cc/150?u=ananya`,
        solutionText: 'My design uses a small 6V solar panel connected to a USB charging module with a voltage regulator. The casing is a repurposed plastic container, making it waterproof. I also added a small LED to indicate when it\'s charging.',
        submittedDate: '2024-05-28',
      }
    ]
  },
  {
    id: 'pbl-eco-9-1',
    title: 'Village Palampur: A Modern Analysis',
    subject: 'Economics',
    grade: 'Grade 9',
    problemStatement: 'The textbook describes the economy of the fictional village Palampur. Research and create a presentation on how a modern-day Indian village\'s economy might differ, considering technology, government schemes, and market access.',
    objectives: [
      'Analyze the factors of production in a modern village context.',
      'Research current government schemes for rural development.',
      'Evaluate the impact of technology (e.g., smartphones, internet) on a village economy.',
      'Present findings in a clear and compelling format.'
    ],
    guidingQuestions: [
      'What are the main production activities in Palampur vs. a real village today?',
      'How has access to credit (like MUDRA loans) changed for small farmers?',
      'What role do e-commerce and digital payments play in rural areas now?',
      'How does a non-farm activity sector look different today?'
    ],
    submissions: []
  },
  {
    id: 'pbl-hist-8-1',
    title: 'My Region\'s Freedom Struggle',
    subject: 'History',
    grade: 'Grade 8',
    problemStatement: 'The national freedom struggle had many local heroes and movements that aren\'t always in textbooks. Create a digital scrapbook or a short documentary about a lesser-known freedom fighter or event from your own state or region.',
    objectives: [
        'Conduct primary or secondary research on local history.',
        'Understand the regional contributions to the national movement.',
        'Synthesize information into a compelling narrative.',
        'Use digital tools to present historical information creatively.'
    ],
    guidingQuestions: [
        'Who were some notable figures from your region during the 1857 revolt or later movements?',
        'Were there any specific peasant or tribal revolts in your area?',
        'How did your city or town participate in movements like the Non-Cooperation or Quit India movement?',
        'What local monuments, statues, or place names are connected to the freedom struggle?'
    ],
    submissions: [
       {
        studentId: 2,
        studentName: 'Rohan Verma',
        studentAvatarUrl: `https://i.pravatar.cc/150?u=rohan`,
        solutionText: 'I created a short video documentary on Veer Kunwar Singh from Bihar and his role in the 1857 revolt. I used old maps and images to show his area of operations and explained how he united different communities against the British.',
        solutionUrl: 'https://example.com/video',
        submittedDate: '2024-05-29',
      }
    ]
  }
];
