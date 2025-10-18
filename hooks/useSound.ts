import { useCallback } from 'react';

type SoundName = 'click' | 'complete' | 'swoosh';

// Preload audio files for better performance and to avoid delays.
const sounds: { [key in SoundName]: HTMLAudioElement } = {
    click: new Audio('https://cdn.aistudio.google.com/Llama_2_Finetuning_2/click.mp3'),
    complete: new Audio('https://cdn.aistudio.google.com/Llama_2_Finetuning_2/complete.mp3'),
    swoosh: new Audio('https://cdn.aistudio.google.com/Llama_2_Finetuning_2/swoosh.mp3'),
};

// Set volumes for a better audio mix
sounds.click.volume = 0.5;
sounds.complete.volume = 0.4;
sounds.swoosh.volume = 0.5;


export const useSound = () => {
    /**
     * Plays a preloaded sound effect.
     * This implementation is robust against browser autoplay policies.
     */
    const playSound = useCallback((soundName: SoundName) => {
        try {
            const sound = sounds[soundName];
            sound.currentTime = 0; // Rewind to the start to allow for rapid plays
            sound.play().catch(error => {
                // Autoplay was prevented by the browser. This is a common occurrence
                // and can be ignored silently as UI sounds are non-critical.
                console.warn(`UI sound play prevented for '${soundName}':`, error);
            });
        } catch (error) {
            console.error(`Error playing sound '${soundName}':`, error);
        }
    }, []);

    return { playSound };
};
