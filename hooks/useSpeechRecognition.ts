import { useState, useEffect, useRef, useCallback } from 'react';

// This is a browser-only feature. The API may be prefixed.
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface SpeechRecognitionOptions {
    onEnd?: (transcript: string) => void;
}

export const useSpeechRecognition = (options?: SpeechRecognitionOptions) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any | null>(null);
    const finalTranscriptRef = useRef('');

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false; // This is key: stop when user pauses.
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            // Show the user what's being heard in real-time
            setTranscript(finalTranscriptRef.current + interim);
            // Accumulate the final transcript
            if (final) {
                finalTranscriptRef.current += final;
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            if (options?.onEnd && finalTranscriptRef.current.trim()) {
                options.onEnd(finalTranscriptRef.current.trim());
            }
            // Don't clear transcript here, let the calling component handle it
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current.onend = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
            }
        };

    }, [options]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            finalTranscriptRef.current = '';
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            // onEnd will fire automatically, handling isListening state and callback.
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported: !!SpeechRecognition,
    };
};