import { Achievement } from '../types';

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'timestamp'>[] = [
    {
        id: 'chapter-champion',
        name: 'achievement_chapter_champion_name',
        description: 'achievement_chapter_champion_desc',
        icon: 'TrophyIcon' // Heroicon name
    }
];