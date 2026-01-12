
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { ArtistExpert } from './components/ArtistExpert';
import { getGeocode, searchParksWithCurator } from './services/gemini';
import { INITIAL_PARKS } from './constants';

const SEARCH_RADIUS_KM = 50;
const DUPLICATE_THRESHOLD_KM = 0.5;
const MAX_VISIBLE_ITEMS = 12;

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
  const [curatorNote, setCuratorNote] = useState('');
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
    setCuratorNote('');
    setError(null);
    setSearchCoordinates(null);
    setResolvedLocation('');
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery && !coords) return;
    
    setAiParks([]);
    setCuratorNote('');
    setResolvedLocation('');
    setSearchCoordinates(null);
    setError(null);
    setHasSearched(true);
    setLoading(true);
    
    try {
      let lat, lng, name;
      
      const localMatch = INITIAL_PARKS.find(p => 
        p.location.toLowerCase().includes(trimmedQuery) || 
        p.name.toLowerCase().includes(trimmedQuery)
      );
      
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        name = "jouw huidige locatie";
      } else if (localMatch && trimmedQuery.length > 2) {
        lat = localMatch.lat;
        lng = localMatch.lng;
        name = localMatch.location;
      } else {
        const geo = await getGeocode(trimmedQuery);
        if (!geo) throw new Error("Locatie niet gevonden.");
        lat = geo.lat;
        lng = geo.lng;
        name = geo.name;
      }

      setSearchCoordinates({ lat, lng });
      setResolvedLocation(name);

      searchParksWithCurator(lat, lng, name).then(result => {
        setCuratorNote(result.curatorIntro || '');
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
        })).filter((p: any) => p.name && !isNaN(p.lat));
        setAiParks(mapped);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

    } catch (e: any) {
      setError(e.message === "API_KEY_MISSING" ? "API sleutel ontbreekt." : e.message);
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
        setLoading(false);
      }
    );
  };

  const handleParkSelection = (park: SculpturePark) => {
    // Voeg de zoekcoördinaten toe aan het geselecteerde park voor de routeplanner
    setSelectedPark({
      ...park,
      searchOrigin: searchCoordinates
    });
  };

  const visibleParks = useMemo(() => {
    if (!searchCoordinates) {
      return INITIAL_PARKS.slice(0, MAX_VISIBLE_ITEMS);
    }

    const allCandidates = [...INITIAL_PARKS, ...aiParks];
    const results: any[] = [];
    
    allCandidates.forEach(candidate => {
      const distToSearch = getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, candidate.lat, candidate.lng);
      
      if (distToSearch <= SEARCH_RADIUS_KM) {
        const isDuplicate = results.some(existing => {
          const distBetween = getPreciseDistance(candidate.lat, candidate.lng, existing.lat, existing.lng);
          return distBetween < DUPLICATE_THRESHOLD_KM;
        });
        if (!isDuplicate) {
          results.push({ ...candidate, distance: distToSearch });
        }
      }
    });

    return results.sort((a, b) => a.distance - b.distance).slice(0, MAX_VISIBLE_ITEMS);
  }, [aiParks, searchCoordinates]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900 text-sm">
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-landmark"></i>
            </div>
            <h1 className="text-xl font-black serif tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {hasSearched && (
            <button 
              onClick={resetSearch}
              className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-rotate-left"></i>
              Nieuwe zoekopdracht
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        <div className={`${hasSearched ? 'py-8' : 'py-24'} text-center max-w-2xl mx-auto space-y-12 transition-all duration-700`}>
          {!hasSearched && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <h2 className="text-6xl font-bold serif leading-tight tracking-tight">Ontdek kunst in de <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-8">buitenlucht.</span></h2>
              <p className="text-stone-500 text-lg serif italic">Zoek op stad, regio of park (max. 50 km).</p>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center group transition-all focus-within:ring-2 ring-blue-500/20 max-w-xl mx-auto">
              <input 
                className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent" 
                placeholder="Typ een stad of regio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
              />
              <button 
                onClick={() => performSearch(searchTerm)} 
                disabled={loading}
                className="bg-stone-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {loading && !searchCoordinates ? <i className="fas fa-circle-notch animate-spin"></i> : 'Zoek'}
              </button>
            </div>
            {!hasSearched && (
              <button onClick={handleGPS} disabled={isLocating} className="text-stone-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto transition-all">
                <i className={`fas fa-location-arrow ${isLocating ? 'animate-bounce' : ''}`}></i> 
                {isLocating ? 'Locatie bepalen...' : 'Gebruik mijn huidige locatie'}
              </button>
            )}
          </div>
        </div>

        {hasSearched && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                    {loading ? 'AI Curator analyseert de omgeving...' : `Top ${MAX_VISIBLE_ITEMS} resultaten binnen 50 km`}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-3xl font-bold serif text-stone-800 italic uppercase leading-none">{resolvedLocation}</p>
                  <button 
                    onClick={resetSearch}
                    className="mt-1 px-4 py-1.5 border border-stone-200 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    <i className="fas fa-xmark mr-1"></i> Wissen
                  </button>
                </div>
              </div>
              {loading && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
            </div>

            {curatorNote && (
              <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-6 animate-in slide-in-from-top-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg italic serif text-2xl">“</div>
                <p className="text-stone-700 text-lg serif italic leading-relaxed">{curatorNote}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mt-8 bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 text-center serif italic">
            <i className="fas fa-circle-exclamation mr-2"></i> {error}
          </div>
        )}

        <div className="mt-12">
          {visibleParks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleParks.map((p) => (
                <ParkCard key={p.id} park={p} onClick={handleParkSelection} />
              ))}
            </div>
          ) : hasSearched && !loading && (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-stone-100">
              <p className="text-stone-400 serif italic text-xl">Geen parken gevonden in deze straal.</p>
              <button onClick={resetSearch} className="mt-4 text-blue-600 font-bold uppercase text-[10px] tracking-widest">Probeer een andere stad</button>
            </div>
          )}
        </div>

        <ArtistExpert isVisible={hasSearched} />
      </main>
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
