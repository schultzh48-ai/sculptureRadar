
import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- SPANJE (Regio Madrid) ---
  { 
    id: 'madrid-castellana', 
    name: 'Museo de Escultura al Aire Libre', 
    location: 'Madrid (Castellana)', 
    region: 'Madrid',
    lat: 40.4333, lng: -3.6878, 
    website: 'https://www.madrid.es',
    shortDescription: 'Uniek museum onder de brug van Juan Bravo met topstukken van Eduardo Chillida en Joan Miró.',
    estimatedArtCount: 17
  },
  { 
    id: 'parque-juan-carlos-i', 
    name: 'Parque Juan Carlos I', 
    location: 'Madrid (Barajas)', 
    region: 'Madrid',
    lat: 40.4611, lng: -3.6083, 
    website: 'https://www.madrid.es',
    shortDescription: 'Grootschalig modern park met 19 monumentale sculpturen van o.a. Mario Merz en Dani Karavan.',
    estimatedArtCount: 19
  },
  { 
    id: 'bosc-verdura', 
    name: "Bosc d'en Verdura", 
    location: 'Las Rozas', 
    region: 'Madrid',
    lat: 40.5144, lng: -3.8739, 
    website: '#',
    shortDescription: 'Een boeiende interactie tussen hedendaagse kunst en de typische mediterrane vegetatie.',
    isLandArt: true
  },
  { 
    id: 'vostell-madrid', 
    name: 'Museo Vostell Malpartida (Invloed)', 
    location: 'Regio Madrid', 
    region: 'Madrid',
    lat: 40.4168, lng: -3.7038, 
    website: 'https://museovostell.org',
    shortDescription: 'Diverse Fluxus-installaties en conceptuele interventies van Wolf Vostell in de openbare ruimte.',
    isLandArt: true
  },
  { 
    id: 'valle-caidos', 
    name: 'El Valle de los Caídos', 
    location: 'San Lorenzo de El Escorial', 
    region: 'Madrid',
    lat: 40.6419, lng: -4.1333, 
    website: 'https://www.patrimonionacional.es',
    shortDescription: 'Controversieel maar monumentaal; herbergt de gigantische beelden van Juan de Ávalos.',
    estimatedArtCount: 8
  },
  { 
    id: 'leganes-sculpture', 
    name: 'Museo de Escultura al Aire Libre de Leganés', 
    location: 'Leganés', 
    region: 'Madrid',
    lat: 40.3275, lng: -3.7636, 
    website: 'https://www.leganes.org',
    shortDescription: 'Een van de grootste collecties Spaanse hedendaagse beeldhouwkunst, met focus op Pablo Serrano.',
    estimatedArtCount: 60
  },
  { 
    id: 'anesiff-torrelodones', 
    name: 'Bosque de Esculturas (Fundación Anesiff)', 
    location: 'Torrelodones', 
    region: 'Madrid',
    lat: 40.5767, lng: -3.9292, 
    website: '#',
    shortDescription: 'Sculpturenroute verscholen in een prachtig landschap van graniet en eikenbomen.',
    isLandArt: true
  },
  { 
    id: 'via-plata-avila', 
    name: 'Vía de la Plata Sculpture Trail', 
    location: 'Omgeving Ávila', 
    region: 'Castilla y León',
    lat: 40.6567, lng: -4.7002, 
    website: '#',
    shortDescription: 'Moderne sculpturen langs de historische Romeinse route; een dialoog tussen historie en kunst.',
    isLandArt: true
  },
  { 
    id: 'ca2m-mostoles', 
    name: 'Centro de Arte Dos de Mayo (CA2M)', 
    location: 'Móstoles', 
    region: 'Madrid',
    lat: 40.3236, lng: -3.8644, 
    website: 'https://ca2m.org',
    shortDescription: 'Hedendaagse installaties en beelden op het dakterras en in de buitenruimtes van dit moderne kunstcentrum.',
    estimatedArtCount: 10
  },
  { 
    id: 'genalguacil-satellites', 
    name: 'Genalguacil (Madrid Satellites)', 
    location: 'Regio Madrid', 
    region: 'Madrid',
    lat: 40.4500, lng: -3.7500, 
    website: 'https://www.genalguacil.es',
    shortDescription: 'Tijdelijke en permanente land-art interventies op het platteland rondom de hoofdstad.',
    isLandArt: true
  },
  { 
    id: 'escorial-tuinen', 
    name: 'El Escorial Tuinen', 
    location: 'San Lorenzo de El Escorial', 
    region: 'Madrid',
    lat: 40.5892, lng: -4.1477, 
    website: 'https://www.patrimonionacional.es',
    shortDescription: 'Klassieke renaissance beeldhouwkunst naadloos geïntegreerd in geometrische tuinen.',
    estimatedArtCount: 25
  },
  { 
    id: 'castillos-alcorcon', 
    name: 'Parque de los Castillos', 
    location: 'Alcorcón', 
    region: 'Madrid',
    lat: 40.3419, lng: -3.8203, 
    website: 'https://www.ayto-alcorcon.es',
    shortDescription: 'Openlucht collectie met een sterke focus op monumentale stalen beelden en geometrische vormen.',
    estimatedArtCount: 12
  },
  { 
    id: 'huerta-frailes', 
    name: 'Huerta de los Frailes', 
    location: 'Carabaña', 
    region: 'Madrid',
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
    region: 'Catalonië',
    lat: 40.6191, lng: 0.5931,
    website: '#',
    shortDescription: 'Ruim 150 werken op 3 hectare mediterraan landschap; een oase van moderne kunst.',
    estimatedArtCount: 150
  },
  {
    id: 'solo-sculpture-trail',
    name: 'Solo Sculpture Trail',
    location: 'Matarraña',
    region: 'Aragón',
    lat: 40.9221, lng: 0.2031,
    website: '#',
    shortDescription: 'Wandelroute van 3km met meer dan 20 internationale sculpturen in een wild natuurgebied.',
    isLandArt: true,
    estimatedArtCount: 20
  },
  {
    id: 'art-parc-colera',
    name: 'Art Parc',
    location: 'Colera (Girona)',
    region: 'Catalonië',
    lat: 42.4042, lng: 3.1517,
    website: '#',
    shortDescription: 'Prachtig gelegen sculpturenpark met panoramisch uitzicht over de Middellandse Zee.',
    estimatedArtCount: 15
  },
  {
    id: 'planta-sorigue',
    name: 'PLANTA - Fundació Sorigué',
    location: 'Balaguer (Lleida)',
    region: 'Catalonië',
    lat: 41.7903, lng: 0.8117,
    website: 'https://www.fundaciosorigue.com',
    shortDescription: 'Monumentale kunstprojecten en Land Art installaties op een indrukwekkend industrieel terrein.',
    isLandArt: true
  },
  {
    id: 'jardins-artigas',
    name: 'Jardins Artigas',
    location: 'La Pobla de Lillet',
    region: 'Catalonië',
    lat: 42.2428, lng: 1.9753,
    website: '#',
    shortDescription: 'Door Antoni Gaudí ontworpen tuin die volledig opgaat in de omringende natuur en het water.',
    estimatedArtCount: 10
  },
  {
    id: 'mas-miro',
    name: 'Fundació Mas Miró',
    location: 'Mont-roig del Camp',
    region: 'Catalonië',
    lat: 41.0544, lng: 0.9575,
    website: 'https://masmiro.com',
    shortDescription: 'Het landschap en de boerderij die de directe basis vormden voor het universum van Joan Miró.',
    isLandArt: true
  },
  {
    id: 'park-guell',
    name: 'Park Güell',
    location: 'Barcelona',
    region: 'Catalonië',
    lat: 41.4144, lng: 2.1527,
    website: 'https://parkguell.barcelona',
    shortDescription: 'UNESCO Werelderfgoed waar de organische architectuur van Gaudí en sculpturale elementen versmelten.',
    estimatedArtCount: 30
  },
  {
    id: 'can-ginebreda',
    name: 'Bosc de Can Ginebreda',
    location: 'Porqueres (Girona)',
    region: 'Catalonië',
    lat: 42.1386, lng: 2.7561,
    website: 'https://canginebreda.cat',
    shortDescription: 'Een provocerend en erotisch beeldenpark van kunstenaar Xicu Cabanyes midden in een dicht bos.',
    estimatedArtCount: 100
  },
  {
    id: 'joan-miro-park',
    name: 'Parc de Joan Miró',
    location: 'Barcelona',
    region: 'Catalonië',
    lat: 41.3781, lng: 2.1483,
    website: '#',
    shortDescription: 'Groot stadspark gedomineerd door het iconische, kleurrijke beeld "Dona i Ocell" van Joan Miró.',
    estimatedArtCount: 1
  },
  {
    id: 'espanya-industrial',
    name: "Parc de l'Espanya Industrial",
    location: 'Barcelona',
    region: 'Catalonië',
    lat: 41.3775, lng: 2.1417,
    website: '#',
    shortDescription: 'Post-industrieel park met monumentale ijzeren sculpturen en de beroemde reuzendraak.',
    estimatedArtCount: 8
  },
  {
    id: 'parc-sama',
    name: 'Parc Samà',
    location: 'Cambrils',
    region: 'Catalonië',
    lat: 41.1044, lng: 1.0211,
    website: 'https://parcsama.es',
    shortDescription: 'Historische romantische tuin met grotten, meren en sculpturale elementen uit de 19e eeuw.',
    estimatedArtCount: 15
  },

  // --- FRANKRIJK (Provence & Zuid-Frankrijk) ---
  {
    id: 'chateau-la-coste',
    name: 'Château La Coste',
    location: 'Le Puy-Sainte-Réparade',
    region: 'Provence',
    lat: 43.6322, lng: 5.4147,
    website: 'https://chateau-la-coste.com',
    shortDescription: '500 hectare wijnlandgoed met werken van Tadao Ando en Louise Bourgeois.',
    estimatedArtCount: 40
  },
  {
    id: 'fondation-maeght',
    name: 'Fondation Maeght',
    location: 'Saint-Paul-de-Vence',
    region: 'Provence',
    lat: 43.7008, lng: 7.1147,
    website: 'https://www.fondation-maeght.com',
    shortDescription: 'Iconisch Miró-labyrint en sculpturen van Giacometti.',
    estimatedArtCount: 80
  },
  {
    id: 'villa-carmignac',
    name: 'Villa Carmignac',
    location: 'Ile de Porquerolles',
    region: 'Provence',
    lat: 43.0011, lng: 6.2017,
    website: 'https://www.fondationcarmignac.com',
    shortDescription: 'Blotevoetentour; nieuwe expo SEA POP & SUN vanaf april 2026.',
    estimatedArtCount: 20
  },
  {
    id: 'peyrassol',
    name: 'Commanderie de Peyrassol',
    location: 'Flassans-sur-Issole',
    region: 'Provence',
    lat: 43.3764, lng: 6.2239,
    website: 'https://www.peyrassol.com',
    shortDescription: '75+ monumentale werken van o.a. Bernar Venet en Dan Graham.',
    estimatedArtCount: 75
  },
  {
    id: 'venet-foundation',
    name: 'Venet Foundation',
    location: 'Le Muy',
    region: 'Provence',
    lat: 43.4667, lng: 6.5667,
    website: 'https://www.venetfoundation.org',
    shortDescription: 'Exclusieve collectie minimalistische kunst (reservering verplicht).',
    estimatedArtCount: 35
  },
  {
    id: 'domaine-du-muy',
    name: 'Domaine du Muy',
    location: 'Le Muy',
    region: 'Provence',
    lat: 43.4722, lng: 6.5583,
    website: 'http://www.domainedumuy.com',
    shortDescription: '20+ hedendaagse werken in een ongerept Provençaals landschap.',
    estimatedArtCount: 20
  },
  {
    id: 'cairn-art',
    name: 'CAIRN Centre d\'Art',
    location: 'Digne-les-Bains',
    region: 'Provence',
    lat: 44.0919, lng: 6.2308,
    website: 'https://www.cairn-art.org',
    shortDescription: 'Startpunt voor Goldsworthy\'s Refuge d\'Art wandelroute.',
    isLandArt: true
  },
  {
    id: 'chateau-bosc',
    name: 'Château de Bosc',
    location: 'Domazan',
    region: 'Provence',
    lat: 43.9317, lng: 4.6511,
    website: 'https://www.chateau-de-bosc.com',
    shortDescription: 'Combinatie van moderne kunst en een oldtimer/fietsmuseum.',
    estimatedArtCount: 15
  },
  {
    id: 'fondation-cab',
    name: 'Fondation CAB',
    location: 'Saint-Paul-de-Vence',
    region: 'Provence',
    lat: 43.6967, lng: 7.1211,
    website: 'https://www.fondationcab.com',
    shortDescription: 'Minimalistische kunst in een gerenoveerde jaren \'50 galerie.',
    estimatedArtCount: 12
  },
  {
    id: 'la-ribaute-kiefer',
    name: 'La Ribaute (Eschaton)',
    location: 'Barjac',
    region: 'Provence',
    lat: 44.3083, lng: 4.3472,
    website: 'https://eschaton-foundation.org',
    shortDescription: 'Monumentale studio-site van Anselm Kiefer (zeer beperkt open).',
    isLandArt: true
  },
  {
    id: 'napoule-garden',
    name: 'Château de la Napoule',
    location: 'Mandelieu-la-Napoule',
    region: 'Provence',
    lat: 43.5242, lng: 6.9422,
    website: 'https://www.chateau-lanapoule.com',
    shortDescription: 'Historische tuinen met eigenzinnige sculpturen aan de kust.',
    estimatedArtCount: 25
  },
  {
    id: 'villa-datris',
    name: 'Fondation Villa Datris',
    location: 'L\'Isle-sur-la-Sorgue',
    region: 'Provence',
    lat: 43.9189, lng: 5.0514,
    website: 'https://fondationvilladatris.com',
    shortDescription: 'Wisselende jaarlijkse exposities van moderne beeldhouwkunst.',
    estimatedArtCount: 30
  },
  {
    id: 'luma-arles',
    name: 'LUMA Arles',
    location: 'Arles',
    region: 'Provence',
    lat: 43.6739, lng: 4.6358,
    website: 'https://www.luma.org',
    shortDescription: 'Park rondom de Gehry-toren met wisselende installaties.',
    isLandArt: true
  },
  {
    id: 'arboretum-no-made',
    name: 'Arboretum Marcel Kroënlein',
    location: 'Roure',
    region: 'Provence',
    lat: 44.0894, lng: 7.0864,
    website: 'http://www.arboretum-roure.org',
    shortDescription: 'Hooggelegen No-made kunst in de bergen (Alps-Maritimes).',
    isLandArt: true
  },
  {
    id: 'fayence-sculptures',
    name: 'Le Jardin des Sculptures',
    location: 'Fayence',
    region: 'Provence',
    lat: 43.6231, lng: 6.6953,
    website: '#',
    shortDescription: 'Kleinschalige tuin met poëtische bronzen en stenen beelden.',
    estimatedArtCount: 15
  },
  {
    id: 'chateauvert-art',
    name: 'Centre d\'Art de Châteauvert',
    location: 'Châteauvert',
    region: 'Provence',
    lat: 43.5003, lng: 6.0267,
    website: '#',
    shortDescription: 'Beeldentuin langs de rivier de Argens in de Provence Verte.',
    estimatedArtCount: 20
  },
  {
    id: 'bastide-rose',
    name: 'Bastide Rose',
    location: 'Le Thor',
    region: 'Provence',
    lat: 43.9311, lng: 4.9917,
    website: 'https://www.bastiderose.com',
    shortDescription: 'Sculpturen rond een historisch landhuis aan het water.',
    estimatedArtCount: 18
  },
  {
    id: 'scenotaphe-oxygene',
    name: 'Scénotaphe de l\'Oxygène',
    location: 'Saint-Rémy-de-Provence',
    region: 'Provence',
    lat: 43.7886, lng: 4.8314,
    website: '#',
    shortDescription: 'Uniek monumentaal object geïntegreerd in het landschap.',
    isLandArt: true
  },
  {
    id: 'maca-var',
    name: 'Musée à Ciel Ouvert (MACA)',
    location: 'Verschillende locaties',
    region: 'Provence',
    lat: 43.4000, lng: 6.3000,
    website: '#',
    shortDescription: 'Route van openluchtinstallaties in de regio Var.',
    isLandArt: true
  },

  // --- DUITSLAND ---
  { 
    id: 'bamberg-sculpture-trail', 
    name: 'Trail of Modern Sculptures', 
    location: 'Bamberg', 
    region: 'Beieren',
    lat: 49.8916, lng: 10.8916, 
    website: 'https://www.bamberg.info',
    shortDescription: 'Een indrukwekkende route door de UNESCO-stad Bamberg met topstukken van Botero, Igor Mitoraj en Jaume Plensa.',
    estimatedArtCount: 15
  },
  { 
    id: 'flussparadies-franken', 
    name: 'Flussparadies Franken', 
    location: 'Bamberg & Regio', 
    region: 'Beieren',
    lat: 49.8987, lng: 10.8907, 
    website: 'https://www.flussparadies-franken.de',
    shortDescription: 'Een uniek project waarbij kunst, natuur en water samenkomen langs de rivieren de Main en de Regnitz.',
    isLandArt: true
  },

  // --- NEDERLAND ---
  { 
    id: 'kroller-muller', 
    name: 'Kröller-Müller Museum Beeldentuin', 
    location: 'Otterlo', 
    lat: 52.0952, lng: 5.8169, 
    website: 'https://krollermuller.nl',
    shortDescription: 'Topstukken van Dubuffet, Rodin en Moore op de Veluwe; een van de grootste parken van Europa.',
    estimatedArtCount: 160
  }
];
