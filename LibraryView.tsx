import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Trash2, Calendar, Tag, Plus, Folder, FolderPlus, ChevronRight, Book, Settings, Download, Upload, X } from 'lucide-react';
import { Document, Manuscript } from '../types';
import { getDocuments, deleteDocument, getManuscripts, saveManuscript, deleteManuscript, getDocumentsByManuscript, createBackup, restoreBackup } from '../services/storageService';
import { saveManuscriptDocx } from '../services/exportService';

interface LibraryViewProps {
  onOpenDocument: (doc: Document) => void;
  onNewDocument: (manuscriptId?: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onOpenDocument, onNewDocument }) => {
  const [activeManuscript, setActiveManuscript] = useState<Manuscript | null>(null);
  
  // Data State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [isCreatingManuscript, setIsCreatingManuscript] = useState(false);
  const [newManuscriptTitle, setNewManuscriptTitle] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setDocuments(getDocuments());
    setManuscripts(getManuscripts());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to count words
  const countWords = (text: string) => text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  // Calculate Stats per Manuscript
  const getManuscriptStats = (mId: string) => {
      const docs = getDocumentsByManuscript(mId);
      const wordCount = docs.reduce((acc, doc) => acc + countWords(doc.rawText), 0);
      return { chapterCount: docs.length, wordCount };
  };

  // Filter items based on view (Root vs Manuscript) and Search
  const filteredManuscripts = activeManuscript 
    ? [] // Don't show nested manuscripts for now (1 level depth)
    : manuscripts.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredDocs = documents.filter(doc => {
    // Filter by hierarchy location
    const isInCurrentLocation = activeManuscript 
      ? doc.manuscriptId === activeManuscript.id 
      : !doc.manuscriptId; // Only show loose docs at root

    // Filter by search
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return isInCurrentLocation && matchesSearch;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  // --- Handlers ---

  const handleCreateManuscript = () => {
    if (!newManuscriptTitle.trim()) return;
    
    saveManuscript({
      id: crypto.randomUUID(),
      title: newManuscriptTitle,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    setNewManuscriptTitle('');
    setIsCreatingManuscript(false);
    loadData();
  };

  const handleDeleteDoc = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    if (confirm('Are you sure you want to delete this file? This cannot be undone.')) {
      deleteDocument(id);
      loadData();
    }
  };

  const handleDeleteManuscript = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this manuscript? All chapters inside will also be deleted.')) {
      deleteManuscript(id);
      loadData();
    }
  };

  // --- Backup & Export Handlers ---

  const handleDownloadBackup = () => {
    const json = createBackup();
    const element = document.createElement("a");
    const file = new Blob([json], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `authors_voice_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTriggerRestore = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (restoreBackup(content)) {
            alert("Backup restored successfully!");
            loadData();
            setShowBackupModal(false);
        } else {
            alert("Failed to restore backup. Invalid file format.");
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleExportManuscript = async () => {
    if (!activeManuscript) return;
    
    const chapters = getDocumentsByManuscript(activeManuscript.id)
        .sort((a, b) => a.createdAt - b.createdAt);

    if (chapters.length === 0) {
        alert("Manuscript is empty. Add chapters before exporting.");
        return;
    }

    try {
        await saveManuscriptDocx(activeManuscript.title, chapters);
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to generate DOCX file.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6 md:p-8 animate-in fade-in duration-500 relative">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {activeManuscript && (
               <button 
                onClick={() => setActiveManuscript(null)}
                className="text-stone-400 hover:text-ink transition-colors flex items-center text-sm font-medium"
               >
                 Library <ChevronRight size={14} />
               </button>
            )}
            <h2 className="text-3xl font-serif text-ink">
              {activeManuscript ? activeManuscript.title : "Library"}
            </h2>
          </div>
          <p className="text-stone-500">
            {activeManuscript 
              ? "Manage your chapters and scenes." 
              : "Your collection of manuscripts and quick notes."}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
           {/* Root Level Actions */}
          {!activeManuscript && (
            <>
                <button 
                    onClick={() => setShowBackupModal(true)}
                    className="flex items-center gap-2 px-3 py-3 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors font-medium shadow-sm"
                    title="Backup & Restore"
                >
                    <Settings size={18} />
                </button>
                <button 
                onClick={() => setIsCreatingManuscript(true)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium shadow-sm"
                >
                <FolderPlus size={18} /> New Manuscript
                </button>
            </>
          )}

          {/* Manuscript Level Actions */}
          {activeManuscript && (
             <button 
                onClick={handleExportManuscript}
                className="flex items-center gap-2 px-4 py-3 bg-white text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium shadow-sm border border-stone-200"
                title="Compile and download full manuscript as DOCX"
             >
                 <Download size={18} /> Compile to DOCX
             </button>
          )}

          <button 
            onClick={() => onNewDocument(activeManuscript?.id)}
            className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-lg hover:bg-amber-700 shadow-md transition-colors font-medium"
          >
            <Plus size={20} /> 
            {activeManuscript ? "New Chapter" : "New Note"}
          </button>
        </div>
      </div>

      {/* Inline Create Manuscript Form */}
      {isCreatingManuscript && (
        <div className="mb-8 p-6 bg-stone-50 border border-stone-200 rounded-xl animate-in slide-in-from-top-4">
            <h3 className="font-serif font-bold text-lg mb-4">Create New Manuscript</h3>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    autoFocus
                    value={newManuscriptTitle}
                    onChange={(e) => setNewManuscriptTitle(e.target.value)}
                    placeholder="Enter manuscript title (e.g., 'The Lost City')..."
                    className="flex-grow px-4 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-accent outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateManuscript()}
                />
                <button onClick={handleCreateManuscript} className="px-6 py-2 bg-ink text-white rounded-lg hover:bg-black transition-colors">Create</button>
                <button onClick={() => setIsCreatingManuscript(false)} className="px-6 py-2 text-stone-500 hover:text-stone-700">Cancel</button>
            </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-8 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder={activeManuscript ? "Search chapters..." : "Search manuscripts or notes..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow shadow-sm"
        />
      </div>

      {/* Content Grid */}
      <div className="space-y-8">
        
        {/* Manuscripts Section (Only visible at root) */}
        {!activeManuscript && filteredManuscripts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredManuscripts.map(m => {
                    const stats = getManuscriptStats(m.id);
                    return (
                        <div 
                            key={m.id}
                            className="group relative bg-amber-50/50 rounded-xl border border-amber-100 hover:shadow-lg transition-all hover:border-accent/40"
                        >
                            {/* Clickable Overlay for Opening */}
                            <div 
                               onClick={() => setActiveManuscript(m)}
                               className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                               title={`Open ${m.title}`}
                            />
                            
                            {/* Delete Button - Always visible, higher Z to sit above overlay */}
                            <button 
                                type="button"
                                onClick={(e) => handleDeleteManuscript(e, m.id)}
                                className="absolute top-3 right-3 z-20 p-2 bg-white/90 border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-full shadow-sm cursor-pointer transition-colors"
                                title="Delete Manuscript"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Visual Content - pointer-events-none to pass clicks to overlay */}
                            <div className="p-6 pointer-events-none">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-accent">
                                        <Folder size={24} fill="currentColor" className="opacity-20 text-accent" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-ink mb-2">{m.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-stone-500 font-medium uppercase tracking-wider">
                                    <span>{stats.chapterCount} Chapters</span>
                                    <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                    <span>{stats.wordCount.toLocaleString()} Words</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* Documents/Chapters Section */}
        {filteredDocs.length > 0 ? (
            <div>
                {!activeManuscript && filteredManuscripts.length > 0 && <h3 className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-4 mt-8">Quick Notes & Unsorted</h3>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => {
                    const wordCount = countWords(doc.rawText);
                    return (
                        <div 
                        key={doc.id}
                        className="group relative bg-white rounded-xl border border-stone-200 hover:shadow-lg transition-all hover:border-accent/30"
                        >
                            {/* Clickable Overlay for Opening */}
                            <div 
                               onClick={() => onOpenDocument(doc)}
                               className="absolute inset-0 z-10 cursor-pointer rounded-xl"
                               title={`Open ${doc.title}`}
                            />
                            
                            {/* Delete Button - Always visible, higher Z to sit above overlay */}
                            <button 
                                type="button"
                                onClick={(e) => handleDeleteDoc(e, doc.id)}
                                className="absolute top-3 right-3 z-20 p-2 bg-white/90 border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-full shadow-sm cursor-pointer transition-colors"
                                title="Delete Document"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Visual Content */}
                            <div className="p-6 pointer-events-none">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-amber-50 text-stone-500 group-hover:text-accent transition-colors">
                                    <FileText size={20} />
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-serif font-bold text-ink mb-2 truncate pr-8">
                                    {doc.title || "Untitled Draft"}
                                </h3>
                                
                                <div className="text-sm text-stone-500 mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2 leading-relaxed">
                                    {doc.rawText || <span className="italic text-stone-300">Empty transcription...</span>}
                                </div>
                                
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2 text-xs text-stone-400">
                                        <Calendar size={12} />
                                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs text-stone-400 font-medium bg-stone-50 px-2 py-1 rounded-md">
                                        {wordCount} words
                                    </div>
                                </div>

                                {doc.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-100">
                                    {doc.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium">
                                        <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        ) : (
            filteredManuscripts.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50">
                    <Book size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="text-xl font-medium text-stone-600">
                        {activeManuscript ? "No chapters yet" : "Empty Library"}
                    </h3>
                    <p className="text-stone-400 mb-6">
                        {activeManuscript ? "Add your first chapter to this manuscript." : "Create a manuscript or start a quick note."}
                    </p>
                    <button 
                        onClick={() => onNewDocument(activeManuscript?.id)}
                        className="text-accent font-medium hover:underline"
                    >
                        {activeManuscript ? "Create Chapter 1" : "Start writing"}
                    </button>
                </div>
            )
        )}
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                  <button 
                    onClick={() => setShowBackupModal(false)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-ink"
                  >
                      <X size={20} />
                  </button>
                  
                  <h3 className="text-2xl font-serif font-bold text-ink mb-2">Data Backup</h3>
                  <p className="text-stone-500 mb-6 text-sm">
                      Save your entire library to a file to prevent data loss, or restore from a previous backup.
                  </p>
                  
                  <div className="space-y-4">
                      <button 
                        onClick={handleDownloadBackup}
                        className="w-full flex items-center justify-center gap-3 p-4 bg-amber-50 text-accent border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-medium group"
                      >
                          <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                          Download Backup File
                      </button>
                      
                      <div className="relative">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleRestoreFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <button 
                            onClick={handleTriggerRestore}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-white text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors font-medium group"
                        >
                            <Upload size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                            Restore from Backup
                        </button>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-stone-100 text-center">
                      <p className="text-xs text-stone-400">
                          Note: Restoring will overwrite your current library.
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};