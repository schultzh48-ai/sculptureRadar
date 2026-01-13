
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
    setResolvedLocation('');
    setHasSearched(true);
    setAllParks(INITIAL_PARKS);

    try {
      let lat: number, lng: number, name: string;

      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        name = "Mijn Locatie";
      } else {
        const geo = await getGeocode(trimmed);
        if (!geo || !geo.lat || !geo.lng) {
          setError(`Locatie "${trimmed}" niet gevonden. Probeer een bekendere plaatsnaam.`);
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
      if (result && result.parks && result.parks.length > 0) {
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
            !prev.some(eP => 
              eP.name.toLowerCase() === nP.name.toLowerCase() || 
              getPreciseDistance(nP.lat, nP.lng, eP.lat, eP.lng) < DUPLICATE_THRESHOLD_KM
            )
          );
          return [...prev, ...uniqueOnes];
        });
      }
    } catch (e) {
      setError("Verbindingsfout. Probeer het over een moment opnieuw.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError("Je browser ondersteunt geen locatiebepaling.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        performSearch("", { lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error(err);
        setError("Geen toegang tot je locatie. Controleer je privacyinstellingen.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const searchResults = useMemo(() => {
    if (!hasSearched || !searchCoordinates) return [];

    return allParks
      .map(p => ({
        ...p,
        distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng)
      }))
      .filter(p => p.distance <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance);
  }, [allParks, searchCoordinates, hasSearched]);

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
            {hasSearched && (
              <button 
                onClick={resetSearch} 
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100"
              >
                <i className="fas fa-rotate-left"></i> Nieuwe Zoekopdracht
              </button>
            )}
            <div className="hidden sm:block text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              50 KM Straal
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24 text-center">
        <div className={`${hasSearched ? 'py-4' : 'py-20'} max-w-2xl mx-auto transition-all duration-500`}>
          {!hasSearched && (
            <div className="mb-10 animate-in fade-in duration-1000">
              <h2 className="text-5xl md:text-6xl font-black serif leading-tight mb-4 tracking-tight">Beeldenparken in <span className="text-blue-600 italic">Spanje & Europa.</span></h2>
              <p className="text-stone-500 text-lg serif italic">Zoek op plaatsnaam. Stabiele resultaten binnen 50km.</p>
            </div>
          )}
          
          <div className="relative max-w-xl mx-auto space-y-4">
            <div className={`bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center transition-all focus-within:ring-4 ring-blue-500/10 ${hasSearched ? 'scale-90 opacity-90' : 'scale-100'}`}>
              <input 
                className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent" 
                placeholder="Typ een stad..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
              />
              <button 
                onClick={() => performSearch(searchTerm)} 
                disabled={loading || !searchTerm.trim()}
                className="bg-stone-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs hover:bg-blue-600 transition-all disabled:opacity-30"
              >
                {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Zoek'}
              </button>
            </div>
            
            {!hasSearched && (
              <button 
                onClick={handleGPS} 
                disabled={isLocating || loading}
                className="text-stone-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto transition-all px-4 py-2 hover:bg-white rounded-full"
              >
                <i className={`fas fa-location-arrow ${isLocating ? 'animate-bounce text-blue-500' : ''}`}></i> 
                {isLocating ? 'Lokaliseren...' : 'Zoek op mijn huidige locatie'}
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-widest animate-in fade-in">
                {error}
              </div>
            )}
          </div>
        </div>

        {hasSearched && !error && (
          <div className="animate-in fade-in duration-500 mt-8 text-left">
            <div className="flex items-end justify-between border-b border-stone-100 pb-6 mb-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">
                  {loading ? 'Bezig met zoeken...' : `${searchResults.length} ${searchResults.length === 1 ? 'locatie' : 'locaties'} gevonden rond`}
                </span>
                <p className="text-4xl font-bold serif text-stone-900 italic leading-none">{resolvedLocation || searchTerm}</p>
              </div>
              {!loading && (
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pb-1">
                  Strikte straal: 50km
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((p) => (
                <ParkCard 
                  key={p.id} 
                  park={p} 
                  onClick={(parkData) => setSelectedPark({...parkData, searchOrigin: searchCoordinates})} 
                />
              ))}
            </div>

            {!loading && searchResults.length === 0 && (
              <div className="text-center py-24 bg-stone-50 rounded-[3rem] border border-dashed border-stone-200">
                <i className="fas fa-map-location-dot text-3xl text-stone-200 mb-4 block"></i>
                <p className="text-stone-400 serif italic text-xl">Geen parken binnen de 50km straal van {resolvedLocation}.</p>
                <button onClick={resetSearch} className="mt-6 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Terug naar overzicht</button>
              </div>
            )}
          </div>
        )}

        {hasSearched && !loading && <ArtistExpert isVisible={true} />}
      </main>
      
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
