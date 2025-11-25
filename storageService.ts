import { Document, Manuscript, UserSettings } from '../types';

const DOCS_KEY = 'authors_voice_docs';
const MANUSCRIPTS_KEY = 'authors_voice_manuscripts';
const USER_SETTINGS_KEY = 'authors_voice_user_settings';

// --- User Settings ---

export const getUserSettings = (): UserSettings | null => {
  try {
    const data = localStorage.getItem(USER_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
};

// --- Manuscripts ---

export const getManuscripts = (): Manuscript[] => {
  try {
    const data = localStorage.getItem(MANUSCRIPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load manuscripts", e);
    return [];
  }
};

export const saveManuscript = (manuscript: Manuscript): Manuscript => {
  const list = getManuscripts();
  const index = list.findIndex(m => m.id === manuscript.id);
  
  const updated = {
    ...manuscript,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    list[index] = updated;
  } else {
    updated.createdAt = Date.now();
    list.push(updated);
  }
  
  localStorage.setItem(MANUSCRIPTS_KEY, JSON.stringify(list));
  return updated;
};

export const deleteManuscript = (id: string): void => {
  const list = getManuscripts();
  const newList = list.filter(m => m.id !== id);
  localStorage.setItem(MANUSCRIPTS_KEY, JSON.stringify(newList));
  
  // Delete all chapters associated with this manuscript
  const docs = getDocuments();
  const newDocs = docs.filter(doc => doc.manuscriptId !== id);
  localStorage.setItem(DOCS_KEY, JSON.stringify(newDocs));
};

// --- Documents (Chapters) ---

export const getDocuments = (): Document[] => {
  try {
    const data = localStorage.getItem(DOCS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load documents", e);
    return [];
  }
};

export const getDocumentsByManuscript = (manuscriptId: string | undefined): Document[] => {
  const docs = getDocuments();
  return docs.filter(doc => doc.manuscriptId === manuscriptId);
};

export const saveDocument = (doc: Document): Document => {
  const docs = getDocuments();
  const index = docs.findIndex(d => d.id === doc.id);
  
  const updatedDoc = {
    ...doc,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    docs[index] = updatedDoc;
  } else {
    // New document
    updatedDoc.createdAt = Date.now();
    docs.push(updatedDoc);
  }
  
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  return updatedDoc;
};

export const deleteDocument = (id: string): void => {
  const docs = getDocuments();
  const newDocs = docs.filter(d => d.id !== id);
  localStorage.setItem(DOCS_KEY, JSON.stringify(newDocs));
};

export const getDocument = (id: string): Document | undefined => {
  const docs = getDocuments();
  return docs.find(d => d.id === id);
};

// --- Backup & Export ---

export interface BackupData {
  manuscripts: Manuscript[];
  documents: Document[];
  userSettings: UserSettings | null;
  version: number;
  timestamp: number;
}

export const createBackup = (): string => {
  const data: BackupData = {
    manuscripts: getManuscripts(),
    documents: getDocuments(),
    userSettings: getUserSettings(),
    version: 1,
    timestamp: Date.now()
  };
  return JSON.stringify(data, null, 2);
};

export const restoreBackup = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData) as BackupData;
    if (Array.isArray(data.manuscripts) && Array.isArray(data.documents)) {
      localStorage.setItem(MANUSCRIPTS_KEY, JSON.stringify(data.manuscripts));
      localStorage.setItem(DOCS_KEY, JSON.stringify(data.documents));
      if (data.userSettings) {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(data.userSettings));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Restore failed:", e);
    return false;
  }
};

/**
 * Compiles all chapters of a manuscript into a single string.
 * Sorts by creation date (oldest first) to assume chronological writing order.
 */
export const compileManuscript = (manuscriptId: string): string => {
  const manuscript = getManuscripts().find(m => m.id === manuscriptId);
  if (!manuscript) return "";

  const chapters = getDocumentsByManuscript(manuscriptId)
    .sort((a, b) => a.createdAt - b.createdAt);

  return chapters.map(chapter => {
    const content = chapter.polishedText || chapter.rawText || "";
    return `--- ${chapter.title} ---\n\n${content}\n\n`;
  }).join("");
};