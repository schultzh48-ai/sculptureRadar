
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { ArtistExpert } from './components/ArtistExpert';
import { getGeocode, searchParksWithCurator } from './services/gemini';
import { INITIAL_PARKS } from './constants';

const SEARCH_RADIUS_KM = 50; 
const DUPLICATE_THRESHOLD_KM = 1.0;

function getPreciseDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchTerm('');
    setError(null);
    setSearchCoordinates(null);
    setResolvedLocation('');
    setAllParks(INITIAL_PARKS);
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    const trimmed = query.trim();
    if (!trimmed && !coords) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let lat: number, lng: number, name: string;
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        name = "Mijn Locatie";
      } else {
        const geo = await getGeocode(trimmed);
        if (!geo) {
          setError(`Locatie "${trimmed}" niet gevonden. Probeer een grotere stad.`);
          setLoading(false);
          return;
        }
        lat = geo.lat;
        lng = geo.lng;
        name = geo.name;
      }

      setSearchCoordinates({ lat, lng });
      setResolvedLocation(name);

      const result = await searchParksWithCurator(lat, lng, name);
      if (result?.parks) {
        const newParks = result.parks.map((p: any) => ({
          id: `ai-${Math.random().toString(36).substr(2, 5)}`,
          name: p.name,
          location: p.location,
          shortDescription: p.desc,
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lng),
          isAiDiscovered: true,
          website: p.url || '#',
        })).filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng));

        setAllParks(prev => {
          const uniqueOnes = newParks.filter(nP => 
            !prev.some(eP => eP.name.toLowerCase() === nP.name.toLowerCase() || getPreciseDistance(nP.lat, nP.lng, eP.lat, eP.lng) < DUPLICATE_THRESHOLD_KM)
          );
          return [...prev, ...uniqueOnes];
        });
      }
    } catch (e: any) {
      setError(e.message || "Er ging iets mis bij het raadplegen van de beveiligde server.");
    } finally {
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
      () => setIsLocating(false)
    );
  };

  const searchResults = useMemo(() => {
    if (!hasSearched || !searchCoordinates) return [];
    return allParks
      .map(p => ({ ...p, distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng) }))
      .filter(p => p.distance <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);
  }, [allParks, searchCoordinates, hasSearched]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900 text-sm selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetSearch}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:bg-blue-600 transition-colors">
              <i className="fas fa-landmark text-sm"></i>
            </div>
            <h1 className="text-xl font-black serif tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {hasSearched && (
            <button onClick={resetSearch} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all px-5 py-2.5 bg-stone-50 rounded-full border border-stone-100">
              <i className="fas fa-rotate-left mr-2"></i> Nieuwe Zoekopdracht
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        <div className={`${hasSearched ? 'py-4' : 'py-20'} max-w-2xl mx-auto text-center transition-all duration-700`}>
          {!hasSearched && (
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h2 className="text-5xl md:text-7xl font-black serif leading-tight mb-6 tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar.</span></h2>
              <p className="text-stone-500 text-xl serif italic max-w-lg mx-auto leading-relaxed">Uw beveiligde gids naar de meest indrukwekkende beeldenparken van Europa.</p>
            </div>
          )}
          
          <div className="relative max-w-xl mx-auto space-y-4">
            <div className={`bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center transition-all focus-within:ring-4 ring-blue-500/10 ${hasSearched ? 'scale-90 opacity-90' : 'scale-100'}`}>
              <input 
                className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent placeholder:text-stone-300" 
                placeholder="Zoek een stad (bijv. Madrid of Arnhem)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
              />
              <button 
                onClick={() => performSearch(searchTerm)} 
                disabled={loading || !searchTerm.trim()}
                className="bg-stone-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs hover:bg-blue-600 transition-all disabled:opacity-30 shadow-lg shadow-stone-200"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Ontdek'}
              </button>
            </div>
            
            {!hasSearched && (
              <button onClick={handleGPS} disabled={isLocating || loading} className="text-stone-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto transition-all px-4 py-2 hover:bg-white rounded-full">
                <i className={`fas fa-location-arrow ${isLocating ? 'animate-bounce text-blue-500' : ''}`}></i> 
                {isLocating ? 'Lokaliseren...' : 'Gebruik huidige locatie'}
              </button>
            )}

            {error && <div className="mt-4 p-5 bg-red-50 text-red-700 border border-red-100 rounded-3xl text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">{error}</div>}
          </div>
        </div>

        {hasSearched && (
          <div className="mt-8 animate-in fade-in duration-700">
            <div className="flex items-end justify-between border-b border-stone-100 pb-6 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Gecureerde selectie rond</span>
                <p className="text-4xl font-bold serif text-stone-900 italic leading-none tracking-tight">{resolvedLocation || searchTerm}</p>
              </div>
              <div className="hidden sm:block text-[10px] font-black text-stone-300 uppercase tracking-widest">
                Straling 50km
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-[2rem] p-8 border border-stone-50 h-[280px] animate-pulse">
                    <div className="h-3 w-20 bg-stone-100 rounded mb-4"></div>
                    <div className="h-6 w-40 bg-stone-100 rounded mb-4"></div>
                    <div className="h-3 w-full bg-stone-50 rounded mb-2"></div>
                    <div className="h-3 w-4/5 bg-stone-50 rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((p) => (
                  <ParkCard key={p.id} park={p} onClick={(parkData) => setSelectedPark({...parkData, searchOrigin: searchCoordinates})} />
                ))}
              </div>
            )}

            {!loading && searchResults.length === 0 && (
              <div className="text-center py-24 bg-stone-50/50 rounded-[3rem] border border-dashed border-stone-200">
                <p className="text-stone-400 serif italic text-xl mb-4">Geen beeldenparken gevonden binnen 50km van deze locatie.</p>
                <button onClick={resetSearch} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Probeer een andere stad</button>
              </div>
            )}
          </div>
        )}

        {hasSearched && !loading && <ArtistExpert isVisible={true} />}
      </main>
      
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
      
      <footer className="max-w-7xl mx-auto p-12 text-center text-stone-300">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">SculptuurRadar &copy; 2024 — Beveiligde Curator</p>
      </footer>
    </div>
  );
};

export default App;
