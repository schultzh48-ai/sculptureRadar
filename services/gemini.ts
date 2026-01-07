
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // Initialiseer exact zoals vereist voor dit systeem
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord ALTIJD in het Nederlands met een JSON object: { 'curatorVibe': 'tekst', 'parks': [...] }. Geef minimaal 15 resultaten.",
        responseMimeType: "application/json",
      },
    });

    return { text: response.text || "", sources: [] };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "ERROR", sources: [] };
  }
}
