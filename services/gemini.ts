
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gebruik het meest stabiele model
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Haalt de API-sleutel op op een manier die werkt in zowel lokale als Vercel omgevingen.
 */
function getApiKey(): string {
  // In sommige build-omgevingen wordt process.env direct vervangen, 
  // in andere moet het via een globale variabele.
  const key = process.env.API_KEY;
  
  if (!key || key === "undefined" || key === "") {
    // Debug informatie voor de ontwikkelaar in de console
    console.error("DEBUG: API_KEY is niet gevonden in process.env");
    console.log("Huidige omgeving:", window.location.hostname);
    
    throw new Error("API-sleutel niet geconfigureerd. Controleer je Vercel Environment Variables (Key: API_KEY).");
  }
  return key;
}

async function callGeminiWithRetry(ai: any, params: any, retries = 2): Promise<GenerateContentResponse> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    console.error("Gemini API Call Error:", error);
    
    // Specifieke foutafhandeling voor quota of rechten
    if (error.message?.includes("API key not valid")) {
      throw new Error("De opgegeven API-sleutel is ongeldig. Genereer een nieuwe in Google AI Studio.");
    }

    if (retries > 0) {
      await sleep(2000);
      return callGeminiWithRetry(ai, params, retries - 1);
    }
    throw error;
  }
}

export async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plaatsnaam voor: ${lat}, ${lng}. Alleen 'Stad (Provincie)'.`,
    });
    return response.text?.replace(/[*_#]/g, '').trim() || null;
  } catch (error) {
    return null;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Coördinaten voor: ${query}. JSON: {"lat": getal, "lng": getal}`,
      config: { responseMimeType: "application/json" }
    });
    
    const data = JSON.parse(response.text || "{}");
    return (data.lat && data.lng) ? { lat: Number(data.lat), lng: Number(data.lng) } : null;
  } catch (error) {
    return null;
  }
}

export async function askGemini(query: string) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Je bent een gids voor Europese beeldenparken.
    Zoek parken binnen 50 km van ${query}. Gebruik Google Search.
    Antwoord uitsluitend in JSON:
    {
      "parks": [
        {
          "name": "Naam", 
          "location": "Stad", 
          "shortDescription": "Beschrijving", 
          "lat": 0.0, 
          "lng": 0.0, 
          "sourceUrl": "URL"
        }
      ]
    }`;

    const response = await callGeminiWithRetry(ai, {
      model: MODEL_NAME,
      contents: `Beeldenparken bij ${query}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.2
      },
    });

    return { text: response.text };
  } catch (error: any) {
    return { text: "ERROR", error: error.message };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Details over "${artworkName}" in "${location}".`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Geen details.";
  } catch (error) {
    return "Informatie niet beschikbaar.";
  }
}
