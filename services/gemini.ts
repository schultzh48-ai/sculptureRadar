
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

function getApiKey(): string {
  return process.env.API_KEY || "";
}

function getAIInstance() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
}

// Hulpmiddel voor stabiliteit: we dwingen de AI om minder creatief en meer als een database te denken
async function safeGenerateContent(params: any, retries = 1): Promise<any> {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    if (retries > 0) return safeGenerateContent(params, retries - 1);
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    // Temperature 0.0 is cruciaal voor stabiliteit
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `TAAK: Vertaal de zoekterm naar coördinaten.
      ZOEKTERM: "${query}"
      INSTRUCTIE: 
      1. Identificeer de meest waarschijnlijke stad of regio. 
      2. Corrigeer typefouten (bijv. "Amsterdm" -> "Amsterdam").
      3. Geef ALTIJD een resultaat als de plek bestaat.
      OUTPUT: Alleen JSON in dit formaat: {"lat": getal, "lng": getal, "name": "Naam Stad"}`,
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.0 // 0.0 zorgt dat het antwoord elke keer hetzelfde is
      }
    });
    
    if (!response.text) return null;
    const cleanedJson = response.text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedJson);
    
    // Validatie van data integriteit
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null;
    
    return data;
  } catch (err) { 
    console.error("Geocoding failed for stability:", err);
    return null; 
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Geef ECHTE beeldenparken binnen 50km van ${locationName} (${lat}, ${lng}).
      Focus op gevestigde namen. Geef JSON: {"parks": [{"name": "Naam", "location": "Stad", "desc": "Kort", "lat": 0.0, "lng": 0.0, "url": "url"}]}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.0 // Stabiele resultaten
      },
    });
    
    if (!response.text) return {"parks": []};
    const cleanedJson = response.text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch {
    return {"parks": []};
  }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: question,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Geef een feitelijk antwoord in het Nederlands op basis van de zoekresultaten.",
        temperature: 0.0
      }
    });
    return { 
      text: response.text || "Geen antwoord.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  } catch { return { text: "Expert offline.", sources: [] }; }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Vertel over ${artworkName} in ${location}.`,
      config: { temperature: 0.1 }
    });
    return response.text || "";
  } catch { return "Geen info."; }
}
