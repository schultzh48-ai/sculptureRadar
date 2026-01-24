
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Alleen POST verzoeken toestaan voor veiligheid
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { task, ...payload } = req.body;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Server configuratiefout: API_KEY ontbreekt in Vercel environment variables.' });
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  try {
    let response;

    switch (task) {
      case 'geocode':
        response = await ai.models.generateContent({
          model,
          contents: `Vertaal de volgende zoekterm naar geografische coördinaten. 
          ZOEKTERM: "${payload.query}"
          OUTPUT: Geef alleen een JSON object terug: {"lat": 0.0, "lng": 0.0, "name": "Stad/Plek"}`,
          config: { responseMimeType: "application/json", temperature: 0 }
        });
        return res.status(200).json(JSON.parse(response.text || '{}'));

      case 'search-parks':
        response = await ai.models.generateContent({
          model,
          contents: `Zoek naar echte, bestaande beeldenparken of openluchtmusea binnen een straal van 50km van ${payload.locationName} (${payload.lat}, ${payload.lng}). 
          Geef alleen resultaten die daadwerkelijk bestaan.
          OUTPUT JSON: {"parks": [{"name": "Naam", "location": "Plaats", "desc": "Korte beschrijving", "lat": 0.0, "lng": 0.0, "url": "website"}]}`,
          config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json", 
            temperature: 0 
          }
        });
        return res.status(200).json(JSON.parse(response.text || '{"parks":[]}'));

      case 'expert-advice':
        response = await ai.models.generateContent({
          model,
          contents: payload.question,
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "Je bent een expert in Europese beeldhouwkunst en land-art. Geef een feitelijk, diepgaand en inspirerend Nederlands antwoord. Gebruik Google Search voor actuele feiten.",
            temperature: 0.2
          }
        });
        return res.status(200).json({ 
          text: response.text, 
          sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] 
        });

      case 'deep-dive':
        response = await ai.models.generateContent({
          model,
          contents: `Vertel in detail over de kunststroming, de specifieke kunstenaars en de historische context van ${payload.artworkName} in ${payload.location}.`,
          config: { temperature: 0.3 }
        });
        return res.status(200).json({ text: response.text });

      default:
        return res.status(400).json({ message: 'Onbekende taak opgevraagd.' });
    }
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    return res.status(500).json({ 
      message: 'Er is een fout opgetreden bij het verwerken van de AI-aanvraag.',
      error: error.message 
    });
  }
}
