
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gebruik het meest stabiele model
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Haalt de API-sleutel op. 
 * Prioriteit: VITE_API_KEY (standaard voor Vite/Vercel) -> API_KEY.
 */
function getApiKey(): string {
  // In een browser omgeving op Vercel worden variabelen zonder VITE_ prefix vaak gestript.
  // We proberen alle mogelijke plekken waar de sleutel kan staan.
  const key = (process.env.VITE_API_KEY) || 
              (process.env.API_KEY) || 
              ((window as any).VITE_API_KEY);
  
  if (!key || key === "undefined" || key === "") {
    console.error("DEBUG: API_KEY configuratie ontbreekt.");
    throw new Error("Configuratie-fout: Zorg dat VITE_API_KEY in Vercel 'Environment Variables' staat en doe een Redeploy.");
  }
  return key;
}

async function callGeminiWithRetry(ai: any, params: any, retries = 2): Promise<GenerateContentResponse> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    console.error("Gemini API Call Error:", error);
    
    // Check voor ongeldige sleutel
    if (error.message?.includes("API key not valid")) {
      throw new Error("De API-sleutel is ongeldig. Controleer de waarde in je Vercel instellingen.");
    }
    
    // Check voor quota (gratis tier limieten)
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Te veel verzoeken tegelijk (Quota bereikt). Wacht een minuutje.");
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
      contents: `Plaatsnaam voor de coördinaten: ${lat}, ${lng}. Antwoord alleen met 'Stad (Provincie)'.`,
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
      contents: `Wat zijn de coördinaten van: ${query}? Geef alleen JSON terug: {"lat": getal, "lng": getal}`,
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

    const systemInstruction = `Je bent een expert in Europese beeldenparken en openlucht kunst.
    Zoek beeldenparken of land-art locaties binnen een straal van 50 km van ${query}. 
    Gebruik Google Search voor actuele informatie.
    Antwoord uitsluitend in dit JSON formaat:
    {
      "parks": [
        {
          "name": "Naam van het park", 
          "location": "Stad/Regio", 
          "shortDescription": "Korte boeiende beschrijving", 
          "lat": 0.0, 
          "lng": 0.0, 
          "sourceUrl": "URL van website"
        }
      ]
    }`;

    const response = await callGeminiWithRetry(ai, {
      model: MODEL_NAME,
      contents: `Vind beeldenparken in de buurt van ${query}.`,
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
      contents: `Vertel me meer over de kunst en geschiedenis van "${artworkName}" in "${location}". Wat maakt deze plek uniek?`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Geen extra details beschikbaar op dit moment.";
  } catch (error) {
    return "Informatie kon niet worden opgehaald.";
  }
}
