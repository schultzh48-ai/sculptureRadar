
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // We gebruiken direct de omgevingsvariabele zoals in MuseumRadar.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord ALTIJD in het Nederlands met een JSON object: { 'curatorVibe': 'tekst', 'parks': [...] }. Geef minimaal 15 resultaten.",
        responseMimeType: "application/json",
        temperature: 1,
      },
    });

    return { text: response.text || "", sources: [] };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "ERROR", sources: [] };
  }
}
