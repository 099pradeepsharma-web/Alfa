import { PeerExplanation } from '../types';

export const MOCK_PEER_EXPLANATIONS: PeerExplanation[] = [
    {
        id: 'peer-math-10-1',
        studentId: '3',
        studentName: 'Priya Singh',
        studentAvatarUrl: `https://i.pravatar.cc/150?u=priya`,
        subject: 'Mathematics',
        chapter: 'Real Numbers',
        concept: 'Euclid\'s Division Lemma',
        explanationText: 'Think of Euclid\'s Division Lemma like sharing sweets. If you have a total number of sweets (dividend, a) and you want to share them among your friends (divisor, b), the lemma says you can always find out how many sweets each friend gets (quotient, q) and how many are left over for you (remainder, r). The leftover sweets (r) will always be less than the number of friends (b) you are sharing with. So, a = bq + r is just a fancy way of saying Total Sweets = (Sweets per Friend * Number of Friends) + Leftover Sweets!',
        submittedDate: '2024-05-27'
    },
    {
        id: 'peer-sci-10-1',
        studentId: '1',
        studentName: 'Ananya Sharma',
        studentAvatarUrl: `https://i.pravatar.cc/150?u=ananya`,
        subject: 'Science',
        chapter: 'Chemical Reactions and Equations',
        concept: 'Balancing Chemical Equations',
        explanationText: 'Balancing equations is like being a good host at a party. The number of atoms of each element you have on the "guest" side (reactants) must be exactly the same as the number of atoms you have on the "party" side (products). You can\'t create or destroy atoms, just rearrange them! So you use coefficients (the big numbers in front) to make sure everyone who came to the party is accounted for at the end.',
        submittedDate: '2024-05-26'
    },
    {
        id: 'peer-hist-10-1',
        studentId: '2',
        studentName: 'Rohan Verma',
        studentAvatarUrl: `https://i.pravatar.cc/150?u=rohan`,
        subject: 'History',
        chapter: 'The Rise of Nationalism in Europe',
        concept: 'Meaning of Liberalism',
        explanationText: 'For the new middle classes in 19th century Europe, liberalism meant two main things: 1) Freedom for the individual and equality before the law. They wanted to get rid of the special privileges of the aristocracy. 2) In economics, it meant freedom of markets. They wanted to remove state-imposed restrictions on the movement of goods and capital, like different currencies, weights, and measures in every small state, which made trade very difficult.',
        submittedDate: '2024-05-25'
    }
];