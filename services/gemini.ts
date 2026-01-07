
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // We proberen de API_KEY op te halen uit de omgeving. 
  // In deze specifieke runtime is process.env.API_KEY de standaard.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return { 
      text: "ERROR", 
      error: "Systeemfout: De verbinding met de AI-service kon niet worden hersteld. Controleer de platforminstellingen.", 
      sources: [] 
    };
  }

  try {
    // Initialiseer de AI client direct met de gevonden sleutel
    const ai = new GoogleGenAI({ apiKey });
    
    // Volgens de richtlijnen: gebruik direct ai.models.generateContent
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord uitsluitend in valide JSON. Geen markdown code blocks. Structuur: { \"curatorVibe\": \"...\", \"parks\": [{\"name\": \"...\", \"location\": \"...\", \"shortDescription\": \"...\", \"website\": \"...\", \"lat\": 0.0, \"lng\": 0.0}] }",
        responseMimeType: "application/json",
        temperature: 0.1
      },
    });

    // Gebruik de .text property (geen methode aanroep)
    const textOutput = response.text;

    if (!textOutput) {
      throw new Error("De AI gaf geen leesbare data terug.");
    }

    return { text: textOutput.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    return { 
      text: "ERROR", 
      error: error.message || "Er is een technische fout opgetreden bij het raadplegen van de kunst-database.", 
      sources: [] 
    };
  }
}
