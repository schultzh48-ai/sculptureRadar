
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SculpturePark } from './types';
import { ParkCard } from './components/ParkCard';
import { ParkDetail } from './components/ParkDetail';
import { askGemini } from './services/gemini';

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
          placeholder="Zoek stad, regio of land..."
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
  <div className="relative w-16 h-16 mx-auto">
    <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-blue-500/20">
      <circle cx="50" cy="50" r="48" strokeWidth="1" />
      <circle cx="50" cy="50" r="32" strokeWidth="1" />
      <circle cx="50" cy="50" r="16" strokeWidth="1" />
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
  const [apiError, setApiError] = useState<boolean>(false);

  const performDeepSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    // Reset resultaten om de statische 'begin-parken' weg te laten
    setAiParks([]);
    setRegionVibe("");
    setHasSearched(true);
    setIsAiLoading(true);
    setApiError(false);
    
    // We slaan Stap 1 (filteren van INITIAL_PARKS) nu over om uitsluitend AI resultaten te tonen.

    try {
      const vibePrompt = `Vertel als Hoofdcurator kort over de artistieke sfeer en beeldenparken in ${query || 'deze regio'}.`;
      const searchPrompt = `Geef een lijst van minstens 8 beeldenparken of openluchtmusea in of nabij ${query || lat + ',' + lng}. Zoek zowel bekende als verborgen plekken. Return uitsluitend een JSON array: name, location, shortDescription, website, lat, lng.`;
      
      const vibeRes = await askGemini(vibePrompt, []);
      if (vibeRes.text === "FOUT_SLEUTEL_ONTBREEKT") {
        setApiError(true);
        setIsAiLoading(false);
        return;
      }
      setRegionVibe(vibeRes.text);

      const searchRes = await askGemini(searchPrompt, []);
      if (searchRes.text && searchRes.text !== "[]") {
        try {
          const discovered = JSON.parse(searchRes.text).map((p: any) => ({ 
            ...p, 
            id: `ai-${Math.random()}`, 
            isAiDiscovered: true 
          }));
          setAiParks(discovered);
        } catch (e) {
          console.error("JSON Parse error", e);
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
      setApiError(false);
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
            <p className="text-stone-500 text-xl mb-12">Ontdek realtime de mooiste beeldentuinen in Europa.</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={handleSearchClick} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <>
            {apiError && (
              <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-800">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
                <div>
                  <p className="font-bold">Systeem offline</p>
                  <p className="text-sm opacity-80">De radar kan momenteel geen verbinding maken met de AI-curator. Controleer je API-instellingen.</p>
                </div>
              </div>
            )}

            <div className="mb-12 border-b border-stone-200 pb-8 flex justify-between items-end">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest font-black text-stone-400 mb-2">Resultaten van de scan</h2>
                <div className="text-4xl font-bold text-stone-900 serif">
                  {isAiLoading ? 'De radar draait...' : `${sortedParks.length} Parels gevonden`}
                </div>
              </div>
            </div>

            {regionVibe && (
              <div className="mb-12 p-10 bg-white rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <p className="text-xl text-stone-800 italic serif leading-relaxed">{regionVibe}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={setSelectedPark} />
              ))}
              {isAiLoading && (
                 <div className="border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center p-12 bg-white min-h-[250px] col-span-full">
                    <div className="w-12 h-12 border-4 border-stone-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">De radar scant het web op verborgen kunst...</span>
                 </div>
              )}
            </div>

            {!isAiLoading && sortedParks.length === 0 && !apiError && (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <i className="fas fa-search-location text-4xl text-stone-200 mb-6"></i>
                <p className="text-stone-400 font-medium italic serif text-xl">De radar kon in deze regio geen specifieke parken vinden.</p>
                <button 
                  onClick={() => setSearchTerm('Nederland')}
                  className="mt-6 text-blue-600 font-bold text-sm uppercase tracking-widest hover:underline"
                >
                  Probeer een grotere regio <i className="fas fa-chevron-right ml-1"></i>
                </button>
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
