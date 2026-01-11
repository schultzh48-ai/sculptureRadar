
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

function getApiKey(): string {
  return process.env.API_KEY || "";
}

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Generieke helper voor API calls met retry-logica voor 429/500 fouten.
 */
async function safeGenerateContent(params: any, retries = 3, delay = 2000): Promise<any> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('exceeded quota');
    if (isQuotaError && retries > 0) {
      console.warn(`Quota bereikt. Poging opnieuw over ${delay}ms... (Nog ${retries} over)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return safeGenerateContent(params, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Bepaal de coördinaten voor de plaats: "${query}". Antwoord uitsluitend in JSON: {"lat": getal, "lng": getal, "name": "Geformatteerde Naam"}.`,
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.1 
      }
    });
    return JSON.parse(response.text || "null");
  } catch {
    return null;
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const systemInstruction = `Je bent de Senior AI Curator van SculptuurRadar. 
    Taak 1: Vind beeldenparken en publieke kunsticonen STRIKT binnen 50 km rondom ${locationName}.
    Taak 2: Selecteer de MAXIMAAL 12 meest relevante locaties.
    JSON STRUCTUUR: {"curatorIntro": "...", "parks": [{"name": "...", "location": "...", "desc": "...", "lat": 0.0, "lng": 0.0, "isSolitary": true/false, "isInteractive": true/false, "url": "..."}]}`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Analyseer kunstlocaties binnen 50 km rondom ${locationName}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.2
      },
    });
    
    return JSON.parse(response.text || "{\"parks\": [], \"curatorIntro\": \"\"}");
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      return { error: "De AI provider heeft een tijdelijke limiet bereikt. Probeer het over een minuutje weer." };
    }
    return { error: error.message };
  }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Onderzoek: "${question}"`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Je bent een integere kunsthistoricus. Focus op historische accuraatheid.",
        temperature: 0.1,
      }
    });

    const text = response.text || "Geen antwoord gevonden.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, sources };
  } catch (error: any) {
    return { text: "De expert is momenteel overbezet door te veel aanvragen. Probeer het zo meteen nog eens.", sources: [] };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Geef diepgang over "${artworkName}" in "${location}".`,
      config: { 
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 800,
        temperature: 0.2 
      }
    });
    return response.text || "";
  } catch {
    return "De details konden niet worden opgehaald wegens drukte bij de AI-service.";
  }
}
