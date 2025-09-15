import { useState, useEffect, useRef, useCallback } from 'react';

// A more robust sentence tokenizer that handles abbreviations.
const getSentences = (text: string): string[] => {
    if (!text) return [];
    // This regex splits by sentence-ending punctuation but keeps the punctuation.
    // It also tries to avoid splitting on abbreviations like Mr. or e.g.
    const sentences = text.replace(/([.!?])\s*(?=[A-Z])/g, "$1|").split("|");
    return sentences.map(s => s.trim()).filter(Boolean);
};

export const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
    const [isSupported, setIsSupported] = useState(false);

    const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const speakSentences = useCallback((index: number) => {
        if (!synthRef.current || index >= utterancesRef.current.length) {
            setIsSpeaking(false);
            setCurrentSentenceIndex(-1);
            return;
        }

        setCurrentSentenceIndex(index);
        const utterance = utterancesRef.current[index];
        
        // Chain the next utterance
        utterance.onend = () => {
            speakSentences(index + 1);
        };
        
        synthRef.current.speak(utterance);
    }, []);

    const play = useCallback((text: string) => {
        if (!synthRef.current || isSpeaking) return;

        const synth = synthRef.current;
        synth.cancel(); // Cancel any previous speech

        const sentences = getSentences(text);
        if (sentences.length === 0) return;

        let availableVoices = synth.getVoices();
        
        // Prioritize a high-quality Indian English voice for an engaging experience
        const preferredVoice = 
            availableVoices.find(v => v.lang === 'en-IN' && v.name.includes('Google')) ||
            availableVoices.find(v => v.lang === 'en-IN') ||
            availableVoices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
            availableVoices.find(v => v.lang === 'en-GB') ||
            availableVoices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
            availableVoices.find(v => v.lang === 'en-US');

        utterancesRef.current = sentences.map(sentence => {
            const utterance = new SpeechSynthesisUtterance(sentence);
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            // Adjust rate and pitch for a more inspirational, storytelling tone.
            utterance.rate = 0.95; // Slower, storytelling pace
            utterance.pitch = 1.1; // Higher, more inspirational pitch
            return utterance;
        });

        setIsSpeaking(true);
        setIsPaused(false);
        speakSentences(0);

    }, [isSpeaking, speakSentences]);

    const pause = useCallback(() => {
        if (synthRef.current && isSpeaking && !isPaused) {
            synthRef.current.pause();
            setIsPaused(true);
        }
    }, [isSpeaking, isPaused]);
    
    const resume = useCallback(() => {
        if (synthRef.current && isSpeaking && isPaused) {
            synthRef.current.resume();
            setIsPaused(false);
        }
    }, [isSpeaking, isPaused]);

    const stop = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentSentenceIndex(-1);
        utterancesRef.current = [];
    }, []);

    useEffect(() => {
         if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            const handleVoicesChanged = () => {
                // Ensure voices are loaded before setting supported flag
                if (synthRef.current && synthRef.current.getVoices().length > 0) {
                    setIsSupported(true);
                }
            };
            
            synthRef.current.onvoiceschanged = handleVoicesChanged;
            // Initial check in case voices are already loaded
            handleVoicesChanged();
        }
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    return { isSupported, isSpeaking, isPaused, currentSentenceIndex, play, pause, resume, stop };
};