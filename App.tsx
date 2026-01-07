
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { askGemini } from './services/gemini';
import { INITIAL_PARKS } from './constants';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  handleSearchTrigger: () => void;
  toggleRadar: () => void;
  isAiLoading: boolean;
  isNearbyMode: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  handleSearchTrigger, 
  toggleRadar, 
  isAiLoading, 
  isNearbyMode, 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-2 bg-white p-2 rounded-[2.5rem] border border-stone-200 shadow-sm focus-within:border-blue-500 transition-all ${className}`}>
      <div className="relative flex-1 flex items-center">
        <i className="fas fa-search absolute left-6 text-stone-400"></i>
        <input 
          type="text" 
          placeholder="Zoek stad of park..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
          className="w-full bg-transparent pl-14 pr-6 py-4 rounded-2xl text-lg outline-none font-medium placeholder:text-stone-300"
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleSearchTrigger}
          disabled={searchTerm.trim().length < 2 || isAiLoading}
          className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95"
        >
          {isAiLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-search mr-2"></i>}
          Zoek
        </button>
        <button 
          onClick={toggleRadar}
          className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-stone-900 text-white'}`}
        >
          <i className="fas fa-crosshairs mr-2"></i>
          {isNearbyMode ? 'Radar Aan' : 'Radar'}
        </button>
      </div>
    </div>
  );
};

