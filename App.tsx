
import React, { useState, useMemo, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { ArtistExpert } from './components/ArtistExpert';
import { getGeocode, searchParksWithCurator } from './services/gemini';
import { INITIAL_PARKS } from './constants';

const SEARCH_RADIUS_KM = 50;
const DUPLICATE_THRESHOLD_KM = 0.2; // 200 meter
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
  }, []);

  const performSearch = useCallback(async (query: string, coords?: {lat: number, lng: number}) => {
    setHasSearched(true);
    setLoading(true);
    setError(null);
    setAiParks([]);
    setCuratorNote('');
    
    try {
      let lat, lng, name;

      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        name = "jouw huidige locatie";
      } else {
        const geo = await getGeocode(query);
        if (!geo) throw new Error("We konden deze plek niet vinden op de kaart.");
        lat = geo.lat;
        lng = geo.lng;
        name = geo.name;
      }

      setSearchCoordinates({ lat, lng });
      setResolvedLocation(name);

      const result = await searchParksWithCurator(lat, lng, name);
      if (result.error) throw new Error("De AI Curator kon de omgeving niet scannen.");

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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsLocating(false);
    }
  }, []);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => performSearch("", { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setError("GPS toegang geweigerd.");
        setIsLocating(false);
      }
    );
  };

  const visibleParks = useMemo(() => {
    if (!searchCoordinates) return [];
    
    const allCandidates = [...INITIAL_PARKS, ...aiParks];
    const unique: any[] = [];
    allCandidates.forEach(candidate => {
      const isDuplicate = unique.some(existing => {
        const dist = getPreciseDistance(candidate.lat, candidate.lng, existing.lat, existing.lng);
        const sameName = candidate.name.toLowerCase().includes(existing.name.toLowerCase()) || 
                         existing.name.toLowerCase().includes(candidate.name.toLowerCase());
        return (dist < DUPLICATE_THRESHOLD_KM) || (sameName && dist < 2.0);
      });

      if (!isDuplicate) {
        unique.push(candidate);
      }
    });

    return unique
      .map(p => ({
        ...p,
        distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, p.lat, p.lng),
        searchOrigin: searchCoordinates
      }))
      .filter(p => p.distance <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_VISIBLE_ITEMS); // Limiteer tot 12
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        {!hasSearched ? (
          <div className="py-24 text-center max-w-2xl mx-auto space-y-12">
            <div className="space-y-4">
              <h2 className="text-6xl font-bold serif leading-tight tracking-tight">Vind kunst in de <span className="text-blue-600 italic underline decoration-blue-100 underline-offset-8">vrije natuur.</span></h2>
              <p className="text-stone-500 text-lg serif italic">Ontdek een topselectie van 12 beeldenparken en interactieve kunstwerken binnen 50 km.</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-stone-100 flex items-center group transition-all ring-offset-4 focus-within:ring-2 ring-blue-500/20">
                <input 
                  className="flex-1 px-8 py-4 outline-none text-lg serif italic bg-transparent" 
                  placeholder="Zoek een stad of dorp..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                />
                <button 
                  onClick={() => performSearch(searchTerm)} 
                  disabled={loading}
                  className="bg-stone-900 text-white px-10 py-4 rounded-full font-black uppercase text-xs hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  Zoek Nu
                </button>
              </div>
              <button onClick={handleGPS} disabled={isLocating} className="text-stone-400 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mx-auto transition-all">
                <i className={`fas fa-location-arrow ${isLocating ? 'animate-bounce' : ''}`}></i> 
                {isLocating ? 'Locatie bepalen...' : 'Zoek rondom mijn GPS positie'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{loading ? 'Curator analyseert...' : 'Curator selectie nabij'}</span>
                <p className="text-3xl font-bold serif text-stone-800 italic uppercase leading-none mt-1">{resolvedLocation}</p>
                {!loading && <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mt-2 block">Top 12 beeldenparken & publieke kunsticonen (50 km)</span>}
              </div>
              <button onClick={resetSearch} className="text-[10px] font-black uppercase text-stone-400 hover:text-blue-600 px-5 py-2.5 border border-stone-100 rounded-full transition-all bg-white hover:bg-stone-50">Andere plek</button>
            </div>

            {loading && (
              <div className="flex flex-col items-center py-32 gap-6 animate-pulse text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <i className="fas fa-feather-pointed absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600"></i>
                </div>
                <p className="text-stone-400 serif italic text-xl tracking-wide max-w-sm">De AI Curator stelt een top 12 van kunstlocaties samen...</p>
              </div>
            )}

            {!loading && curatorNote && (
              <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-6 animate-in slide-in-from-top-4 duration-700">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                  <i className="fas fa-quote-left"></i>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Bericht van de Curator</h4>
                  <p className="text-stone-700 text-lg serif italic leading-relaxed">"{curatorNote}"</p>
                </div>
              </div>
            )}

            {!loading && visibleParks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleParks.map((p, idx) => (
                  <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    <ParkCard park={p} onClick={setSelectedPark} />
                  </div>
                ))}
              </div>
            ) : !loading && !error && (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-stone-100 shadow-inner">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                  <i className="fas fa-search-location text-2xl"></i>
                </div>
                <p className="text-stone-400 serif italic text-xl">Geen kunstlocaties gevonden binnen {SEARCH_RADIUS_KM} km.</p>
                <button onClick={resetSearch} className="mt-6 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Verruim je zoekopdracht</button>
              </div>
            )}
            
            {error && (
              <div className="p-16 bg-white rounded-[3rem] text-center max-w-xl mx-auto shadow-sm border border-stone-100">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                  <i className="fas fa-map-pin text-2xl"></i>
                </div>
                <h3 className="text-2xl font-bold serif italic mb-2">Oeps...</h3>
                <p className="text-stone-500 mb-8">{error}</p>
                <button onClick={resetSearch} className="bg-stone-900 text-white px-12 py-4 rounded-full text-xs font-black uppercase hover:bg-blue-600 transition-all">Probeer een andere stad</button>
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
