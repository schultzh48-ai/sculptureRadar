
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  // Gebruik de environment variable van Vercel
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.error("DEBUG: API_KEY is niet geconfigureerd in Vercel.");
    return { 
      text: "De AI-curator is momenteel offline. Controleer of de API_KEY correct is ingesteld in Vercel.", 
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
          ? "Je bent een data-assistent. Antwoord ALTIJD met uitsluitend een pure JSON array. Start direct met [ en eindig met ]."
          : "Je bent de Hoofdcurator van SculptuurRadar. Vertel een inspirerend verhaal in het Nederlands.",
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
        try {
          JSON.parse(jsonStr);
          const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Bron',
            uri: chunk.web?.uri || '#'
          })).filter((s: any) => s.uri !== '#') || [];
          return { text: jsonStr, sources };
        } catch (e) {
          console.error("JSON Parse error", e);
        }
      }
      return { text: "[]", sources: [] };
    }

    return { text: text.trim(), sources: [] };
  } catch (error: any) {
    console.error("Gemini Fout:", error);
    return { 
      text: isJsonRequest ? "[]" : "Er ging iets mis bij het ophalen van de data. Probeer het later opnieuw.", 
      sources: [] 
    };
  }
}
