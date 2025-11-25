import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Document as AppDocument } from '../types';

export const saveDocx = async (title: string, content: string) => {
  const lines = content.split('\n');
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 300 }
        }),
        ...lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return new Paragraph({ text: "" }); // Empty line
            return new Paragraph({
                children: [new TextRun(trimmed)],
                spacing: { after: 200 }
            });
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${title || 'Document'}.docx`);
};

export const saveManuscriptDocx = async (title: string, chapters: AppDocument[]) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 500 }
        }),
        ...chapters.flatMap((chapter, index) => {
            const text = chapter.polishedText || chapter.rawText || "";
            const lines = text.split('\n');
            
            // Determine if we should add a page break.
            // Generally, we want page breaks before every chapter except maybe the very first content if desired,
            // but usually in a book, Chapter 1 starts on a new page after the Title page.
            // So we add pageBreakBefore: true to all chapter headings.
            
            return [
                new Paragraph({
                    text: chapter.title || `Chapter ${index + 1}`,
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true, 
                    spacing: { after: 300, before: 300 }
                }),
                ...lines.map(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return new Paragraph({ text: "" });
                    return new Paragraph({
                        children: [new TextRun(trimmed)],
                        spacing: { after: 200 }
                    });
                })
            ];
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${title || 'Manuscript'}.docx`);
};

const saveBlob = (blob: Blob, filename: string) => {
  const element = document.createElement("a");
  element.href = URL.createObjectURL(blob);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};