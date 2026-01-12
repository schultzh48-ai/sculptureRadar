
import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- SPANJE (Regio Madrid) ---
  { 
    id: 'madrid-castellana', 
    name: 'Museo de Escultura al Aire Libre', 
    location: 'Madrid (Castellana)', 
    lat: 40.4333, lng: -3.6878, 
    website: 'https://www.madrid.es',
    shortDescription: 'Uniek museum onder de brug van Juan Bravo met topstukken van Eduardo Chillida en Joan Miró.',
    estimatedArtCount: 17
  },
  { 
    id: 'parque-juan-carlos-i', 
    name: 'Parque Juan Carlos I', 
    location: 'Madrid (Barajas)', 
    lat: 40.4611, lng: -3.6083, 
    website: 'https://www.madrid.es',
    shortDescription: 'Grootschalig modern park met 19 monumentale sculpturen van o.a. Mario Merz en Dani Karavan.',
    estimatedArtCount: 19
  },
  { 
    id: 'leganes-sculpture', 
    name: 'Museo de Escultura de Leganés', 
    location: 'Leganés (Madrid)', 
    lat: 40.3275, lng: -3.7636, 
    website: 'https://www.leganes.org',
    shortDescription: 'Een van de belangrijkste collecties Spaanse hedendaagse beeldhouwkunst in de buitenlucht.',
    estimatedArtCount: 60
  },
  { 
    id: 'bosc-verdura', 
    name: "Bosc d'en Verdura", 
    location: 'Las Rozas (Madrid)', 
    lat: 40.5144, lng: -3.8739, 
    website: '#',
    shortDescription: 'Een boeiende interactie tussen hedendaagse kunst en de typische mediterrane vegetatie.',
    isLandArt: true
  },
  { 
    id: 'huerta-frailes', 
    name: 'Huerta de los Frailes', 
    location: 'Carabaña (Madrid)', 
    lat: 40.2581, lng: -3.2458, 
    website: '#',
    shortDescription: 'Landbouwlandschap getransformeerd door sculpturen gemaakt van natuurlijke en lokale materialen.',
    isLandArt: true
  },

  // --- SPANJE (Catalonië & Omgeving) ---
  {
    id: 'arte-contemporary-rapita',
    name: 'Arte-Contemporary & Sculpture Park',
    location: 'La Ràpita (Montsià)',
    lat: 40.6191, lng: 0.5931,
    website: '#',
    shortDescription: 'Ruim 150 werken op 3 hectare mediterraan landschap; een oase van moderne kunst.',
    estimatedArtCount: 150
  },
  {
    id: 'can-ginebreda',
    name: 'Bosc de Can Ginebreda',
    location: 'Porqueres (Girona)',
    lat: 42.1386, lng: 2.7561,
    website: 'https://canginebreda.cat',
    shortDescription: 'Een provocerend en erotisch beeldenpark van kunstenaar Xicu Cabanyes midden in een bos.',
    estimatedArtCount: 100
  },
  {
    id: 'planta-sorigue',
    name: 'PLANTA - Fundació Sorigué',
    location: 'Balaguer (Lleida)',
    lat: 41.7903, lng: 0.8117,
    website: 'https://www.fundaciosorigue.com',
    shortDescription: 'Monumentale kunstprojecten en Land Art installaties op een indrukwekkend industrieel terrein.',
    isLandArt: true
  },

  // --- NOORWEGEN & ZWEDEN ---
  { 
    id: 'kistefos-jevnaker', 
    name: 'Kistefos Museum & Sculpture Park', 
    location: 'Jevnaker (bij Oslo)', 
    lat: 60.2227, lng: 10.3667, 
    website: 'https://www.kistefosmuseum.com',
    shortDescription: 'Beroemd om "The Twist" en topstukken van Anish Kapoor en Yayoi Kusama. Wereldtop.',
    estimatedArtCount: 46
  },
  { 
    id: 'vigeland-oslo', 
    name: 'Vigelandpark (Frognerparken)', 
    location: 'Oslo', 
    lat: 59.9270, lng: 10.7011, 
    website: 'https://vigeland.museum.no',
    shortDescription: 'Grootste beeldenpark ter wereld door één kunstenaar met meer dan 200 werken.',
    estimatedArtCount: 212
  },

  // --- FRANKRIJK (Provence) ---
  {
    id: 'chateau-la-coste',
    name: 'Château La Coste',
    location: 'Le Puy-Sainte-Réparade',
    lat: 43.6322, lng: 5.4147,
    website: 'https://chateau-la-coste.com',
    shortDescription: 'Wijnlandgoed met architectuur en kunst van Tadao Ando en Louise Bourgeois.',
    estimatedArtCount: 40
  },
  {
    id: 'fondation-maeght',
    name: 'Fondation Maeght',
    location: 'Saint-Paul-de-Vence',
    lat: 43.7008, lng: 7.1147,
    website: 'https://www.fondation-maeght.com',
    shortDescription: 'Iconisch Miró-labyrint en sculpturen van Giacometti in een mediterraan dennenbos.',
    estimatedArtCount: 80
  },

  // --- NEDERLAND ---
  { 
    id: 'kroller-muller', 
    name: 'Kröller-Müller Museum Beeldentuin', 
    location: 'Otterlo', 
    lat: 52.0952, lng: 5.8169, 
    website: 'https://krollermuller.nl',
    shortDescription: 'Een van de grootste en belangrijkste beeldentuinen van Europa, midden op de Veluwe.',
    estimatedArtCount: 160
  }
];
