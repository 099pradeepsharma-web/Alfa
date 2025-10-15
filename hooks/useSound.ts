


import { useCallback } from 'react';

type SoundName = 'click' | 'complete' | 'swoosh';

export const useSound = () => {
    /**
     * This function is intentionally left empty to disable UI sound effects
     * as per the user's request to remove the sound playing function.
     */
    const playSound = useCallback((soundName: SoundName) => {
        // UI sounds are disabled.
    }, []);

    return { playSound };
};