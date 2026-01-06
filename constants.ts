
import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- NEDERLAND ---
  { 
    id: 'kroller-muller', 
    name: 'Kröller-Müller Museum', 
    location: 'Otterlo', 
    lat: 52.0952, lng: 5.8169, 
    website: 'https://krollermuller.nl',
    shortDescription: 'Een van de grootste beeldentuinen van Europa, gelegen in Nationaal Park De Hoge Veluwe. Herbergt topstukken van Rodin, Moore en Dubuffet.'
  },
  { 
    id: 'beelden-aan-zee', 
    name: 'Museum Beelden aan Zee', 
    location: 'Scheveningen', 
    lat: 52.1118, lng: 4.2797, 
    website: 'https://www.beeldenaanzee.nl',
    shortDescription: 'Uniek museum in de duinen exclusief gewijd aan moderne en hedendaagse beeldhouwkunst, inclusief de beroemde "SprookjesBeelden aan Zee".'
  },
  { 
    id: 'voorlinden', 
    name: 'Museum Voorlinden', 
    location: 'Wassenaar', 
    lat: 52.1171, lng: 4.3321, 
    website: 'https://www.voorlinden.nl',
    shortDescription: 'Particulier museum voor moderne en hedendaagse kunst op een prachtig landgoed met wisselende sculpturen in de tuin.'
  },
  // --- BELGIË ---
  { 
    id: 'middelheim', 
    name: 'Middelheimmuseum', 
    location: 'Antwerpen', 
    lat: 51.1820, lng: 4.4121, 
    website: 'https://middelheimmuseum.be',
    shortDescription: 'Een uitgestrekt beeldenpark dat een overzicht biedt van meer dan honderd jaar beeldhouwkunst in een prachtig historisch parklandschap.'
  },
  // --- FRANKRIJK ---
  { 
    id: 'fondation-maeght', 
    name: 'Fondation Maeght', 
    location: 'Saint-Paul-de-Vence', 
    lat: 43.7006, lng: 7.1147, 
    website: 'https://www.fondation-maeght.com',
    shortDescription: 'Een wereldberoemd privémuseum in Zuid-Frankrijk met een unieke integratie van architectuur, natuur en kunst (Miró, Giacometti, Calder).'
  },
  { 
    id: 'la-defense', 
    name: 'Paris La Défense Art', 
    location: 'Parijs', 
    lat: 48.8919, lng: 2.2384, 
    website: 'https://parisladefense.com',
    shortDescription: 'Het grootste openluchtmuseum van Frankrijk, met meer dan 70 monumentale kunstwerken midden in het zakendistrict.'
  },
  // --- DUITSLAND ---
  { 
    id: 'hombroich', 
    name: 'Museum Insel Hombroich', 
    location: 'Neuss', 
    lat: 51.1478, lng: 6.6586, 
    website: 'https://www.inselhombroich.de',
    shortDescription: 'Een "open museum" waar kunst en natuur samenvloeien in een weidelandschap met minimalistische paviljoens en sculpturen.'
  },
  // --- VERENIGD KONINKRIJK ---
  { 
    id: 'yorkshire-sculpture', 
    name: 'Yorkshire Sculpture Park', 
    location: 'Wakefield', 
    lat: 53.6138, lng: -1.5701, 
    website: 'https://ysp.org.uk',
    shortDescription: 'Het leidende beeldenpark van het VK, met wisselende tentoonstellingen op een landgoed van 500 hectare, beroemd om de werken van Henry Moore.'
  },
  // --- ITALIË ---
  { 
    id: 'chianti-sculpture', 
    name: 'Chianti Sculpture Park', 
    location: 'Siena', 
    lat: 43.3888, lng: 11.3667, 
    website: 'https://www.chiantisculpturepark.it',
    shortDescription: 'Een permanente tentoonstelling van hedendaagse installaties en sculpturen, geïntegreerd in een magisch eikenbos in Toscane.'
  },
  // --- DENEMARKEN ---
  { 
    id: 'louisiana-museum', 
    name: 'Louisiana Museum of Modern Art', 
    location: 'Humlebæk', 
    lat: 55.9691, lng: 12.5441, 
    website: 'https://www.louisiana.dk',
    shortDescription: 'Wereldberoemd museum waar de beeldentuin met uitzicht over de Sont een essentieel onderdeel is van de ervaring.'
  },
  // --- SPANJE ---
  { 
    id: 'chillida-leku', 
    name: 'Chillida Leku', 
    location: 'Hernani', 
    lat: 43.2789, lng: -1.9991, 
    website: 'https://www.museochillidaleku.com',
    shortDescription: 'Het persoonlijke openluchtmuseum van Eduardo Chillida. Monumentale ijzeren en stalen beelden verspreid over een Baskisch landgoed.'
  }
];
