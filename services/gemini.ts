
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

function getApiKey(): string {
  const key = (import.meta as any).env?.VITE_API_KEY || 
              (typeof process !== 'undefined' && process.env ? (process.env.VITE_API_KEY || process.env.API_KEY) : "") ||
              (window as any).VITE_API_KEY || 
              "";
  return key;
}

function getAIInstance() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
}

async function safeGenerateContent(params: any, retries = 1, delay = 1000): Promise<any> {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota');
    if (isQuotaError && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return safeGenerateContent(params, retries - 1, delay * 2);
    }
    if (isQuotaError) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Coördinaten voor "${query}". Alleen JSON: {"lat": num, "lng": num, "name": "Stad"}`,
      config: { responseMimeType: "application/json", temperature: 0 }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch { return null; }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const systemInstruction = `Senior Curator. Zoek ECHTE beeldenparken binnen 50km van ${locationName}. Gebruik Google Search. 
    JSON: {"curatorIntro": "1 korte zin", "parks": [{"name": "Naam", "location": "Stad", "desc": "1 zin", "lat": 0.0, "lng": 0.0, "isSolitary": bool, "isInteractive": bool, "url": "url"}]}`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Kunstparken nabij ${locationName}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1
      },
    });
    return response.text ? JSON.parse(response.text) : {"parks": []};
  } catch (error) { throw error; }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Vraag: "${question}"`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Antwoord feitelijk en kort.",
        temperature: 0.1,
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
      contents: `Context over "${artworkName}" in "${location}". Max 100 woorden.`,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    return response.text || "";
  } catch { return "Details niet beschikbaar."; }
}
