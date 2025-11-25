import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechRecognition, SpeechRecognitionEvent } from '../types';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  setTranscript: (text: string) => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const [confirmedText, setConfirmedText] = useState('');
  const [interimText, setInterimText] = useState('');

  const fullTranscript = confirmedText + interimText;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
     setError(null);
     const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognitionConstructor) {
        setError("Speech recognition is not supported in this browser.");
        return;
     }
     
     // Stop any existing recognition instance properly
     if (recognitionRef.current) {
         try {
             recognitionRef.current.abort();
         } catch(e) {
             // Ignore errors during cleanup
         }
     }
     
     const recognition = new SpeechRecognitionConstructor();
     recognition.continuous = true;
     recognition.interimResults = true;
     recognition.lang = 'en-US';
     
     recognition.onstart = () => setIsListening(true);
     
     recognition.onend = () => {
         setIsListening(false);
     };
     
     recognition.onerror = (event: Event) => {
         // Cast to any to access error property specific to SpeechRecognitionErrorEvent
         const errorType = (event as any).error;
         console.error("Speech recognition error:", errorType);
         setIsListening(false);
         
         if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
             setError("Microphone access denied or speech service unavailable.");
         } else if (errorType !== 'no-speech') {
             // 'no-speech' is common and usually doesn't need a user alert
             setError(`Error occurred: ${errorType}`);
         }
     };
     
     recognition.onresult = (event: SpeechRecognitionEvent) => {
        let newFinal = '';
        let newInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                newFinal += event.results[i][0].transcript + ' ';
            } else {
                newInterim += event.results[i][0].transcript;
            }
        }
        
        if (newFinal) {
            setConfirmedText(prev => prev + newFinal);
        }
        setInterimText(newInterim);
     };
     
     recognitionRef.current = recognition;
     recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Commit any remaining interim text to confirmed text
        setConfirmedText(prev => prev + interimText);
        setInterimText('');
    }
  }, [interimText]);

  const resetTranscript = useCallback(() => {
      setConfirmedText('');
      setInterimText('');
      if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch(e) {}
      }
      setIsListening(false);
  }, []);
  
  const setTranscript = useCallback((text: string) => {
      setConfirmedText(text);
      setInterimText('');
  }, []);

  return {
    isListening,
    transcript: fullTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    setTranscript
  };
};