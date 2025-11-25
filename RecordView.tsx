import React, { useEffect, useRef, useMemo } from 'react';
import { Mic, MicOff, AlertCircle, AlignLeft, Keyboard } from 'lucide-react';

interface RecordViewProps {
  isListening: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
  error: string | null;
  title: string;
  setTitle: (title: string) => void;
  setTranscript: (text: string) => void;
}

export const RecordView: React.FC<RecordViewProps> = ({
  isListening,
  transcript,
  onStart,
  onStop,
  error,
  title,
  setTitle,
  setTranscript
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom as transcript grows, but only if we are listening and near bottom
  useEffect(() => {
    if (isListening && textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [transcript, isListening]);

  // Calculate word count
  const wordCount = useMemo(() => {
    return transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [transcript]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Visualizer / Status Area */}
      <div className="flex-none mb-6 text-center">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter Title..."
          className="text-3xl font-serif text-ink mb-1 bg-transparent text-center w-full focus:outline-none placeholder-stone-300 focus:placeholder-stone-200"
        />
        <div className="flex items-center justify-center gap-2 text-stone-500 mb-6 text-sm uppercase tracking-wide">
          <span>Dictation & Writing Mode</span>
          <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
          <span className="flex items-center gap-1 text-accent font-bold">
            <AlignLeft size={14} /> {wordCount} words
          </span>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={isListening ? onStop : onStart}
            className={`
              relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-xl
              ${isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-accent hover:bg-amber-700 text-white shadow-amber-200'
              }
            `}
          >
            {isListening ? (
              <>
                 <span className="absolute w-full h-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                 <MicOff size={36} className="relative z-10" />
              </>
            ) : (
              <Mic size={36} />
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-none mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Transcript Display / Edit Area */}
      <div className="flex-grow bg-white rounded-xl shadow-inner border border-stone-200 p-6 relative min-h-[300px] flex flex-col">
        <div className="flex-grow relative">
            <textarea 
                ref={textAreaRef}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "Listening..." : "Tap microphone to speak, or start typing here..."}
                className="w-full h-full resize-none outline-none font-serif text-xl leading-relaxed text-ink placeholder:italic placeholder:text-stone-300 bg-transparent z-10 relative"
            />
            {/* Pulse indicator for listening */}
            {isListening && (
                <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
                    <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                    </span>
                </div>
            )}
        </div>
        
        <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-stone-400 text-sm">
             <span>{isListening ? "Microphone Active" : "Microphone Inactive"}</span>
             <div className="flex items-center gap-1">
                 <Keyboard size={14} />
                 <span>Typing Enabled</span>
             </div>
        </div>
      </div>
    </div>
  );
};