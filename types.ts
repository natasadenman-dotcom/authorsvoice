export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

// Window augmentation for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  EDITING = 'EDITING',
  LIBRARY = 'LIBRARY',
}

export interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
}

export interface Manuscript {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  manuscriptId?: string; // If present, this is a chapter within a manuscript
  title: string;
  rawText: string;
  polishedText: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  userName: string;
  hasCompletedOnboarding: boolean;
}