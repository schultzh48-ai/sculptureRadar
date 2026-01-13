
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { ArtistExpert } from './components/ArtistExpert';
import { getGeocode, searchParksWithCurator } from './services/gemini';
import { INITIAL_PARKS } from './constants';

const SEARCH_RADIUS_KM = 50; 
const DUPLICATE_THRESHOLD_KM = 1.5;

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
  const [aiParks, setAiParks] = useState<any[]>([]);
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchTerm('');
    setAiParks([]);
    setError(null);
    setSearchCoordinates(null);
    setResolvedLocation('');
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && !coords) return;
    
    setAiParks([]);
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

      // Start AI search only if we have coordinates
      if (lat !== 0 && lng !== 0) {
        searchParksWithCurator(lat, lng, name).then(result => {
          const mapped = (result.parks || []).map((p: any) => ({
            id: `ai-${Math.random().toString(36).substr(2, 9)}`,
            name: p.name,
            location: p.location,
            shortDescription: p.desc,
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng),
            isAiDiscovered: true,
            isSolitary: p.isSolitary || false,
            isInteractive: p.isInteractive || false,
            website: p.url || '#',
          })).filter((p: any) => {
            const dist = getPreciseDistance(lat, lng, p.lat, p.lng);
            return dist <= SEARCH_RADIUS_KM;
          });
          setAiParks(mapped);
          setLoading(false);
        }).catch(err => {
          console.error("AI Search failed", err);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message === "API_KEY_MISSING" ? "API sleutel ontbreekt." : "Er ging iets mis.");
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

  // 1. EERST DE GIDS (DATABASE)
  const databaseItems = useMemo(() => {
    if (!hasSearched) return [];

    const query = searchTerm.toLowerCase().trim();
    const resolvedCity = resolvedLocation.toLowerCase().trim();

    return INITIAL_PARKS.map(p => {
      const distance = searchCoordinates 
        ? getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng)
        : 9999;
      
      // Match op tekst in Naam, Locatie of Regio
      const textMatch = query.length > 0 && (
        p.name.toLowerCase().includes(query) || 
        p.location.toLowerCase().includes(query) || 
        (p.region && p.region.toLowerCase().includes(query))
      );

      // Match op de door geocoding gevonden stad
      const locationMatch = resolvedCity.length > 0 && (
        p.location.toLowerCase().includes(resolvedCity) ||
        (p.region && p.region.toLowerCase().includes(resolvedCity))
      );

      // Match op GPS afstand
      const nearbyMatch = distance <= SEARCH_RADIUS_KM;

      return { ...p, distance, isMatch: textMatch || locationMatch || nearbyMatch };
    })
    .filter(p => p.isMatch)
    .sort((a, b) => a.distance - b.distance);
  }, [searchCoordinates, searchTerm, resolvedLocation, hasSearched]);

  // 2. DAARNA DE AI ONTDEKKINGEN (Filter duplicaten met gids)
  const aiResults = useMemo(() => {
    return aiParks.filter(aiP => {
      const isDuplicate = databaseItems.some(dbP => 
        dbP.name.toLowerCase().includes(aiP.name.toLowerCase()) || 
        aiP.name.toLowerCase().includes(dbP.name.toLowerCase()) ||
        getPreciseDistance(aiP.lat, aiP.lng, dbP.lat, dbP.lng) < DUPLICATE_THRESHOLD_KM
      );
      return !isDuplicate;
    });
  }, [aiParks, databaseItems]);

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
          {hasSearched && (
            <button onClick={resetSearch} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2">
              <i className="fas fa-rotate-left"></i> Nieuwe zoekopdracht
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        <div className={`${hasSearched ? 'py-8' : 'py-16'} text-center max-w-2xl mx-auto space-y-10 transition-all duration-700`}>
          {!hasSearched && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold serif leading-tight tracking-tight">Vind alle kunst in <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-8">jouw stad.</span></h2>
              <p className="text-stone-500 text-lg serif italic">Ontdek beeldenparken in onze gids of via de AI curator.</p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center group transition-all focus-within:ring-2 ring-blue-500/20 max-w-xl mx-auto">
              <input 
                className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent" 
                placeholder="Typ een plaatsnaam (bijv. Madrid)..." 
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
                {isLocating ? 'Bepalen...' : 'Gebruik GPS'}
              </button>
            )}
            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
          </div>
        </div>

        {hasSearched && (
          <div className="space-y-20 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div className="flex-1 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">Huidige Selectie</span>
                <p className="text-3xl font-bold serif text-stone-800 italic uppercase leading-none">{resolvedLocation || searchTerm}</p>
              </div>
            </div>

            {/* SECTIE 1: ONZE GIDS (PRIORITEIT) */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-900 whitespace-nowrap">Gids Resultaten</h3>
                <div className="h-[1px] flex-1 bg-stone-200"></div>
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full">Database</span>
              </div>
              
              {databaseItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {databaseItems.map((p) => (
                    <ParkCard key={p.id} park={p} onClick={(p) => setSelectedPark({...p, searchOrigin: searchCoordinates})} />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-stone-50/50 rounded-[2.5rem] border border-dashed border-stone-200">
                  <p className="text-stone-400 serif italic">Geen gids-items gevonden in deze specifieke omgeving.</p>
                </div>
              )}
            </div>

            {/* SECTIE 2: AI ONTDEKKINGEN */}
            {(aiResults.length > 0 || loading) && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 whitespace-nowrap">Aanvullende AI Ontdekkingen</h3>
                  <div className="h-[1px] flex-1 bg-blue-100"></div>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Gemini</span>
                </div>
                
                {loading && aiResults.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-40">
                    {[1,2,3,4].map(i => <div key={i} className="h-64 bg-stone-100 rounded-[2.5rem] animate-pulse"></div>)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {aiResults.map((p) => (
                      <ParkCard key={p.id} park={p} onClick={(p) => setSelectedPark({...p, searchOrigin: searchCoordinates})} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {hasSearched && !loading && databaseItems.length === 0 && aiResults.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-400 serif italic text-xl">We konden geen beeldenparken vinden voor deze locatie.</p>
            <button onClick={resetSearch} className="mt-4 text-blue-600 font-bold uppercase text-[10px] tracking-widest hover:underline">Probeer een andere plek</button>
          </div>
        )}

        <ArtistExpert isVisible={hasSearched} />
      </main>
      
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
