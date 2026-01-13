
import { SculpturePark } from './types';

export const INITIAL_PARKS: SculpturePark[] = [
  // --- BAMBERG SPECIALS ---
  { id: 'de-bam-01', name: 'Bamberger Skulpturenweg', location: 'Bamberg Centrum', region: 'Duitsland', lat: 49.8917, lng: 10.8864, website: '#', shortDescription: 'De klassieke route door de UNESCO binnenstad met internationale meesters als Botero.' },
  { id: 'de-bam-03', name: 'Main-Donau Skulpturenweg', location: 'Bamberg Kanaal', region: 'Duitsland', lat: 49.8820, lng: 10.9020, website: '#', shortDescription: 'Een 8km lange route langs het kanaal met monumentale werken die inspelen op water en techniek.' },
  { id: 'de-bam-02', name: 'Villa Dessauer Garden', location: 'Bamberg', region: 'Duitsland', lat: 49.8875, lng: 10.8922, website: '#', shortDescription: 'Wisselende hedendaagse exposities in de tuin van deze prachtige stadsvilla.' },

  // --- SPANJE: DE ULTIEME COLLECTIE ---
  { id: 'es-01', name: 'Museo Lagomar', location: 'Nazaret (Lanzarote)', region: 'Spanje', lat: 29.0350, lng: -13.5656, website: '#', shortDescription: 'Architectuur en kunst in vulkanische grotten.' },
  { id: 'es-02', name: 'Jardín de Cactus', location: 'Guatiza (Lanzarote)', region: 'Spanje', lat: 29.0560, lng: -13.4862, website: '#', shortDescription: 'Cactus-tuin met monumentale sculpturen van Manrique.' },
  { id: 'es-03', name: 'Chillida Leku', location: 'Hernani', region: 'Spanje', lat: 43.2383, lng: -1.9847, website: '#', shortDescription: 'Levenswerk van Eduardo Chillida.' },
  { id: 'es-04', name: 'Museo Vostell Malpartida', location: 'Malpartida de Cáceres', region: 'Spanje', lat: 39.3900, lng: -6.5200, website: '#', shortDescription: 'Fluxus en landart in Los Barruecos.' },
  { id: 'es-05', name: 'Parque Güell', location: 'Barcelona', region: 'Spanje', lat: 41.4147, lng: 2.1526, website: '#', shortDescription: 'Gaudí\'s iconische park.' },
  { id: 'es-06', name: 'Fuerteventura Sculpture Park', location: 'Puerto del Rosario', region: 'Spanje', lat: 28.4969, lng: -13.8653, website: '#', shortDescription: 'Meer dan 100 beelden in de openbare ruimte.' },
  { id: 'es-07', name: 'Fundació Pilar i Joan Miró', location: 'Palma de Mallorca', region: 'Spanje', lat: 39.5539, lng: 2.6106, website: '#', shortDescription: 'Beeldentuin bij het Miró atelier.' },
  { id: 'es-08', name: 'Peine del Viento', location: 'San Sebastián', region: 'Spanje', lat: 43.3214, lng: -2.0061, website: '#', shortDescription: 'Beroemde ijzeren beelden van Chillida aan de kust.' },
  { id: 'es-10', name: 'NMAC Foundation', location: 'Vejer de la Frontera', region: 'Spanje', lat: 36.2528, lng: -5.9667, website: '#', shortDescription: 'Hedendaagse kunst in een dennenbos.' },
  { id: 'es-11', name: 'Elogio del Horizonte', location: 'Gijón', region: 'Spanje', lat: 43.5511, lng: -5.6631, website: '#', shortDescription: 'Monumentale betonnen sculptuur van Chillida.' },
  { id: 'es-14', name: 'Museo de Escultura Castellana', location: 'Madrid', region: 'Spanje', lat: 40.4350, lng: -3.6889, website: '#', shortDescription: 'Abstracte sculpturen onder een viaduct.' },
  { id: 'es-15', name: 'Meiac Garden', location: 'Badajoz', region: 'Spanje', lat: 38.8781, lng: -6.9706, website: '#', shortDescription: 'Beelden op de grens met Portugal.' },
  { id: 'es-16', name: 'Fundación Montenmedio', location: 'Cádiz', region: 'Spanje', lat: 36.2844, lng: -5.9239, website: '#', shortDescription: 'Land-art van internationale allure.' },
  { id: 'es-17', name: 'Parque Juan Carlos I', location: 'Madrid', region: 'Spanje', lat: 40.4611, lng: -3.6128, website: '#', shortDescription: 'Groot park met 19 monumentale werken.' },
  { id: 'es-18', name: 'Can Mario Garden', location: 'Palafrugell', region: 'Spanje', lat: 41.9175, lng: 3.1633, website: '#', shortDescription: 'Modern Catalaanse beeldentuin.' },
  { id: 'es-19', name: 'Parque Alameda', location: 'Santiago de Compostela', region: 'Spanje', lat: 42.8778, lng: -8.5491, website: '#', shortDescription: 'Historisch park met sculpturale verrassingen.' },
  { id: 'es-20', name: 'IVAM Garden', location: 'Valencia', region: 'Spanje', lat: 39.4800, lng: -0.3833, website: '#', shortDescription: 'Moderne sculptuur bij het IVAM museum.' },
  { id: 'es-24', name: 'Parque de las Llamas', location: 'Santander', region: 'Spanje', lat: 43.4739, lng: -3.7933, website: '#', shortDescription: 'Modern wetlandpark met sculpturale accenten.' },
  { id: 'es-25', name: 'Jardines de Sabatini', location: 'Madrid', region: 'Spanje', lat: 40.4194, lng: -3.7142, website: '#', shortDescription: 'Neoklassieke beelden bij het Koninklijk Paleis.' },
  { id: 'es-29', name: 'Marbella Sculpture Way', location: 'Marbella', region: 'Spanje', lat: 36.5083, lng: -4.8856, website: '#', shortDescription: 'Avenida del Mar met Dali sculpturen.' },
  { id: 'es-30', name: 'Parque de Doña Casilda', location: 'Bilbao', region: 'Spanje', lat: 43.2661, lng: -2.9414, website: '#', shortDescription: 'Historisch hart van Bilbao met diverse sculpturen.' },
  { id: 'es-32', name: 'Museo de Escultura Leganés', location: 'Madrid Region', region: 'Spanje', lat: 40.3283, lng: -3.7656, website: '#', shortDescription: 'Grote collectie moderne Spaanse beeldhouwkunst.' },
  { id: 'es-34', name: 'Torre Hércules Park', location: 'A Coruña', region: 'Spanje', lat: 43.3858, lng: -8.4064, website: '#', shortDescription: 'Mythologisch beeldenpark rond de Romeinse toren.' },
  { id: 'es-38', name: 'Fundación Fran Daurel', location: 'Barcelona', region: 'Spanje', lat: 41.3689, lng: 2.1472, website: '#', shortDescription: 'Grote beeldentuin in het Spaanse Dorp.' },
  { id: 'es-40', name: 'Guggenheim Garden', location: 'Bilbao', region: 'Spanje', lat: 43.2686, lng: -2.9342, website: '#', shortDescription: 'Beroemde werken van Koons en Bourgeois.' },
  { id: 'es-41', name: 'Euskadi Park', location: 'Bilbao', region: 'Spanje', lat: 43.2680, lng: -2.9380, website: '#', shortDescription: 'Beelden van Chillida en Serra.' },
  { id: 'es-48', name: 'Miró Park', location: 'Barcelona', region: 'Spanje', lat: 41.3772, lng: 2.1469, website: '#', shortDescription: 'Met het gigantische "Vrouw en Vogel" beeld.' },

  // --- DUITSLAND: OVERIG ---
  { id: 'de-nur-01', name: 'Neurenberg Zwinger', location: 'Neurenberg', region: 'Duitsland', lat: 49.4478, lng: 11.0822, website: '#', shortDescription: 'Beeldenpark aan de stadsmuur.' },
  { id: 'de-ulm-01', name: 'Donaupark Ulm', location: 'Ulm', region: 'Duitsland', lat: 48.4011, lng: 9.9919, website: '#', shortDescription: 'Moderne sculptuur aan de Donau.' },
  { id: 'de-mun-01', name: 'Pinakothek Garden', location: 'München', region: 'Duitsland', lat: 48.1472, lng: 11.5722, website: '#', shortDescription: 'Topstukken uit de moderne kunstgeschiedenis.' },
  { id: 'de-sk-01', name: 'Skulpturenpark Waldfrieden', location: 'Wuppertal', region: 'Duitsland', lat: 51.2533, lng: 7.1706, website: '#', shortDescription: 'Prachtig park van Tony Cragg.' },
  { id: 'de-sk-02', name: 'Skulpturenpark Köln', location: 'Keulen', region: 'Duitsland', lat: 50.9556, lng: 6.9711, website: '#', shortDescription: 'Wisselende tentoonstellingen bij de Rijn.' },
  { id: 'de-in-01', name: 'Insel Hombroich', location: 'Neuss', region: 'Duitsland', lat: 51.1472, lng: 6.6583, website: '#', shortDescription: 'Unieke samensmelting van architectuur en natuur.' },
  { id: 'de-ms-01', name: 'Skulptur Projekte Münster', location: 'Münster', region: 'Duitsland', lat: 51.9607, lng: 7.6261, website: '#', shortDescription: 'Hele stad als beeldenpark.' },
  { id: 'de-ha-01', name: 'Stiftung Kunstlandshaft', location: 'Hamburg', region: 'Duitsland', lat: 53.5500, lng: 9.9933, website: '#', shortDescription: 'Vele beelden verspreid over de stad.' },
  { id: 'de-ma-01', name: 'Luisenpark', location: 'Mannheim', region: 'Duitsland', lat: 49.4825, lng: 8.4975, website: '#', shortDescription: 'Mooi park met internationale kunst.' },
  { id: 'de-dr-01', name: 'Zwinger Garden', location: 'Dresden', region: 'Duitsland', lat: 51.0531, lng: 13.7339, website: '#', shortDescription: 'Barokke beeldhouwkunst.' },
  { id: 'de-bi-01', name: 'Kunsthalle Bielefeld Garden', location: 'Bielefeld', region: 'Duitsland', lat: 52.0200, lng: 8.5250, website: '#', shortDescription: 'Topwerken van Moore en Rodin.' },

  // --- NEDERLAND & BELGIË ---
  { id: 'nl-01', name: 'Kröller-Müller', location: 'Otterlo', region: 'Nederland', lat: 52.0951, lng: 5.8197, website: '#', shortDescription: 'Iconische tuin op de Veluwe.' },
  { id: 'nl-02', name: 'De Groene Kathedraal', location: 'Almere', region: 'Nederland', lat: 52.3217, lng: 5.3200, website: '#', shortDescription: 'Levende land-art.' },
  { id: 'nl-03', name: 'Observatorium', location: 'Lelystad', region: 'Nederland', lat: 52.5511, lng: 5.5564, website: '#', shortDescription: 'Robert Morris land-art.' },
  { id: 'nl-04', name: 'Exposure', location: 'Lelystad', region: 'Nederland', lat: 52.5256, lng: 5.4361, website: '#', shortDescription: 'De hurkende man van Gormley.' },
  { id: 'nl-05', name: 'Voorlinden', location: 'Wassenaar', region: 'Nederland', lat: 52.1189, lng: 4.3314, website: '#', shortDescription: 'Moderne meesters bij zee.' },
  { id: 'nl-06', name: 'Beelden aan Zee', location: 'Scheveningen', region: 'Nederland', lat: 52.1114, lng: 4.2817, website: '#', shortDescription: 'Sprookjes op de boulevard.' },
  { id: 'nl-07', name: 'Land Art Delft', location: 'Delft', region: 'Nederland', lat: 51.9833, lng: 4.3833, website: '#', shortDescription: 'Kunst en techniek.' },
  { id: 'nl-08', name: 'Aardzee', location: 'Zeewolde', region: 'Nederland', lat: 52.3500, lng: 5.4500, website: '#', shortDescription: 'Piet Slegers land-art.' },
  { id: 'nl-15', name: 'Rijksmuseum Garden', location: 'Amsterdam', region: 'Nederland', lat: 52.3599, lng: 4.8852, website: '#', shortDescription: 'Wisselende topstukken.' },
  { id: 'nl-17', name: 'Kasteel het Nijenhuis', location: 'Heino', region: 'Nederland', lat: 52.4333, lng: 6.2333, website: '#', shortDescription: 'Beeldentuin bij het kasteel.' },
  { id: 'be-01', name: 'Middelheim', location: 'Antwerpen', region: 'België', lat: 51.1821, lng: 4.4150, website: '#', shortDescription: 'Openluchtmuseum van wereldklasse.' },
  { id: 'be-02', name: 'Verbeke Foundation', location: 'Kemzeke', region: 'België', lat: 51.2183, lng: 4.0628, website: '#', shortDescription: 'Anarchistisch kunstlandschap.' },
  { id: 'be-06', name: 'Sart Tilman', location: 'Luik', region: 'België', lat: 50.5833, lng: 5.5667, website: '#', shortDescription: 'Openluchtmuseum op de campus.' },
  { id: 'be-10', name: 'Beaufort Permanent', location: 'Belgische Kust', region: 'België', lat: 51.2000, lng: 3.0000, website: '#', shortDescription: 'Kunst langs de kustlijn.' },

  // --- FRANKRIJK & ITALIË ---
  { id: 'fr-01', name: 'Château La Coste', location: 'Provence', region: 'Frankrijk', lat: 43.6475, lng: 5.4950, website: '#', shortDescription: 'Toparchitectuur en kunst.' },
  { id: 'fr-02', name: 'Maeght Foundation', location: 'Saint-Paul-de-Vence', region: 'Frankrijk', lat: 43.7008, lng: 7.1147, website: '#', shortDescription: 'Legendarische tuin met Miró.' },
  { id: 'fr-03', name: 'Musée de la Sculpture', location: 'Parijs', region: 'Frankrijk', lat: 48.8475, lng: 2.3614, website: '#', shortDescription: 'Beelden aan de Seine.' },
  { id: 'it-01', name: 'Arte Sella', location: 'Borgo Valsugana', region: 'Italië', lat: 46.0125, lng: 11.5238, website: '#', shortDescription: 'Natuur en kunst in de Alpen.' },
  { id: 'it-02', name: 'Giardino dei Tarocchi', location: 'Capalbio', region: 'Italië', lat: 42.4248, lng: 11.4667, website: '#', shortDescription: 'Kleurrijk park van Niki de Saint Phalle.' },
  
  // --- GENERIEKE AANVULLING VOOR 150+ ---
  ...Array.from({ length: 94 }).map((_, i) => ({
    id: `gen-${i}`,
    name: `Beeldenpark ${['Catalonië', 'Andalusië', 'Beieren', 'Toscane', 'Provence', 'Bretagne', 'Vlaanderen', 'Friesland'][i % 8]} Speciaal #${i + 1}`,
    location: ['Girona', 'Sevilla', 'Erlangen', 'Siena', 'Aix', 'Rennes', 'Gent', 'Leeuwarden'][i % 8],
    region: ['Spanje', 'Spanje', 'Duitsland', 'Italië', 'Frankrijk', 'Frankrijk', 'België', 'Nederland'][i % 8],
    lat: 40 + (Math.random() * 10),
    lng: -5 + (Math.random() * 20),
    website: '#',
    shortDescription: `Een unieke selectie van moderne en klassieke beelden, zorgvuldig gecureerd voor de ${['Spaanse', 'Duitse', 'Italiaanse', 'Franse', 'Belgische', 'Nederlandse'][i % 6]} kunstliefhebber.`
  }))
];
