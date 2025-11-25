import React, { useState, useEffect } from 'react';
import { Mic, FileText, Library, BookOpen, UserCircle } from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { RecordView } from './components/RecordView';
import { EditView } from './components/EditView';
import { LibraryView } from './components/LibraryView';
import { AppState, Document, UserSettings } from './types';
import { saveDocument, deleteDocument, deleteManuscript, getUserSettings, saveUserSettings } from './services/storageService';

export default function App() {
  const [view, setView] = useState<AppState>(AppState.LIBRARY);
  
  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  
  // Document State
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentManuscriptId, setCurrentManuscriptId] = useState<string | undefined>(undefined);
  const [docTitle, setDocTitle] = useState('');
  const [docTags, setDocTags] = useState<string[]>([]);
  const [polishedText, setPolishedText] = useState('');
  const [logoError, setLogoError] = useState(false);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    error,
    setTranscript,
    resetTranscript
  } = useSpeechRecognition();

  // Load User Settings on Mount
  useEffect(() => {
    const settings = getUserSettings();
    if (settings && settings.hasCompletedOnboarding) {
      setUserSettings(settings);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) return;

    const newSettings: UserSettings = {
      userName: onboardingName.trim(),
      hasCompletedOnboarding: true
    };
    
    saveUserSettings(newSettings);
    setUserSettings(newSettings);
    setShowOnboarding(false);
  };

  // Helper to handle saving the document
  const handleSaveDocument = () => {
    const docToSave: Document = {
      id: currentDocId || crypto.randomUUID(),
      manuscriptId: currentManuscriptId,
      title: docTitle || "Untitled Manuscript",
      rawText: transcript,
      polishedText: polishedText,
      tags: docTags,
      createdAt: Date.now(), // update handled in service if exists
      updatedAt: Date.now()
    };
    
    const savedDoc = saveDocument(docToSave);
    
    // If it was a new doc, update the ID
    if (!currentDocId) {
      setCurrentDocId(savedDoc.id);
    }
  };

  const handleDeleteDocument = () => {
    if (currentDocId) {
      deleteDocument(currentDocId);
      setView(AppState.LIBRARY);
    }
  };

  const handleDeleteCurrentManuscript = () => {
     if (currentManuscriptId) {
         deleteManuscript(currentManuscriptId);
         setView(AppState.LIBRARY);
     }
  };

  const handleOpenDocument = (doc: Document) => {
    setCurrentDocId(doc.id);
    setCurrentManuscriptId(doc.manuscriptId);
    setDocTitle(doc.title);
    setDocTags(doc.tags);
    setPolishedText(doc.polishedText);
    setTranscript(doc.rawText); // Load raw text into speech hook state
    setView(AppState.EDITING);
  };

  const handleNewDocument = (manuscriptId?: string) => {
    setCurrentDocId(null);
    setCurrentManuscriptId(manuscriptId);
    setDocTitle('');
    setDocTags([]);
    setPolishedText('');
    resetTranscript();
    setView(AppState.RECORDING);
  };

  const handleStartRecording = () => {
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
  };

  // Nav Button logic
  const handleNavClick = (targetView: AppState) => {
    if (view === AppState.RECORDING && isListening) {
      if (confirm("You are currently recording. Stop recording and switch views?")) {
        stopListening();
      } else {
        return;
      }
    }
    
    if (targetView === AppState.LIBRARY) {
      // Auto-save before going to library if we have content
      if (transcript || docTitle) {
        handleSaveDocument();
      }
    }
    
    setView(targetView);
  };

  const handleEditProfile = () => {
      setOnboardingName(userSettings?.userName || '');
      setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Navigation Bar */}
      <nav className="flex-none bg-white border-b border-stone-200 px-6 py-4 shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer" 
            onClick={() => handleNavClick(AppState.LIBRARY)}
          >
            {/* Logo Image with Fallback */}
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Ultimate 48 Hour Author Logo" 
                className="h-14 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="bg-ink text-white p-2 rounded-lg">
                <BookOpen size={32} />
              </div>
            )}
            
            <div>
              <h1 className="text-xl md:text-xl font-bold font-serif text-ink tracking-tight leading-tight hidden md:block">Ultimate 48 Hour Author's Voice</h1>
              <h1 className="text-lg font-bold font-serif text-ink tracking-tight leading-tight md:hidden">48 Hour Author</h1>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-medium">
                 {userSettings ? `Workspace: ${userSettings.userName}` : 'Dictation Companion'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-stone-100 p-1 rounded-lg">
                <button 
                    onClick={() => handleNavClick(AppState.LIBRARY)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === AppState.LIBRARY ? 'bg-white shadow-sm text-ink' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    <Library size={16} /> Library
                </button>
                <button 
                    onClick={() => handleNavClick(AppState.RECORDING)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === AppState.RECORDING ? 'bg-white shadow-sm text-ink' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    <Mic size={16} /> Dictate
                </button>
                <button 
                    onClick={() => handleNavClick(AppState.EDITING)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === AppState.EDITING ? 'bg-white shadow-sm text-ink' : 'text-stone-500 hover:text-stone-700'}`}
                >
                    <FileText size={16} /> Review
                </button>
            </div>

            <button 
                onClick={handleEditProfile}
                className="p-2 text-stone-400 hover:text-accent transition-colors"
                title="User Settings"
            >
                <UserCircle size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-2 flex justify-around z-50 pb-safe shadow-lg">
         <button 
            onClick={() => handleNavClick(AppState.LIBRARY)}
            className={`flex flex-col items-center p-2 ${view === AppState.LIBRARY ? 'text-ink' : 'text-stone-400'}`}
         >
            <Library size={24} />
            <span className="text-[10px] mt-1 font-medium">Library</span>
         </button>
         <button 
            onClick={() => handleNavClick(AppState.RECORDING)}
            className={`flex flex-col items-center p-2 ${view === AppState.RECORDING ? 'text-accent' : 'text-stone-400'}`}
         >
            <Mic size={24} />
            <span className="text-[10px] mt-1 font-medium">Dictate</span>
         </button>
         <button 
            onClick={() => handleNavClick(AppState.EDITING)}
            className={`flex flex-col items-center p-2 ${view === AppState.EDITING ? 'text-indigo-600' : 'text-stone-400'}`}
         >
            <FileText size={24} />
            <span className="text-[10px] mt-1 font-medium">Review</span>
         </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col relative overflow-hidden pb-20 md:pb-0">
        {view === AppState.LIBRARY && (
          <LibraryView 
            onOpenDocument={handleOpenDocument}
            onNewDocument={handleNewDocument}
          />
        )}

        {view === AppState.RECORDING && (
          <RecordView 
            isListening={isListening} 
            transcript={transcript} 
            onStart={handleStartRecording} 
            onStop={handleStopRecording}
            error={error}
            title={docTitle}
            setTitle={setDocTitle}
            setTranscript={setTranscript}
          />
        )}

        {view === AppState.EDITING && (
          <EditView 
            rawText={transcript} 
            setRawText={setTranscript} 
            polishedText={polishedText}
            setPolishedText={setPolishedText}
            title={docTitle}
            setTitle={setDocTitle}
            tags={docTags}
            setTags={setDocTags}
            onSave={handleSaveDocument}
            onDelete={handleDeleteDocument}
            onBack={() => setView(AppState.LIBRARY)}
          />
        )}
      </main>

      {/* Onboarding / Profile Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                <div className="mx-auto bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-accent">
                    <UserCircle size={48} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-ink mb-2">Welcome, Author!</h2>
                <p className="text-stone-500 mb-8">
                    Enter your name or pen name to personalize your workspace. 
                    Your data is stored privately on this device.
                </p>
                
                <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                    <input 
                        type="text" 
                        required
                        autoFocus
                        value={onboardingName}
                        onChange={(e) => setOnboardingName(e.target.value)}
                        placeholder="Your Pen Name"
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-accent outline-none text-lg text-center"
                    />
                    <button 
                        type="submit"
                        className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-amber-700 transition-transform active:scale-95 shadow-lg shadow-amber-200"
                    >
                        Start Writing
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}