
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { askGemini, getGeocode, getAddressFromCoords, getRegionIntro } from './services/gemini';
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
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return { parks: [] };
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return { parks: [] };
  }
}

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedLocationName, setResolvedLocationName] = useState('');
  const [aiParks, setAiParks] = useState<SculpturePark[]>([]);
  const [regionIntro, setRegionIntro] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIntro, setIsLoadingIntro] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchTerm('');
    setResolvedLocationName('');
    setAiParks([]);
    setRegionIntro('');
    setSearchCoordinates(null);
    setError(null);
    setSelectedPark(null);
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    if (!query && !coords) return;
    setHasSearched(true);
    setIsLoading(true);
    setIsLoadingIntro(true);
    setError(null);
    if (query) setResolvedLocationName(query);
    
    try {
      // Start Intro, Geocoding en Search parallel
      const introPromise = getRegionIntro(query || "deze regio");
      const geoPromise = coords ? Promise.resolve(coords) : getGeocode(query);
      const aiPromise = askGemini(query || `${coords?.lat},${coords?.lng}`);
      
      // Update intro zodra klaar
      introPromise.then(text => {
        setRegionIntro(text);
        setIsLoadingIntro(false);
      });

      const [geo, aiRes] = await Promise.all([geoPromise, aiPromise]);
      
      if (!geo) throw new Error("Locatie niet gevonden");
      setSearchCoordinates(geo);
      
      if (aiRes.text === "ERROR") throw new Error(aiRes.error);
      
      const data = robustParseJSON(aiRes.text);
      const raw = (Array.isArray(data.parks) ? data.parks : []).slice(0, 12);
      
      const mapped = raw.map((p: any) => ({
        id: `ai-${Math.random().toString(36).substr(2, 5)}`,
        name: p.name,
        location: p.location,
        shortDescription: p.shortDescription,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lng),
        isAiDiscovered: true,
        isLandArt: !!p.isLandArt,
        website: p.sourceUrl || '#',
        searchOrigin: geo
      })).filter(p => p.name && !isNaN(p.lat) && !isNaN(p.lng));

      setAiParks(mapped);
      
      if (!query && coords) {
        getAddressFromCoords(coords.lat, coords.lng).then(name => name && setResolvedLocationName(name));
      }
    } catch (e: any) {
      setError(e.message || "Fout bij laden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGPS = () => {
    setIsLocating(true);
    setError(null);
    setResolvedLocationName("Zoeken...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        await performSearch("", coords);
        setIsLocating(false);
      },
      () => {
        setError("GPS toegang geweigerd.");
        setIsLocating(false);
        setHasSearched(false);
      },
      { timeout: 5000 }
    );
  };

  const visibleParks = useMemo(() => {
    const all = [...INITIAL_PARKS, ...aiParks];
    if (!searchCoordinates) return [];
    return all.map(p => ({
      ...p,
      distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng),
      searchOrigin: searchCoordinates
    }))
    .filter(p => p.distance <= 200) 
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12);
  }, [aiParks, searchCoordinates]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900 text-sm">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-bullseye text-xs"></i>
            </div>
            <h1 className="text-xl font-black serif">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {hasSearched && (
            <button onClick={resetSearch} className="text-[9px] font-black uppercase text-stone-400 hover:text-blue-600 transition-colors">
              Nieuw
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {!hasSearched ? (
          <div className="py-12 text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-bold serif mb-8">Vind kunst in de <span className="text-blue-600 italic">natuur.</span></h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-stone-100">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-5 py-3 rounded-xl bg-stone-50 outline-none" 
                    placeholder="Stad of regio..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                  />
                  <button onClick={() => performSearch(searchTerm)} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] hover:bg-black transition-colors">
                    Scan
                  </button>
                </div>
              </div>
              <button onClick={handleGPS} disabled={isLocating} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-[2rem] shadow-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98]">
                <i className={`fas fa-location-crosshairs text-xl ${isLocating ? 'animate-spin' : ''}`}></i>
                <span className="text-lg font-bold">In de buurt</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b border-stone-100 pb-4">
              <p className="text-xl font-bold serif italic text-blue-600">{resolvedLocationName}</p>
            </div>

            {/* AI Regio Introductie */}
            {(isLoadingIntro || regionIntro) && (
              <div className="bg-stone-50 border border-stone-100 p-6 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <i className="fas fa-sparkles text-4xl"></i>
                </div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                  <i className="fas fa-wand-magic-sparkles text-blue-400"></i> AI Inzicht
                </h4>
                {isLoadingIntro ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                  </div>
                ) : (
                  <p className="text-stone-600 serif italic leading-relaxed text-base">
                    {regionIntro}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-6 bg-red-50 text-red-800 rounded-2xl flex items-center gap-4">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 bg-white rounded-3xl border border-stone-100 animate-pulse"></div>
                ))
              ) : (
                visibleParks.map(p => (
                  <ParkCard key={p.id} park={p} onClick={setSelectedPark} />
                ))
              )}
            </div>

            {!isLoading && visibleParks.length === 0 && !error && (
              <div className="py-16 text-center text-stone-500 italic">
                Geen parken gevonden in deze straal. Probeer een andere stad.
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
