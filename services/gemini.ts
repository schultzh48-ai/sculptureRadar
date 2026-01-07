
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

export async function askGemini(prompt: string, history: ChatMessage[]) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("DEBUG: Gemini API Key is missing in process.env. Controleer Vercel Environment Variables.");
    return { text: "De curator is tijdelijk afwezig (API sleutel ontbreekt).", sources: [] };
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
          ? "Je bent een data-assistent. Antwoord ALTIJD met uitsluitend een pure JSON array. Geen Markdown, geen uitleg, geen 'json' backticks. Alleen [ { ... } ]."
          : "Je bent de Hoofdcurator van SculptuurRadar. Vertel een meeslepend verhaal in het Nederlands. Stop nooit halverwege een zin.",
        tools: [{ googleSearch: {} }]
      },
    });

    const text = response.text || "";
    
    if (isJsonRequest) {
      // Robuuste methode om JSON te vinden, zelfs als het model backticks gebruikt
      const cleanedJsonText = text.replace(/```json|```/g, "").trim();
      const startIdx = cleanedJsonText.indexOf('[');
      const endIdx = cleanedJsonText.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = cleanedJsonText.substring(startIdx, endIdx + 1);
        try {
          // Valideer of het echte JSON is
          JSON.parse(jsonStr);
          
          const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Bron',
            uri: chunk.web?.uri || '#'
          })).filter((s: any) => s.uri !== '#') || [];
          
          return { text: jsonStr, sources };
        } catch (e) {
          console.error("JSON Parse Error:", e);
        }
      }
      return { text: "[]", sources: [] };
    }

    return { text: text.trim(), sources: [] };
  } catch (error) {
    console.error("Gemini API Error details:", error);
    return { 
      text: isJsonRequest ? "[]" : "Het systeem ondervindt momenteel hinder bij het ophalen van live data. Onze excuses.", 
      sources: [] 
    };
  }
}
