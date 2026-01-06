
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function askGemini(prompt: string, history: ChatMessage[]) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1, // Lager voor hogere feitelijke precisie
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `Je bent een gespecialiseerde geografische kunst-expert. 
        TAAK: Identificeer beeldenparken en openluchtmusea die DAADWERKELIJK binnen een straal van 50km van de gevraagde locatie liggen.
        
        STRIKTE REGELS:
        1. Gebruik GOOGLE SEARCH om de EXACTE coördinaten (lat/lng) en het fysieke adres van elke locatie te verifiëren.
        2. Als een park (zoals Jits Bakker in De Bilt) verder dan 50km van de zoeklocatie (zoals Den Haag) ligt, mag je het NIET tonen.
        3. Controleer of de locatie openbaar toegankelijk is of een officieel museum/park is.
        4. Antwoord uitsluitend in JSON formaat. Geen inleidende tekst of markdown blokken.
        
        JSON SCHEMA: 
        [
          {
            "id": "uniek-id",
            "name": "Officiële Naam",
            "location": "Stad, Land",
            "lat": 52.1234, 
            "lng": 4.1234,
            "shortDescription": "Focus op de kunstcollectie en de omgeving.",
            "website": "URL"
          }
        ]`,
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "[]";
    // Extraheer JSON uit eventuele tekst (voor de veiligheid)
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const cleanJson = (jsonStart !== -1 && jsonEnd !== -1) ? text.substring(jsonStart, jsonEnd) : "[]";

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Bron',
      uri: chunk.web?.uri || '#'
    })).filter((s: any) => s.uri !== '#') || [];

    return { text: cleanJson, sources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
}
