import React from 'react';
import { BookOpenIcon, BeakerIcon, CalculatorIcon, GlobeAltIcon, LanguageIcon, ComputerDesktopIcon, SparklesIcon, TrophyIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const iconMap: { [key: string]: React.ElementType } = {
    BookOpenIcon,
    BeakerIcon,
    CalculatorIcon,
    GlobeAltIcon,
    LanguageIcon,
    ComputerDesktopIcon,
    SparklesIcon,
    TrophyIcon,
    CpuChipIcon,
};

export const getIcon = (iconName: string): React.ElementType => {
    return iconMap[iconName] || BookOpenIcon; // Default to BookOpenIcon if not found
};
