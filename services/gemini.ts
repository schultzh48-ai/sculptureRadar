
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Hulpmiddel om de API key op te halen.
 * We geven prioriteit aan VITE_API_KEY zoals afgesproken.
 */
const getApiKey = () => {
  return process.env.VITE_API_KEY || process.env.API_KEY || "";
};

// Hulpmiddel voor stabiliteit en retry-logica
async function safeGenerateContent(params: any, retries = 2): Promise<any> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("VITE_API_KEY is niet geconfigureerd in de omgeving.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent(params);
    
    if (!response || !response.text) {
      throw new Error("Empty response from Gemini");
    }
    
    return response;
  } catch (error: any) {
    console.error(`Gemini Error (Retries left: ${retries}):`, error.message);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return safeGenerateContent(params, retries - 1);
    }
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Vertaal de volgende zoekterm naar geografische coördinaten. 
      ZOEKTERM: "${query}"
      OUTPUT: Geef alleen een JSON object terug in dit formaat: {"lat": getal, "lng": getal, "name": "Naam van de stad of plek"}`,
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.0 
      }
    });
    
    const data = JSON.parse(response.text.trim());
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null;
    return data;
  } catch (err) { 
    console.error("Geocode error:", err);
    return null; 
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Zoek naar echte beeldenparken, beeldentuinen of openluchtmusea binnen een straal van 50km rondom ${locationName} (${lat}, ${lng}). 
      Geef het resultaat terug als JSON: {"parks": [{"name": "Naam van het park", "location": "Plaats", "desc": "Korte omschrijving", "lat": getal, "lng": getal, "url": "officiële website indien bekend"}]}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.0
      },
    });
    
    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("Search error:", err);
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
        systemInstruction: "Je bent een expert in Europese beeldhouwkunst en land-art. Geef een feitelijk, inspirerend en kort Nederlands antwoord op basis van zoekresultaten.",
        temperature: 0.0
      }
    });
    return { 
      text: response.text || "Geen antwoord beschikbaar.", 
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
    };
  } catch (err) { 
    console.error("Expert error:", err);
    return { text: "De expert is momenteel niet bereikbaar.", sources: [] }; 
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: `Vertel kort over de kunststroming, de geschiedenis of de specifieke kunstwerken in ${artworkName}, gelegen in ${location}. Focus op wat dit park uniek maakt.`,
      config: { temperature: 0.2 }
    });
    return response.text || "";
  } catch (err) { 
    console.error("Deep dive error:", err);
    return "Details konden niet worden geladen."; 
  }
}
