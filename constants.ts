import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- NEDERLAND ---
  { 
    id: 'mannes-assen', 
    name: 'Mannes (Qubits)', 
    location: 'Assen (Stationsplein)', 
    lat: 52.9928, lng: 6.5683, 
    website: 'https://www.drenthe.nl',
    shortDescription: 'De zes meter hoge interactieve hond die reizigers in Assen verwelkomt. Mannes is gemaakt van accoya-hout en "ademt" stoom uit als er mensen in de buurt zijn.',
    isLandArt: true,
    estimatedArtCount: 1
  },
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
  // --- FRANKRIJK ---
  { 
    id: 'sanna-plensa-bordeaux', 
    name: 'Sanna (Jaume Plensa)', 
    location: 'Bordeaux (Place de la Comédie)', 
    lat: 44.8417, lng: -0.5741, 
    website: 'https://www.bordeaux.fr',
    shortDescription: 'Een zeven meter hoog gietijzeren gezicht van een jonge vrouw met gesloten ogen. Dit verstilde meesterwerk van Jaume Plensa staat tegenover het Grand Théâtre.',
    isLandArt: true,
    estimatedArtCount: 1
  },
  { 
    id: 'lion-bordeaux', 
    name: 'Le Lion de Veilhan', 
    location: 'Bordeaux (Place Stalingrad)', 
    lat: 44.8415, lng: -0.5631, 
    website: 'https://www.bordeaux.fr',
    shortDescription: 'De beroemde lichtblauwe, gefacetteerde leeuw van kunstenaar Xavier Veilhan. Een modern symbool van de stad.',
    isLandArt: true,
    estimatedArtCount: 1
  },
  // --- SPANJE ---
  { 
    id: 'julia-madrid', 
    name: 'Julia (Jaume Plensa)', 
    location: 'Madrid (Plaza de Colón)', 
    lat: 40.4253, lng: -3.6897, 
    website: 'https://www.madrid.es',
    shortDescription: 'Een monumentaal wit beeld van 12 meter hoog. Julia brengt een moment van rust in het drukke centrum van Madrid.',
    isLandArt: true,
    estimatedArtCount: 1
  },
  { 
    id: 'chillida-leku', 
    name: 'Chillida Leku', 
    location: 'Hernani', 
    lat: 43.2789, lng: -1.9991, 
    website: 'https://www.museochillidaleku.com',
    shortDescription: 'Het persoonlijke openluchtmuseum van Eduardo Chillida. Monumentale ijzeren beelden in een Baskisch landschap.',
    estimatedArtCount: 40
  },
  { 
    id: 'nmiet-fundacion', 
    name: 'NMAC Foundation (Montenmedio)', 
    location: 'Vejer de la Frontera', 
    lat: 36.2555, lng: -5.9281, 
    website: 'https://fundacionnmac.org',
    shortDescription: 'Een uniek beeldenpark in een mediterraan pijnboombos bij Cádiz.',
    estimatedArtCount: 25
  },
  { 
    id: 'madrid-aire-libre', 
    name: 'Museo de Escultura al Aire Libre', 
    location: 'Madrid', 
    lat: 40.4339, lng: -3.6883, 
    website: 'https://www.madrid.es',
    shortDescription: 'Abstracte sculpturen van o.a. Miró en Chillida in de openbare ruimte van Madrid.',
    estimatedArtCount: 17
  },
  // --- BELGIË ---
  { 
    id: 'middelheim', 
    name: 'Middelheimmuseum', 
    location: 'Antwerpen', 
    lat: 51.1820, lng: 4.4121, 
    website: 'https://middelheimmuseum.be',
    shortDescription: 'Honderd jaar beeldhouwkunst in een historisch park in het hart van Antwerpen.',
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