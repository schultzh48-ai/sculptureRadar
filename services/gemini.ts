
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Gebruik het aanbevolen model voor algemene taken om 404 fouten te voorkomen
const MODEL_NAME = 'gemini-3-flash-preview';

async function callGeminiWithRetry(ai: any, params: any, retries = 2): Promise<GenerateContentResponse> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
       console.error("Model niet gevonden. Controleer of de API-key toegang heeft tot " + MODEL_NAME);
    }
    if (retries > 0) {
      await sleep(2000);
      return callGeminiWithRetry(ai, params, retries - 1);
    }
    throw error;
  }
}

export async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Bepaal de exacte administratieve woonplaats voor deze coördinaten: ${lat}, ${lng}. 
      REGELEMENT:
      - Geef de specifieke dorpskern of wijknaam waar deze coördinaten letterlijk binnen vallen.
      - Als de coördinaten in Odijk liggen, antwoord dan 'Odijk' en NIET 'Driebergen', 'Zeist' of 'Bunnik'.
      - Wees hyper-lokaal. 
      - Antwoord enkel met: 'Plaatsnaam (Provincie)'.`,
    });
    return response.text?.replace(/[*_#]/g, '').trim() || null;
  } catch (error) {
    return null;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number } | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || !query) return null;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Geef de coördinaten voor: ${query}. Antwoord uitsluitend in JSON: {"lat": getal, "lng": getal}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text?.trim();
    if (!text) return null;
    const data = JSON.parse(text);
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
  if (!apiKey || !query) {
    return { text: "ERROR", error: "Geen geldige zoekopdracht of API-sleutel." };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `Je bent een gids voor Europese beeldenparken en openluchtmusea.
  Zoek naar werkelijk bestaande parken binnen 50 km van ${query}.
  Gebruik Google Search om de meest actuele informatie te vinden.
  Geef voor elk park de officiële naam, locatie, een korte beschrijving, coördinaten en de officiële website URL.
  
  Antwoord uitsluitend in JSON formaat:
  {
    "parks": [
      {
        "name": "Naam van het park", 
        "location": "Stad of Regio", 
        "shortDescription": "Een korte boeiende beschrijving", 
        "lat": 0.0, 
        "lng": 0.0, 
        "sourceUrl": "URL"
      }
    ]
  }`;

  try {
    const response = await callGeminiWithRetry(ai, {
      model: MODEL_NAME,
      contents: `Vind beeldenparken in de buurt van: ${query}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction,
        temperature: 0.2
      },
    });

    if (!response.text) throw new Error("De AI gaf geen tekst terug.");
    return { text: response.text };
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    return { text: "ERROR", error: `De AI-service kon niet worden gestart: ${error.message}` };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Configuratiefout.";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Geef een uitgebreide beschrijving van de kunstwerken en de geschiedenis van "${artworkName}" in "${location}". Focus op land-art en monumentale sculpturen.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Geen details beschikbaar.";
  } catch (error) {
    return "Informatie kon niet worden opgehaald.";
  }
}
