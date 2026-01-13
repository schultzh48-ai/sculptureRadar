
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

function getApiKey(): string {
  // Gebruik de voorgeschreven methode voor API sleutels
  return process.env.API_KEY || "";
}

function getAIInstance() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
}

async function safeGenerateContent(params: any, retries = 2, delay = 2000): Promise<any> {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota');
    
    if (isQuotaError && retries > 0) {
      console.warn(`Quota bereikt. Poging ${3-retries}...`);
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
      contents: `Geef de coördinaten voor de locatie "${query}". Geef ALLEEN JSON terug: {"lat": getal, "lng": getal, "name": "Naam van Stad"}`,
      config: { responseMimeType: "application/json", temperature: 0 }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch { return null; }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    // Bij quota-druk proberen we kortere prompts of retourneren we sneller een lege lijst
    const systemInstruction = `Senior Curator. Zoek ECHTE beeldenparken binnen 50km van ${locationName}. JSON formaat: {"parks": [{"name": "", "location": "", "desc": "", "lat": 0.0, "lng": 0.0, "url": ""}]}`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Kunstparken binnen 50km van ${locationName} (${lat}, ${lng}).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.1
      },
    });
    return response.text ? JSON.parse(response.text) : {"parks": []};
  } catch (error: any) { 
    if (error.message === "QUOTA_EXCEEDED") {
      console.error("Gemini Quota Overschreden. We vallen terug op de lokale database.");
    }
    return {"parks": []};
  }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Kunsthistorische vraag: "${question}"`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Je bent een kunsthistoricus. Antwoord feitelijk en beknopt in het Nederlands.",
        temperature: 0.1,
      }
    });
    return { 
      text: response.text || "Geen antwoord beschikbaar.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  } catch { return { text: "De expert is momenteel niet bereikbaar (mogelijk quotum bereikt).", sources: [] }; }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Diepgaande context over beeldenpark "${artworkName}" in "${location}". Focus op betekenis. Max 100 woorden.`,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });
    return response.text || "";
  } catch { return "Informatie kon niet worden opgehaald. Probeer het later opnieuw."; }
}
