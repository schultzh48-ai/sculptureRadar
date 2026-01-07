
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // In een Vite/Vercel omgeving kan process.env soms leeg lijken in de browser.
  // We proberen zowel de standaard process.env als eventuele globale injecties.
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY;

  if (!apiKey) {
    console.error("CRITISCH: API_KEY niet gevonden in de browser omgeving.");
    // We geven een specifieke error terug die App.tsx kan herkennen
    return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
  }

  try {
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
      throw new Error("Geen tekst ontvangen van model");
    }

    return { text: response.text, sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Als de API zelf zegt dat de key fout is
    if (error.message?.includes("API key not found") || error.message?.includes("403") || error.message?.includes("401")) {
      return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
    }
    
    return { text: "ERROR", sources: [] };
  }
}
