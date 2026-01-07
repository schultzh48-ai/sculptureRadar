
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // We gebruiken de geïnjecteerde API_KEY uit de omgeving.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY environment variable is missing.");
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
        systemInstruction: "Je bent de curator van SculptuurRadar. Je bent een wereldwijde expert in beeldenparken, openluchtmusea en land-art. Antwoord ALTIJD in het Nederlands met een JSON object: { 'curatorVibe': 'tekst', 'parks': [...] }. Geef minimaal 15 resultaten indien mogelijk. Zorg voor een inspirerende toon en wees accuraat met locaties.",
        responseMimeType: "application/json"
      },
    });

    return { text: response.text || "", sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: "ERROR", sources: [] };
  }
}
