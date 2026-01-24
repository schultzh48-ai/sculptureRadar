
/**
 * SculptuurRadar API Service
 * 
 * Communiceert met de Vercel Serverless Function in /api/sculptuur-radar.ts
 */

async function proxyRequest(endpoint: string, payload: any) {
  try {
    const response = await fetch('/api/sculptuur-radar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: endpoint,
        ...payload
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Serverfout: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`Frontend Service Error (${endpoint}):`, error.message);
    throw error;
  }
}

export async function getGeocode(query: string): Promise<{ lat: number, lng: number, name: string } | null> {
  try {
    return await proxyRequest('geocode', { query });
  } catch (err) {
    return null;
  }
}

export async function searchParksWithCurator(lat: number, lng: number, locationName: string) {
  try {
    const result = await proxyRequest('search-parks', { lat, lng, locationName });
    return result || { parks: [] };
  } catch (err) {
    return { parks: [] };
  }
}

export async function askArtistExpert(question: string) {
  try {
    const result = await proxyRequest('expert-advice', { question });
    return {
      text: result.text || "Geen antwoord beschikbaar.",
      sources: result.sources || []
    };
  } catch (err) {
    return { text: "De expert is momenteel niet bereikbaar via de beveiligde verbinding.", sources: [] };
  }
}

export async function getDeepDive(artworkName: string, location: string) {
  try {
    const result = await proxyRequest('deep-dive', { artworkName, location });
    return result.text || "";
  } catch (err) {
    return "Details konden niet worden geladen via de beveiligde server.";
  }
}
