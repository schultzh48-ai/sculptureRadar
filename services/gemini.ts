import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Haalt de API-sleutel op op de juiste manier voor Vite en Vercel.
 */
function getApiKey(): string {
  // In Vite/Vercel omgevingen gebruik je import.meta.env voor client-side variabelen.
  // Zorg dat de variabele in Vercel 'VITE_API_KEY' heet.
  const key = (import.meta as any).env?.VITE_API_KEY || 
              (typeof process !== 'undefined' && process.env ? (process.env.VITE_API_KEY || process.env.API_KEY) : "") ||
              (window as any).VITE_API_KEY || 
              "";
  return key;
}

function getAIInstance() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("DEBUG: API Key is leeg. Controleer of VITE_API_KEY in Vercel staat.");
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}

async function safeGenerateContent(params: any, retries = 2, delay = 2000): Promise<any> {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit');
    
    if (isQuotaError && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return safeGenerateContent(params, retries - 1, delay * 1.5);
    }
    
    if (isQuotaError) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Bepaal coördinaten voor: "${query}". Antwoord ALLEEN met JSON: {"lat": getal, "lng": getal, "name": "Stad, Land"}.`,
      config: { responseMimeType: "application/json", temperature: 0.1 }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (err) {
    console.error("Geocode error:", err);
    throw err;
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const systemInstruction = `Je bent een Senior Kunst-Curator. Zoek ECHTE beeldenparken en publieke kunstlocaties binnen 50km van de coördinaten van ${locationName}. Gebruik Google Search voor actuele locaties. 
    JSON OUTPUT: {"curatorIntro": "Korte samenvatting van het kunstaanbod in deze regio", "parks": [{"name": "Naam", "location": "Plaats", "desc": "Korte feitelijke beschrijving", "lat": 0.0, "lng": 0.0, "isSolitary": boolean, "isInteractive": boolean, "url": "website"}]}`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Identificeer kunstparken en sculpturen nabij ${locationName} (${lat}, ${lng}).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1
      },
    });
    
    return response.text ? JSON.parse(response.text) : {"parks": [], "curatorIntro": ""};
  } catch (error: any) {
    console.error("AI Search failed:", error.message);
    throw error;
  }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Vraag: "${question}"`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Je bent een kunsthistoricus. Geef een beknopt en feitelijk antwoord.",
        temperature: 0.1,
      }
    });
    return { 
      text: response.text || "Geen antwoord gevonden.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  } catch {
    return { text: "De expert is momenteel niet bereikbaar.", sources: [] };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Analyseer "${artworkName}" in "${location}". Focus op de kunstenaar en de context.`,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    return response.text || "";
  } catch {
    return "Details konden niet worden geladen.";
  }
}