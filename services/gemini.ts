
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  const apiKey = process.env.API_KEY;
  
  // Controle op aanwezigheid van de sleutel
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.length < 5) {
    console.error("CONFIGURATIEFOUT: API_KEY ontbreekt in de omgeving.");
    return { 
      text: "FOUT_SLEUTEL_ONTBREEKT", 
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const isJsonRequest = prompt.toLowerCase().includes("json");

  try {
    const modelToUse = 'gemini-3-flash-preview';
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        temperature: isJsonRequest ? 0.1 : 0.7,
        systemInstruction: isJsonRequest 
          ? "Je bent een data-extractor. Antwoord met uitsluitend JSON. Geen tekst eromheen."
          : "Je bent de Hoofdcurator van SculptuurRadar.",
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "";
    
    if (isJsonRequest) {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const startIdx = cleaned.indexOf('[');
      const endIdx = cleaned.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = cleaned.substring(startIdx, endIdx + 1);
        return { text: jsonStr, sources: [] };
      }
      return { text: "[]", sources: [] };
    }

    return { text: text.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { 
      text: isJsonRequest ? "[]" : "De AI-curator is momenteel niet bereikbaar.", 
      sources: [] 
    };
  }
}
