
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { ArtistExpert } from './components/ArtistExpert';
import { getGeocode, searchParksWithCurator } from './services/gemini';
import { INITIAL_PARKS } from './constants';

const SEARCH_RADIUS_KM = 75; 
const DUPLICATE_THRESHOLD_KM = 1.0;

function getPreciseDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [allParks, setAllParks] = useState<SculpturePark[]>(INITIAL_PARKS);
  const [dbGrowth, setDbGrowth] = useState(0);
  
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchTerm('');
    setError(null);
    setSearchCoordinates(null);
    setResolvedLocation('');
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && !coords) return;
    
    setResolvedLocation('');
    setSearchCoordinates(null);
    setError(null);
    setHasSearched(true);
    setLoading(true);
    
    try {
      let lat: number, lng: number, name: string;
      
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        name = "Huidige Locatie";
      } else {
        const geo = await getGeocode(trimmedQuery);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          name = geo.name;
        } else {
          lat = 0; lng = 0;
          name = trimmedQuery;
        }
      }

      setSearchCoordinates({ lat, lng });
      setResolvedLocation(name);

      if (lat !== 0 && lng !== 0) {
        try {
          const result = await searchParksWithCurator(lat, lng, name);
          const newAiParks = (result.parks || []).map((p: any) => ({
            id: `ai-${Math.random().toString(36).substr(2, 9)}`,
            name: p.name,
            location: p.location,
            shortDescription: p.desc,
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng),
            isAiDiscovered: true,
            website: p.url || '#',
          })).filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng));

          setAllParks(prev => {
            const filteredNewParks = newAiParks.filter(aiP => {
              const isDuplicate = prev.some(existingP => 
                existingP.name.toLowerCase() === aiP.name.toLowerCase() ||
                getPreciseDistance(aiP.lat, aiP.lng, existingP.lat, existingP.lng) < DUPLICATE_THRESHOLD_KM
              );
              return !isDuplicate;
            });
            if (filteredNewParks.length > 0) {
              setDbGrowth(prevG => prevG + filteredNewParks.length);
            }
            return [...prev, ...filteredNewParks];
          });
        } catch (err) {
          console.warn("AI Search failed");
        }
      }
      setLoading(false);
    } catch (e: any) {
      setError("Fout bij laden.");
      setLoading(false);
    }
  }, []);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        performSearch("", { lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setError("GPS toegang geweigerd.");
        setIsLocating(false);
      }
    );
  };

  const searchResults = useMemo(() => {
    if (!hasSearched) return [];
    const query = searchTerm.toLowerCase().trim();
    const resolvedCity = resolvedLocation.toLowerCase().trim();

    return allParks.map(p => {
      const distance = searchCoordinates 
        ? getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng)
        : 9999;
      
      const textMatch = query.length > 0 && (
        p.name.toLowerCase().includes(query) || 
        p.location.toLowerCase().includes(query) || 
        (p.region && p.region.toLowerCase().includes(query))
      );
      const locationMatch = resolvedCity.length > 0 && (
        p.location.toLowerCase().includes(resolvedCity) ||
        (p.region && p.region.toLowerCase().includes(resolvedCity))
      );
      const nearbyMatch = distance <= SEARCH_RADIUS_KM;
      return { ...p, distance, isMatch: textMatch || locationMatch || nearbyMatch };
    })
    .filter(p => p.isMatch)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [allParks, searchCoordinates, searchTerm, resolvedLocation, hasSearched]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900 text-sm">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-landmark text-sm"></i>
            </div>
            <h1 className="text-xl font-black serif tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest block">Gids Omvang</span>
              <div className="text-[10px] font-bold text-stone-600 flex items-center gap-1 justify-end">
                <span>{allParks.length} Locaties</span>
                {dbGrowth > 0 && <span className="text-blue-500 animate-pulse">+{dbGrowth} AI</span>}
              </div>
            </div>
            {hasSearched && (
              <button onClick={resetSearch} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2">
                <i className="fas fa-rotate-left"></i> Nieuw
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        <div className={`${hasSearched ? 'py-8' : 'py-16'} text-center max-w-2xl mx-auto transition-all duration-700`}>
          {!hasSearched && (
            <div className="space-y-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold serif leading-tight tracking-tight">Vind kunst in de <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-8">vrije natuur.</span></h2>
              <p className="text-stone-500 text-lg serif italic">Zoek op stad, regio of land (Spanje, Duitsland, Bamberg, NL).</p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center group transition-all focus-within:ring-2 ring-blue-500/20 max-w-xl mx-auto">
              <input 
                className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent" 
                placeholder="Typ een plaatsnaam..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
              />
              <button 
                onClick={() => performSearch(searchTerm)} 
                disabled={loading}
                className="bg-stone-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Zoek'}
              </button>
            </div>
            {!hasSearched && (
              <button onClick={handleGPS} disabled={isLocating} className="text-stone-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto transition-all">
                <i className={`fas fa-location-arrow ${isLocating ? 'animate-bounce' : ''}`}></i> 
                {isLocating ? 'Bepalen...' : 'Gebruik mijn GPS'}
              </button>
            )}
            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
          </div>
        </div>

        {hasSearched && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div className="flex-1 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Resultaten voor</span>
                <p className="text-3xl font-bold serif text-stone-800 italic uppercase leading-none">{resolvedLocation || searchTerm}</p>
              </div>
              {loading && (
                <div className="flex items-center gap-3 text-blue-400">
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Curator doorzoekt archieven...</span>
                  <i className="fas fa-sparkles animate-spin text-xs"></i>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((p) => (
                <ParkCard 
                  key={p.id} 
                  park={p} 
                  // CRITICAL FIX: Geef de huidige zoek-coördinaten altijd mee als vertrekpunt
                  onClick={(parkData) => setSelectedPark({...parkData, searchOrigin: searchCoordinates})} 
                />
              ))}
            </div>

            {searchResults.length === 0 && !loading && (
              <div className="text-center py-20 bg-stone-50 rounded-[3rem] border border-dashed border-stone-200">
                <p className="text-stone-400 serif italic text-xl">Geen parken gevonden in deze straal.</p>
                <button onClick={resetSearch} className="mt-4 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Terug naar start</button>
              </div>
            )}
          </div>
        )}

        <ArtistExpert isVisible={hasSearched} />
      </main>
      
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
