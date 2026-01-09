
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { text: "ERROR", error: "Geen API-sleutel geconfigureerd.", sources: [] };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            curatorVibe: { type: Type.STRING },
            searchLat: { type: Type.NUMBER },
            searchLng: { type: Type.NUMBER },
            parks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  location: { type: Type.STRING },
                  shortDescription: { type: Type.STRING },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER },
                  isSolitary: { type: Type.BOOLEAN }
                },
                required: ["name", "location", "lat", "lng"]
              }
            }
          },
          required: ["parks", "searchLat", "searchLng"]
        },
        systemInstruction: `Je bent een curator voor buitenkunst.
          TAAK: Vind maximaal 12 kunstobjecten in de gevraagde regio. 
          BALANS: Zoek eerst naar de 6 meest prominente beeldenparken of openluchtmusea (indien aanwezig). 
          AANVULLING: Vul de lijst aan tot 12 met solitaire monumentale sculpturen in de publieke ruimte (bijv. Jaume Plensa, Henry Moore, Richard Serra).
          STABILITEIT: Geef bij voorkeur altijd dezelfde top-locaties terug voor een specifieke regio.
          PRECISIE: Gebruik Google Search voor exacte GPS-coördinaten.
          FORMAT: JSON only.`,
        temperature: 0,
        topP: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Lege response");
    
    return { text: text, sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    return { text: "ERROR", error: "Radar kon geen objecten vinden.", sources: [] };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyseer "${artworkName}" in "${location}". Focus op kunstenaar, betekenis en materiaal. Max 60 woorden. NL.`,
      config: {
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    return "Details niet beschikbaar.";
  }
}
