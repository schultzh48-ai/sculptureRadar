
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { askGemini } from './services/gemini';
import { INITIAL_PARKS } from './constants';

function getPreciseDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0088;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface SearchBoxProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onSearch: (val: string) => void;
  onToggleRadar: () => void;
  isLoading: boolean;
  isNearbyMode: boolean;
  isCentered?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  onSearch, 
  onToggleRadar, 
  isLoading, 
  isNearbyMode, 
  isCentered = false 
}) => (
  <div className={`flex w-full gap-3 ${isCentered ? 'max-w-2xl mx-auto' : ''}`}>
    <div className="relative flex-1">
      <input 
        className={`w-full pl-6 pr-12 py-4 rounded-3xl border border-stone-200 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm font-medium ${isCentered ? 'bg-white text-lg' : 'bg-white'}`} 
        placeholder="Regio, stad of kunstenaar..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(searchTerm)}
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
           <i className="fas fa-circle-notch animate-spin text-blue-500"></i>
        </div>
      )}
    </div>
    <button 
      onClick={() => onSearch(searchTerm)} 
      disabled={isLoading || !searchTerm}
      className={`bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all ${isCentered ? 'text-xs px-10' : ''}`}
    >
      Scan
    </button>
    <button 
      onClick={onToggleRadar} 
      disabled={isLoading}
      className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-md ${isNearbyMode ? 'bg-blue-600 text-white animate-pulse' : 'bg-white border border-stone-200 text-stone-600 hover:border-blue-300'}`}
    >
      <i className={`fas ${isNearbyMode ? 'fa-sync-alt animate-spin' : 'fa-crosshairs'}`}></i>
    </button>
  </div>
);

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<(SculpturePark & { distance?: number, searchOrigin?: {lat: number, lng: number} }) | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiParks, setAiParks] = useState<SculpturePark[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchCoordinates, setSearchCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isAiLoading) {
      setScanProgress(0);
      interval = window.setInterval(() => {
        setScanProgress(prev => (prev < 90 ? prev + 7 : prev < 98 ? prev + 1 : prev));
      }, 100);
    } else {
      setScanProgress(100);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  const performSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    if (!query && lat === undefined) return;
    
    setHasSearched(true);
    setIsAiLoading(true);
    setError(null);
    
    try {
      const locationContext = lat !== undefined && lng !== undefined 
        ? `de regio rondom breedtegraad ${lat.toFixed(4)} en lengtegraad ${lng.toFixed(4)}` 
        : query;

      let prompt = `Geef een gebalanceerde lijst van maximaal 12 objecten in ${locationContext}. Zoek eerst de 6 belangrijkste beeldenparken en vul dit aan met solitaire monumentale sculpturen tot een totaal van 12.`;
      
      const res = await askGemini(prompt, []);
      if (res.text === "ERROR") throw new Error(res.error);

      let data = JSON.parse(res.text);

      const centerLat = lat ?? Number(data.searchLat);
      const centerLng = lng ?? Number(data.searchLng);
      
      if (!isNaN(centerLat) && !isNaN(centerLng)) {
        setSearchCoordinates({ lat: centerLat, lng: centerLng });
      }

      const rawParks = Array.isArray(data.parks) ? data.parks : [];
      const newParks = rawParks.map((p: any) => ({
        id: `ai-${(p.name || '').replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substr(2, 9)}`,
        name: String(p.name || 'Kunstwerk'),
        location: String(p.location || query || 'Onbekend'),
        shortDescription: String(p.shortDescription || 'Openlucht kunstwerk.'),
        website: String(p.website || '#'),
        lat: Number(p.lat),
        lng: Number(p.lng),
        isLandArt: p.name?.toLowerCase().includes('land art') || p.shortDescription?.toLowerCase().includes('land art'),
        isSolitary: p.isSolitary || p.shortDescription?.toLowerCase().includes('sculptuur') || p.shortDescription?.toLowerCase().includes('beeld'),
        isAiDiscovered: true
      } as SculpturePark));

      setAiParks(newParks);
    } catch (e: any) {
      setError("Radar kon geen objecten vinden voor deze locatie.");
    } finally {
      setIsAiLoading(false);
      setIsNearbyMode(false);
    }
  }, []);

  const toggleRadar = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS niet ondersteund.");
      return;
    }
    setIsNearbyMode(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => performSearch("", pos.coords.latitude, pos.coords.longitude),
      () => { 
        setIsNearbyMode(false); 
        setError("GPS toegang geweigerd."); 
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [performSearch]);

  const filteredAndSortedParks = useMemo(() => {
    const sourceParks = [...INITIAL_PARKS, ...aiParks];
    const uniqueMap = new Map();
    sourceParks.forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!uniqueMap.has(key)) uniqueMap.set(key, p);
    });
    
    const unique = Array.from(uniqueMap.values());
    if (!searchCoordinates) return [];
    
    return unique.map(p => {
      const park = p as SculpturePark;
      return {
        ...park,
        distance: getPreciseDistance(searchCoordinates.lat, searchCoordinates.lng, park.lat, park.lng),
        searchOrigin: searchCoordinates
      };
    })
    .filter(p => p.distance <= 100.0) // Straal verruimd naar 100km voor meer resultaten
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [aiParks, searchCoordinates]);

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-stone-900">
      <header className="bg-white/80 backdrop-blur-xl border-b border-stone-100 p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-satellite-dish"></i>
            </div>
            <h1 className="text-2xl font-black serif tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {hasSearched && (
            <div className="hidden md:flex flex-1 max-w-xl ml-10">
              <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={performSearch} onToggleRadar={toggleRadar} isLoading={isAiLoading} isNearbyMode={isNearbyMode} />
            </div>
          )}
        </div>
        {isAiLoading && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {error && (
          <div className="mb-8 p-6 bg-red-50 text-red-900 rounded-[2rem] border border-red-100 flex items-center gap-5">
            <i className="fas fa-exclamation-circle text-red-500"></i>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {!hasSearched ? (
          <div className="py-24 md:py-48 text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-5xl md:text-8xl font-bold text-stone-900 serif leading-[1.1] mb-12">Ontdek de <br/><span className="italic text-blue-600">buitenkunst.</span></h2>
            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl shadow-stone-200/50 border border-stone-100">
               <p className="text-stone-400 text-sm md:text-base mb-8 max-w-2xl mx-auto font-medium">Zoek op een stad, regio of kunstenaar.</p>
              <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={performSearch} onToggleRadar={toggleRadar} isLoading={isAiLoading} isNearbyMode={isNearbyMode} isCentered={true} />
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="md:hidden">
              <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={performSearch} onToggleRadar={toggleRadar} isLoading={isAiLoading} isNearbyMode={isNearbyMode} />
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100 pb-8">
              <div>
                <h3 className="text-stone-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Radar focus</h3>
                <p className="text-2xl font-bold serif">{isAiLoading ? 'Scannen...' : `${filteredAndSortedParks.length} objecten gevonden`}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isAiLoading && filteredAndSortedParks.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-7 border border-stone-100 h-[280px] animate-pulse">
                    <div className="h-4 w-20 bg-stone-100 rounded mb-4"></div>
                    <div className="h-8 w-3/4 bg-stone-100 rounded mb-4"></div>
                  </div>
                ))
              ) : (
                filteredAndSortedParks.map(p => <ParkCard key={p.id} park={p} onClick={setSelectedPark} />)
              )}
            </div>
          </div>
        )}
      </main>
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
