
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

function getApiKey(): string {
  // @ts-ignore
  const env = (import.meta as any).env || {};
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  const key = env.VITE_API_KEY || processEnv.VITE_API_KEY || processEnv.API_KEY;
  if (!key) throw new Error("API_KEY missing");
  return key;
}

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function getRegionIntro(query: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Vertel in max 3 zinnen iets poëtisch over de sfeer van de streek/stad ${query} en haar relatie met kunst of sculpturen in de open lucht.`,
    });
    return response.text?.trim() || "";
  } catch {
    return "";
  }
}

export async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plaatsnaam voor ${lat}, ${lng}. Alleen 'Stad, Land'.`,
    });
    return response.text?.trim() || null;
  } catch {
    return "Huidige locatie";
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Coordinates for ${query}. Return ONLY JSON: {"lat":x,"lng":y}`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "{}");
    return (data.lat && data.lng) ? { lat: Number(data.lat), lng: Number(data.lng) } : null;
  } catch {
    return null;
  }
}

export async function askGemini(query: string) {
  try {
    const systemInstruction = `Gids voor kunstlocaties. Zoek beeldenparken/land-art in ${query}. 
    Gebruik Google Search. Antwoord direct in JSON:
    {"parks": [{"name":"..","location":"..","shortDescription":"..","lat":0.0,"lng":0.0,"sourceUrl":"..","isLandArt":true}]}. Max 12.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Lijst 12 beeldenparken in/nabij ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1,
      },
    });
    return { text: response.text };
  } catch (error: any) {
    return { text: "ERROR", error: error.message };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `3 korte feiten over "${artworkName}" in "${location}".`,
    });
    return response.text || "Geen extra informatie.";
  } catch {
    return "Informatie niet beschikbaar.";
  }
}