const ModernRadarIcon = ({ active = true }: { active?: boolean }) => (
  <div className="relative w-16 h-16">
    <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-blue-500/20">
      <circle cx="50" cy="50" r="48" strokeWidth="1" />
      <circle cx="50" cy="50" r="32" strokeWidth="1" />
      <circle cx="50" cy="50" r="16" strokeWidth="1" />
      <line x1="50" y1="2" x2="50" y2="98" strokeWidth="0.5" />
      {active && (
        <g className="animate-[spin_4s_linear_infinite] origin-center">
          <path d="M50 50 L50 2 A48 48 0 0 1 98 50 Z" fill="url(#radarGradient)" />
        </g>
      )}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
    <div className={`absolute inset-0 flex items-center justify-center`}>
      <div className={`w-2 h-2 bg-blue-500 rounded-full ${active ? 'animate-ping' : ''}`}></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<(SculpturePark & { distance?: number }) | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiParks, setAiParks] = useState<SculpturePark[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [regionVibe, setRegionVibe] = useState<string>("");
  const [isVibeLoading, setIsVibeLoading] = useState(false);

  const performDeepSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    setAiParks([]);
    setRegionVibe("");
    setHasSearched(true);
    setIsAiLoading(true);
    
    // Stap 1: Filter statische lijst (strengere 25km filter voor betere initiële resultaten)
    const initialResults = INITIAL_PARKS.filter(p => {
      if (lat && lng) return getDistance(lat, lng, p.lat, p.lng) <= 25;
      return query && (p.location.toLowerCase().includes(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase()));
    });
    setAiParks(initialResults);

    // Stap 2: Vibe ophalen
    setIsVibeLoading(true);
    try {
      const { text } = await askGemini(`Vertel als Hoofdcurator kort en krachtig over de sfeer van beeldenparken en kunst in de open lucht in de regio ${query || 'waar ik nu ben'}. Focus op wat deze specifieke plek artistiek interessant maakt.`, []);
      setRegionVibe(text || "");
    } catch (e) {
      console.error("Vibe error", e);
    } finally {
      setIsVibeLoading(false);
    }

    // Stap 3: Deep Search via AI (Verruimde zoekopdracht)
    try {
      // We vragen de AI om verder te kijken als er dichtbij niets is, tot 50-75km.
      const prompt = `Zoek ALLES wat met beeldenparken, beeldentuinen, openluchtmusea of grote publieke kunstinstallaties te maken heeft nabij ${query || lat + ',' + lng}. Zoek eerst binnen 15km, maar breid uit naar 60km als er weinig resultaten zijn. Wees specifiek en zoek ook naar kleinere, minder bekende plekken. Return uitsluitend een JSON array met: name, location, shortDescription, website, lat, lng.`;
      
      const { text } = await askGemini(prompt, []);
      if (text) {
        try {
          const discovered = JSON.parse(text).map((p: any) => ({ ...p, id: `ai-${Math.random()}`, isAiDiscovered: true }));
          setAiParks(prev => {
            const names = new Set(prev.map(d => d.name.toLowerCase()));
            // Voor AI resultaten hanteren we een ruimere filter van 75km om 'te weinig resultaten' te voorkomen
            const valid = discovered.filter((p: any) => {
              const isNew = !names.has(p.name.toLowerCase());
              if (lat && lng && p.lat && p.lng) {
                return isNew && getDistance(lat, lng, p.lat, p.lng) <= 75;
              }
              return isNew;
            });
            return [...prev, ...valid];
          });
        } catch (jsonErr) {
          console.error("Invalid JSON from AI", jsonErr);
        }
      }
    } catch (e) {
      console.error("Deep search error", e);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const toggleRadar = useCallback(() => {
    if (!isNearbyMode) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setIsNearbyMode(true);
        setSearchTerm('');
        performDeepSearch("", loc.lat, loc.lng);
      }, () => alert("GPS nodig voor radar."));
    } else {
      setIsNearbyMode(false);
      setUserLocation(null);
      setAiParks([]);
      setHasSearched(false);
      setRegionVibe("");
    }
  }, [isNearbyMode, performDeepSearch]);

  const sortedParks = useMemo(() => {
    return aiParks.map(p => ({
      ...p,
      distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) : undefined
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [aiParks, userLocation]);

  const handleSearchClick = () => {
    if (searchTerm.trim().length >= 2) {
      performDeepSearch(searchTerm);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9]">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white"><i className="fas fa-radar"></i></div>
            <h1 className="text-2xl font-bold text-stone-900 serif">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {(hasSearched || isNearbyMode) && (
            <div className="w-full max-w-xl">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={handleSearchClick} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} className="!py-1 !rounded-2xl !shadow-none !border-stone-100 bg-stone-50/50" />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {!hasSearched && !isNearbyMode ? (
          <div className="text-center py-24 max-w-3xl mx-auto">
            <ModernRadarIcon active={false} />
            <h2 className="text-6xl font-bold text-stone-900 serif mt-8 mb-8">SculptuurRadar</h2>
            <p className="text-stone-500 text-xl mb-12">Ontdek beeldentuinen en kunstparken. De radar zoekt nu dieper en verder voor meer resultaten.</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={handleSearchClick} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <>
            <div className="mb-12 border-b border-stone-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-stone-400 mb-2">
                  {isAiLoading ? 'De radar scant de wijde omgeving...' : 'Gevonden locaties'}
                </h2>
                <div className="text-4xl font-bold text-stone-900 serif">
                  {isAiLoading && sortedParks.length === 0 ? 'Zoeken...' : `${sortedParks.length} Parels gevonden`}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 bg-stone-100 px-4 py-2 rounded-full">
                <i className="fas fa-info-circle text-blue-500"></i>
                <span>We tonen resultaten tot 75km voor een compleet overzicht</span>
              </div>
            </div>

            {(regionVibe || isVibeLoading) && (
              <div className="mb-12 p-10 bg-white rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                {isVibeLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-stone-100 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-100 rounded w-1/2"></div>
                  </div>
                ) : (
                  <p className="text-xl text-stone-800 italic serif leading-relaxed">{regionVibe}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={setSelectedPark} />
              ))}
              {isAiLoading && (
                 <div className="border-2 border-dashed border-stone-100 rounded-3xl flex flex-col items-center justify-center p-8 bg-stone-50/50 min-h-[200px] animate-pulse">
                    <div className="w-8 h-8 border-4 border-stone-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Radar verbreedt zoekveld...</span>
                 </div>
              )}
            </div>

            {!isAiLoading && sortedParks.length === 0 && (
              <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <i className="fas fa-search-minus text-4xl text-stone-200 mb-4"></i>
                <p className="text-stone-400 font-medium italic serif text-lg">Zelfs met een brede scan zijn er geen parken gevonden.</p>
                <p className="text-stone-400 text-sm mt-2">Probeer een andere regio of zoek op een specifieke stad.</p>
              </div>
            )}
          </>
        )}
      </main>
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
