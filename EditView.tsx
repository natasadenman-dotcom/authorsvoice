import React, { useState, useMemo } from 'react';
import { Mail, Sparkles, Copy, Check, Save, Tag, ArrowLeft, Download, Trash2 } from 'lucide-react';
import { cleanUpTranscription } from '../services/geminiService';
import { saveDocx } from '../services/exportService';

interface EditViewProps {
  rawText: string;
  setRawText: (text: string) => void;
  polishedText: string;
  setPolishedText: (text: string) => void;
  title: string;
  setTitle: (title: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  onSave: () => void;
  onDelete?: () => void;
  onBack: () => void;
}

export const EditView: React.FC<EditViewProps> = ({ 
  rawText, 
  setRawText,
  polishedText,
  setPolishedText,
  title,
  setTitle,
  tags,
  setTags,
  onSave,
  onDelete,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'polished'>(polishedText ? 'polished' : 'raw');
  const [tagInput, setTagInput] = useState(tags.join(', '));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentText = activeTab === 'raw' ? rawText : polishedText;

  const wordCount = useMemo(() => {
    return currentText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [currentText]);

  const handlePolish = async () => {
    if (!rawText.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await cleanUpTranscription(rawText);
      setPolishedText(result);
      setActiveTab('polished');
      // Auto-save after polishing
      handleSaveInternal(result);
    } catch (error) {
      alert("Failed to polish text. Check your API configuration.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveInternal = (currentPolishedText?: string) => {
    setSaveStatus('saving');
    onSave();
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleEmail = (textToEmail: string) => {
    const subject = encodeURIComponent(title || "My Transcription");
    const body = encodeURIComponent(textToEmail);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownload = async () => {
    try {
      await saveDocx(title || "Transcription", currentText);
    } catch (e) {
      console.error("Error downloading DOCX", e);
      alert("Failed to generate DOCX file.");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm("Are you sure you want to delete this document? This cannot be undone.")) {
      onDelete();
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    const newTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    setTags(newTags);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header / Metadata */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
            <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 md:hidden">
                <ArrowLeft size={20} />
            </button>
            <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Manuscript"
            className="text-2xl md:text-3xl font-serif font-bold text-ink bg-transparent border-none focus:ring-0 placeholder-stone-300 w-full"
            />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Tag size={16} className="text-stone-400" />
                <input 
                    type="text" 
                    value={tagInput}
                    onChange={handleTagsChange}
                    placeholder="Add tags (separated by commas)..."
                    className="flex-grow md:w-64 bg-white border border-stone-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {onDelete && (
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium mr-2"
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                  <span className="hidden md:inline">Delete</span>
                </button>
              )}

              <button 
                  onClick={() => handleSaveInternal()}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
              >
                  {saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Draft'}
              </button>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex gap-2 p-1 bg-stone-100 rounded-lg">
            <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'raw' 
                ? 'bg-white text-ink shadow-sm' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
            >
            Raw Transcription
            </button>
            <button
            onClick={() => setActiveTab('polished')}
            disabled={!polishedText && !isProcessing}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'polished'
                ? 'bg-white text-accent shadow-sm' 
                : 'text-stone-500 hover:text-stone-700 disabled:opacity-50'
            }`}
            >
            <Sparkles size={14} />
            {isProcessing ? 'Polishing...' : 'Polished Version'}
            </button>
        </div>
        
        <div className="text-sm text-stone-500 font-medium">
            {wordCount} words
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 h-[500px]">
        <div className="flex-grow relative group">
          <textarea
            value={activeTab === 'raw' ? rawText : polishedText}
            onChange={(e) => activeTab === 'raw' ? setRawText(e.target.value) : setPolishedText(e.target.value)}
            className="w-full h-full p-6 bg-white rounded-xl shadow-inner border border-stone-200 resize-none focus:ring-2 focus:ring-accent focus:border-transparent outline-none font-serif text-lg leading-relaxed text-ink"
            placeholder={activeTab === 'raw' ? "No transcription available yet..." : "Polished text will appear here..."}
          />
          
          {/* Action Buttons for current view */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => handleCopy(activeTab === 'raw' ? rawText : polishedText)}
              className="p-2 bg-white border border-stone-200 rounded-lg shadow-sm hover:bg-stone-50 text-stone-600 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white border border-stone-200 rounded-lg shadow-sm hover:bg-stone-50 text-stone-600 transition-colors"
              title="Download as Word Doc (.docx)"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => handleEmail(activeTab === 'raw' ? rawText : polishedText)}
              className="p-2 bg-white border border-stone-200 rounded-lg shadow-sm hover:bg-stone-50 text-stone-600 transition-colors"
              title="Email this version"
            >
              <Mail size={18} />
            </button>
            
            {activeTab === 'raw' && (
              <button
                onClick={handlePolish}
                disabled={isProcessing || !rawText}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg shadow-md hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={18} />
                {isProcessing ? 'Polishing...' : 'Polish with AI'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-stone-400 text-center">
        {activeTab === 'raw' 
          ? "This is your raw dictation. You can edit it manually here before polishing." 
          : "AI-polished version. It fixes punctuation and paragraphs without changing your voice."}
      </p>
    </div>
  );
};