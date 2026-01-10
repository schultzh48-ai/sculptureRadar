
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { askGemini, getGeocode, getAddressFromCoords } from './services/gemini';
import { INITIAL_PARKS } from './constants';

function getPreciseDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function robustParseJSON(text: string) {
  if (!text) throw new Error("Geen data ontvangen");
  let cleaned = text.trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error("Ongeldige data structuur");
  return JSON.parse(cleaned.substring(start, end + 1));
}

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedLocationName, setResolvedLocationName] = useState('');
  const [aiParks, setAiParks] = useState<SculpturePark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchTerm('');
    setResolvedLocationName('');
    setAiParks([]);
    setSearchCoordinates(null);
    setError(null);
    setSelectedPark(null);
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    if (!query && !coords) return;

    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    
    try {
      let geo = coords;
      if (!geo) {
        geo = await getGeocode(query);
      }
      
      if (!geo) throw new Error("Locatie niet gevonden. Probeer een andere stad.");
      setSearchCoordinates(geo);

      // Toon tijdelijk coördinaten als er geen tekst-query is (bij GPS)
      if (!query && coords) {
        setResolvedLocationName(`${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`);
      } else {
        setResolvedLocationName(query);
      }

      // Haal de super-specifieke locatienaam op (bijv Odijk ipv Zeist)
      const locationName = await getAddressFromCoords(geo.lat, geo.lng);
      if (locationName) {
        setResolvedLocationName(locationName);
      }

      const searchContext = locationName || query || `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`;
      const res = await askGemini(searchContext);
      
      if (res.text === "ERROR") throw new Error(res.error);

      const data = robustParseJSON(res.text);
      const raw = Array.isArray(data.parks) ? data.parks : [];
      
      const mapped = raw.map((p: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 5)}`,
        name: p.name,
        location: p.location,
        shortDescription: p.shortDescription,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lng),
        isAiDiscovered: true,
        website: p.sourceUrl || '#',
        searchOrigin: geo
      })).filter(p => p.name && !isNaN(p.lat) && !isNaN(p.lng));

      setAiParks(mapped);
    } catch (e: any) {
      setError(e.message || "Er ging iets mis bij het scannen.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGPS = () => {
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        await performSearch("", coords);
        setIsLocating(false);
      },
      () => {
        setError("GPS toegang geweigerd.");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const visibleParks = useMemo(() => {
    const all = [...INITIAL_PARKS, ...aiParks];
    if (!searchCoordinates) return [];
    return all.map(p => ({
      ...p,
      distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng)
    }))
    .filter(p => p.distance <= 55)
    .sort((a, b) => a.distance - b.distance);
  }, [aiParks, searchCoordinates]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-bullseye"></i>
            </div>
            <h1 className="text-2xl font-black serif">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {hasSearched && (
            <button 
              onClick={resetSearch} 
              className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 px-4 py-2 hover:bg-stone-50 rounded-lg transition-all"
            >
              Nieuwe Zoekopdracht
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {!hasSearched ? (
          <div className="py-20 text-center max-w-2xl mx-auto">
            <h2 className="text-5xl font-bold serif mb-12 leading-tight">Vind kunst in de <span className="text-blue-600 italic">open lucht.</span></h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4 text-left px-4">Optie 1: Zoek op stad</p>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-6 py-4 rounded-2xl bg-stone-50 border-none outline-none text-lg" 
                    placeholder="Bijv. Madrid, Arnhem, Parijs..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                  />
                  <button 
                    onClick={() => performSearch(searchTerm)} 
                    className="bg-stone-900 text-white px-8 rounded-2xl font-black uppercase text-xs hover:bg-black transition-colors"
                  >
                    Scan Stad
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-stone-200"></div>
                <span className="text-[10px] font-bold text-stone-300 uppercase">Of</span>
                <div className="flex-1 h-px bg-stone-200"></div>
              </div>

              <button 
                onClick={handleGPS}
                disabled={isLocating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 flex items-center justify-center gap-4 group transition-all active:scale-[0.98]"
              >
                <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl ${isLocating ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                  <i className="fas fa-location-crosshairs"></i>
                </div>
                <div className="text-left">
                  <p className="font-black uppercase tracking-widest text-xs opacity-80">Optie 2</p>
                  <p className="text-xl font-bold">Zoek op mijn GPS locatie</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div>
                <h3 className="text-stone-400 font-black text-[10px] uppercase tracking-widest mb-1">Resultaten</h3>
                <p className="text-2xl font-bold serif">Binnen 50 km van <span className="text-blue-600 italic">{resolvedLocationName || 'uw locatie'}</span></p>
              </div>
              <button 
                onClick={resetSearch} 
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-bold uppercase transition-colors"
              >
                Aanpassen
              </button>
            </div>

            {error && (
              <div className="p-6 bg-red-50 border border-red-100 text-red-800 rounded-3xl text-sm font-medium flex items-center gap-4">
                <i className="fas fa-exclamation-triangle text-xl text-red-400"></i>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-[2rem] border border-stone-100 animate-pulse flex flex-col p-6 gap-4">
                    <div className="w-20 h-4 bg-stone-100 rounded"></div>
                    <div className="w-full h-8 bg-stone-100 rounded"></div>
                    <div className="w-full h-20 bg-stone-100 rounded"></div>
                  </div>
                ))
              ) : (
                visibleParks.map(p => (
                  <ParkCard key={p.id} park={p} onClick={setSelectedPark} />
                ))
              )}
            </div>

            {!isLoading && visibleParks.length === 0 && !error && (
              <div className="py-20 text-center bg-stone-50 rounded-[3rem] border border-dashed border-stone-200">
                <i className="fas fa-map-marked-alt text-4xl text-stone-200 mb-4"></i>
                <p className="text-stone-400 serif text-xl italic mb-2">Geen parken gevonden binnen 50km van {resolvedLocationName}.</p>
                <button onClick={resetSearch} className="text-blue-600 font-bold text-xs uppercase underline">Probeer een andere plek</button>
              </div>
            )}
          </div>
        )}
      </main>
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
