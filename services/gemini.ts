
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gebruik het meest stabiele model
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Haalt de API-sleutel op op een manier die werkt in Vite (Vercel).
 */
function getApiKey(): string {
  // @ts-ignore - Vite gebruikt import.meta.env, Vercel injecteert soms process.env
  const env = (import.meta as any).env || {};
  const processEnv = typeof process !== 'undefined' ? process.env : {};

  const key = env.VITE_API_KEY || 
              processEnv.VITE_API_KEY || 
              processEnv.API_KEY || 
              (window as any).VITE_API_KEY;
  
  if (!key || key === "undefined" || key === "") {
    console.error("DEBUG: API_KEY niet gevonden in omgeving.");
    throw new Error("Configuratie-fout: De browser kan de VITE_API_KEY niet vinden. Controleer of je de variabele in Vercel hebt hernoemd naar VITE_API_KEY en daarna een 'Redeploy' hebt uitgevoerd.");
  }
  return key;
}

async function callGeminiWithRetry(ai: any, params: any, retries = 2): Promise<GenerateContentResponse> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    console.error("Gemini API Call Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      throw new Error("De API-sleutel is ongeldig. Controleer op spaties in je Vercel instellingen.");
    }
    
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Systeem is even overbelast (Quota). Wacht 10 seconden en probeer het opnieuw.");
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
      contents: `Geef de plaatsnaam en regio voor: ${lat}, ${lng}. Antwoord kort: 'Stad, Regio'.`,
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
      contents: `Coördinaten voor: ${query}. Geef alleen JSON: {"lat": getal, "lng": getal}`,
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

    const systemInstruction = `Je bent een gespecialiseerde gids voor kunst in de openbare ruimte.
    Zoek beeldenparken, beeldentuinen of belangrijke land-art locaties binnen 50 km van ${query}.
    Maak gebruik van Google Search voor de meest actuele locaties.
    Antwoord strikt in JSON:
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

    const response = await callGeminiWithRetry(ai, {
      model: MODEL_NAME,
      contents: `Vind beeldenparken nabij ${query}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1
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
      contents: `Vertel een inspirerend verhaal over de kunst op de locatie "${artworkName}" in "${location}". Focus op de beleving en geschiedenis.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Geen details gevonden.";
  } catch (error) {
    return "Informatie tijdelijk niet beschikbaar.";
  }
}
