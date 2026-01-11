
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Helper to get the API key from environment variables.
 */
function getApiKey(): string {
  return process.env.API_KEY || "";
}

// Correct initialization with named parameter
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Bepaal de coördinaten voor de plaats: "${query}". Antwoord uitsluitend in JSON: {"lat": getal, "lng": getal, "name": "Geformatteerde Naam"}.`,
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.1 
      }
    });
    // Use response.text property (not a method)
    return JSON.parse(response.text || "null");
  } catch {
    return null;
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const systemInstruction = `Je bent de Senior AI Curator van SculptuurRadar. 
    Taak 1: Vind beeldenparken, openluchtmusea en solitaire Land Art sculpturen.
    Taak 2: Zoek specifiek naar "Public Art Icons": monumentale, interactieve of technologische publieke kunstwerken (bijv. "Mannes" in Assen, "Sanna" in Bordeaux) STRIKT binnen een straal van 50 km rondom ${locationName}.
    Taak 3: Let op innovatieve projecten die gebruik maken van interactiviteit, stoom, licht, kinetiek of unieke materialen.
    Taak 4: LIMIET: Selecteer de MAXIMAAL 12 meest relevante of indrukwekkende locaties. Kwaliteit boven kwantiteit.
    JSON STRUCTUUR: {"curatorIntro": "...", "parks": [{"name": "...", "location": "...", "desc": "...", "lat": 0.0, "lng": 0.0, "isSolitary": true/false, "isInteractive": true/false, "url": "..."}]}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyseer kunstlocaties binnen 50 km rondom ${locationName}. Geef een topselectie van maximaal 12 unieke publieke iconen en parken.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.2
      },
    });
    
    // Use response.text property
    return JSON.parse(response.text || "{\"parks\": [], \"curatorIntro\": \"\"}");
  } catch (error: any) {
    console.error("Curator search failed:", error);
    return { error: error.message };
  }
}

export async function askArtistExpert(question: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Onderzoek en beantwoord de volgende vraag over een kunstenaar of kunststroming met nadruk op historische accuraatheid: "${question}"`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Je bent een integere kunsthistoricus. Jouw primaire doel is historische waarheid. Gebruik Google Search om feiten over kunstenaars en collectieven te verifiëren. Focus op materialen, interactiviteit en context. Houd het antwoord zakelijk doch bevlogen (max 180 woorden).",
        temperature: 0.1,
      }
    });

    // Use response.text property
    const text = response.text || "De expert kon geen geverifieerd antwoord vinden.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources };
  } catch {
    return { text: "Er ging iets mis bij het raadplegen van de bronnen.", sources: [] };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Geef feitelijke diepgang over "${artworkName}" in "${location}". Focus op kunsthistorische feiten, gebruikte materialen en de interactieve of symbolische betekenis.`,
      config: { 
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 800,
        temperature: 0.2 
      }
    });
    // Use response.text property
    return response.text || "";
  } catch {
    return "Informatie momenteel niet beschikbaar.";
  }
}
