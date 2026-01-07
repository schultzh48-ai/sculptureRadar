
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // In Vercel frontend omgevingen wordt de key geïnjecteerd.
  // We halen hem hier direct op bij elke aanroep om race conditions te voorkomen.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("DEBUG: API_KEY is undefined in process.env");
    return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
  }

  try {
    // Maak een nieuwe instantie aan voor de meest actuele key-status
    const ai = new GoogleGenAI({ apiKey });
    const modelToUse = 'gemini-3-flash-preview';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        temperature: 0.8,
        systemInstruction: "Je bent de curator van SculptuurRadar. Je bent een wereldwijde expert in beeldenparken en land-art. Antwoord ALTIJD in het Nederlands met een JSON object: { 'curatorVibe': 'tekst', 'parks': [...] }. Geef minimaal 15 resultaten. Geen extra tekst buiten de JSON.",
        responseMimeType: "application/json"
      },
    });

    if (!response.text) {
      throw new Error("Lege response van Gemini");
    }

    return { text: response.text, sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    // Specifieke check op 403/401 errors die duiden op key issues
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("403") || error.message?.includes("401")) {
      return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
    }
    
    return { text: "ERROR", sources: [] };
  }
}
