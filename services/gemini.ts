
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // De SDK vereist een geldig object met apiKey. 
  // We halen deze direct uit de environment zoals vereist.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY is niet gedefinieerd in de process.env");
    return { text: "ERROR", error: "Configuratiefout: API sleutel ontbreekt.", sources: [] };
  }

  // Initialiseer de client DIRECT voor gebruik om race conditions met env vars te voorkomen
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord UITSLUITEND met een valide JSON object. Geen markdown code blocks, geen tekst ervoor of erna. Structuur: { 'curatorVibe': 'tekst', 'parks': [{ 'name': '', 'location': '', 'shortDescription': '', 'website': '', 'lat': 0.0, 'lng': 0.0 }] }. Geef minimaal 15 resultaten in het Nederlands.",
        responseMimeType: "application/json",
        temperature: 0.1, // Nog lager voor maximale JSON stabiliteit
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("De AI gaf een leeg antwoord terug.");
    }

    return { text: text.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    return { text: "ERROR", error: error.message || "Onbekende API fout", sources: [] };
  }
}
