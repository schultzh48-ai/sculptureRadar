
export interface SculpturePark {
  id: string;
  name: string;
  location: string;
  region?: string;
  shortDescription: string;
  website: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
