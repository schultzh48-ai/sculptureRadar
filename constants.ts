
import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- NEDERLAND ---
  { 
    id: 'kroller-muller', 
    name: 'Kröller-Müller Museum', 
    location: 'Otterlo', 
    lat: 52.0952, lng: 5.8169, 
    website: 'https://krollermuller.nl',
    shortDescription: 'Een van de grootste beeldentuinen van Europa. Een perfecte synthese van kunst, architectuur en natuur op de Veluwe.',
    estimatedArtCount: 160
  },
  { 
    id: 'observatorium', 
    name: 'Observatorium (Robert Morris)', 
    location: 'Lelystad', 
    lat: 52.5517, lng: 5.5562, 
    website: 'https://www.landartflevoland.nl',
    shortDescription: 'Iconisch Land Art project in Flevoland. Een modern megalithisch monument dat de zonnewendes markeert.',
    isLandArt: true,
    estimatedArtCount: 1
  },
  { 
    id: 'groene-kathedraal', 
    name: 'De Groene Kathedraal', 
    location: 'Almere', 
    lat: 52.3236, lng: 5.3189, 
    website: 'https://www.landartflevoland.nl',
    shortDescription: 'Een levend Land Art project van Marinus Boezem. De plattegrond van de kathedraal van Reims, gevormd door 178 populieren.',
    isLandArt: true,
    estimatedArtCount: 1
  },
  // --- SPANJE ---
  { 
    id: 'chillida-leku', 
    name: 'Chillida Leku', 
    location: 'Hernani', 
    lat: 43.2789, lng: -1.9991, 
    website: 'https://www.museochillidaleku.com',
    shortDescription: 'Het persoonlijke openluchtmuseum van Eduardo Chillida. Monumentale ijzeren beelden verspreid over een Baskisch landgoed.',
    estimatedArtCount: 40
  },
  { 
    id: 'nmiet-fundacion', 
    name: 'NMAC Foundation (Montenmedio)', 
    location: 'Vejer de la Frontera', 
    lat: 36.2555, lng: -5.9281, 
    website: 'https://fundacionnmac.org',
    shortDescription: 'Een uniek beeldenpark in een mediterraan pijnboombos. Hedendaagse kunstenaars creëren hier werken die reageren op de geschiedenis en natuur van de regio.',
    estimatedArtCount: 25
  },
  { 
    id: 'can-prunera', 
    name: 'Can Prunera Beeldentuin', 
    location: 'Sóller, Mallorca', 
    lat: 39.7667, lng: 2.7150, 
    website: 'https://canprunera.com',
    shortDescription: 'Moderne beelden in een prachtige tuin bij een Art Nouveau herenhuis.',
    estimatedArtCount: 12
  },
  { 
    id: 'los-barruecos', 
    name: 'Museo Vostell Malpartida', 
    location: 'Cáceres', 
    lat: 39.4239, lng: -6.5055, 
    website: 'https://museovostell.org',
    shortDescription: 'Fluxus kunst en Land Art in een spectaculair natuurgebied van granietblokken. Kunst die de grens tussen object en landschap opzoekt.',
    isLandArt: true,
    estimatedArtCount: 20
  },
  // --- BELGIË ---
  { 
    id: 'middelheim', 
    name: 'Middelheimmuseum', 
    location: 'Antwerpen', 
    lat: 51.1820, lng: 4.4121, 
    website: 'https://middelheimmuseum.be',
    shortDescription: 'Honderd jaar beeldhouwkunst in een historisch park.',
    estimatedArtCount: 200
  },
  // --- DUITSLAND ---
  { 
    id: 'hombroich', 
    name: 'Museum Insel Hombroich', 
    location: 'Neuss', 
    lat: 51.1478, lng: 6.6586, 
    website: 'https://www.inselhombroich.de',
    shortDescription: 'Kunst en natuur in een weidelandschap met minimalistische paviljoens.',
    estimatedArtCount: 50
  }
];
