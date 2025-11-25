import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const cleanUpTranscription = async (rawText: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: rawText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature to stick close to original text
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error cleaning up text with Gemini:", error);
    throw error;
  }
};