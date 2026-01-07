
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // We halen de key op het allerlaatste moment op
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("KRITIEKE FOUT: API_KEY is niet beschikbaar in de browser context.");
    return { 
      text: "ERROR", 
      error: "De API-sleutel is niet correct geladen door het platform. Probeer de pagina te verversen.", 
      sources: [] 
    };
  }

  try {
    // Initialiseer de AI instantie pas HIER, binnen de functie-aanroep
    const ai = new GoogleGenAI({ apiKey });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord uitsluitend in valide JSON. Geen tekst, geen uitleg, geen markdown. Structuur: { \"curatorVibe\": \"...\", \"parks\": [{\"name\": \"...\", \"location\": \"...\", \"shortDescription\": \"...\", \"website\": \"...\", \"lat\": 0.0, \"lng\": 0.0}] }",
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("De AI gaf geen tekst terug.");
    }

    return { text: response.text.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Vang de specifieke 'API Key' fout van de SDK op
    const errorMsg = error.message?.includes("API key") 
      ? "Er is een probleem met de API-sleutel configuratie op de server."
      : error.message;
    
    return { text: "ERROR", error: errorMsg, sources: [] };
  }
}
