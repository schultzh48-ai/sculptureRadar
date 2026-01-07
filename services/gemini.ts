
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.length < 10) {
    return { text: "FOUT_SLEUTEL_ONTBREEKT", sources: [] };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Gemini 3 Flash voor snelheid en betrouwbare JSON
    const modelToUse = 'gemini-3-flash-preview';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        temperature: 0.8, // Iets hoger voor meer diversiteit in locaties
        systemInstruction: "Je bent de curator van SculptuurRadar. Antwoord ALTIJD in het Nederlands met een JSON object dat twee velden bevat: 'curatorVibe' (een inspirerende tekst van max 2 zinnen over de kunst-sfeer in deze regio) en 'parks' (een array met minimaal 15 relevante beeldenparken of kunstlocaties in de buitenlucht). Geen markdown, geen extra tekst, puur JSON.",
        responseMimeType: "application/json"
      },
    });

    return { text: response.text || "", sources: [] };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      return { text: "FOUT_SLEUTEL_ONGELDIG", sources: [] };
    }
    return { text: "ERROR", sources: [] };
  }
}
