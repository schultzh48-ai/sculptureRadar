
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // Gebruik de API_KEY direct zoals in de werkende MuseumRadar app
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord UITSLUITEND met een valide JSON object. Geen markdown code blocks, geen tekst ervoor of erna. Structuur: { 'curatorVibe': 'tekst', 'parks': [{ 'name': '', 'location': '', 'shortDescription': '', 'website': '', 'lat': 0.0, 'lng': 0.0 }] }. Geef minimaal 15 resultaten in het Nederlands.",
        responseMimeType: "application/json",
        temperature: 0.2, // Lagere temperatuur voor meer consistente JSON
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Lege response van AI");
    }

    return { text: text.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Geef de specifieke error door voor betere debugging
    return { text: "ERROR", error: error.message, sources: [] };
  }
}
