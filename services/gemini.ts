
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gebruik het aanbevolen model voor algemene taken
const MODEL_NAME = 'gemini-3-flash-preview';

async function callGeminiWithRetry(ai: any, params: any, retries = 2): Promise<GenerateContentResponse> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    if (retries > 0) {
      await sleep(2000);
      return callGeminiWithRetry(ai, params, retries - 1);
    }
    throw error;
  }
}

export async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return null;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Welke stad hoort bij: ${lat}, ${lng}? Antwoord kort (bijv "Madrid"). Geen extra tekst.`,
    });
    return response.text.replace(/[*_#]/g, '').trim();
  } catch (error) {
    return null;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number } | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return null;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Coördinaten voor centrum van: ${query}. Antwoord UITSLUITEND in JSON: {"lat": getal, "lng": getal}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text.trim();
    const data = JSON.parse(text || '{}');
    if (data.lat && data.lng) {
      return { lat: Number(data.lat), lng: Number(data.lng) };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function askGemini(query: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    return { text: "ERROR", error: "API-sleutel niet gevonden." };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const systemInstruction = `Je bent een gids voor beeldenparken.
  Zoek naar BESTAANDE parken binnen 50 km van ${query}.
  Antwoord UITSLUITEND in JSON:
  {
    "parks": [
      {
        "name": "Naam", 
        "location": "Plaats", 
        "shortDescription": "Beschrijving", 
        "lat": 0.0, 
        "lng": 0.0, 
        "sourceUrl": "URL"
      }
    ]
  }`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: MODEL_NAME,
      contents: `Vind beeldenparken binnen 50km van: ${query}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1
      },
    });

    return { text: response.text };
  } catch (error: any) {
    return { text: "ERROR", error: `Systeemfout: ${error.message}` };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return "Fout.";
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Details over collectie van "${artworkName}" in "${location}".`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (error) {
    return "Niet beschikbaar.";
  }
}
