
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchTrigger();
    }
  };

  return (
    <div className={`flex flex-col md:flex-row gap-2 bg-white p-2 rounded-[2.5rem] border border-stone-200 shadow-sm focus-within:border-blue-500 transition-all ${className}`}>
      <div className="relative flex-1 flex items-center">
        <i className="fas fa-search absolute left-6 text-stone-400"></i>
        <input 
          type="text" 
          placeholder="Zoek stad of park..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent pl-14 pr-6 py-4 rounded-2xl text-lg outline-none font-medium placeholder:text-stone-300"
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleSearchTrigger}
          disabled={searchTerm.trim().length < 2 || isAiLoading}
          className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95"
        >
          {isAiLoading ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : <i className="fas fa-search mr-2"></i>}
          Zoek
        </button>
        <button 
          onClick={toggleRadar}
          className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-stone-900 text-white'}`}
        >
          <i className="fas fa-crosshairs mr-2"></i>
          Radar
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
      <line x1="2" y1="50" x2="98" y2="50" strokeWidth="0.5" />
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

  const fetchRegionVibe = async (queryOrCoords: string) => {
    setIsVibeLoading(true);
    try {
      const prompt = `Schrijf een sfeervol kort verhaal (max 60 woorden) over de artistieke identiteit van de regio: "${queryOrCoords}". Focus op de dialoog tussen kunst en natuur. Geen JSON.`;
      const { text } = await askGemini(prompt, []);
      setRegionVibe(text.replace(/\[|\]/g, "").trim());
    } catch (e) {
      setRegionVibe("Een regio waar natuurlijke schoonheid en menselijke creativiteit harmonieus samensmelten.");
    } finally {
      setIsVibeLoading(false);
    }
  };

  const performDeepSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    const finalQuery = query.trim();
    if (!finalQuery && !lat) return;
    
    setHasSearched(true);
    setIsAiLoading(true);
    setRegionVibe("");

    // Start AI aanroepen parallel voor snelheid
    const vibePromise = finalQuery 
      ? fetchRegionVibe(finalQuery) 
      : (lat && lng ? fetchRegionVibe(`bij ${lat.toFixed(2)}, ${lng.toFixed(2)}`) : Promise.resolve());

    if (finalQuery) {
      const initialResults = INITIAL_PARKS.filter(p => 
        p.location.toLowerCase().includes(finalQuery.toLowerCase()) || 
        p.name.toLowerCase().includes(finalQuery.toLowerCase())
      );
      setAiParks(initialResults);
    } else {
      setAiParks([]);
    }

    try {
      const searchPrompt = `Zoek alle beeldenparken en beeldentuinen binnen 40km van ${finalQuery || 'coördinaten ' + lat + ',' + lng}. Gebruik Google Search voor geografische precisie. Reageer alleen met JSON array.`;
      
      const { text } = await askGemini(searchPrompt, []);
      let discovered: SculpturePark[] = [];
      try {
        discovered = JSON.parse(text).map((p: any) => ({ 
          ...p, 
          id: p.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
          isAiDiscovered: true 
        }));
      } catch (e) {
        console.error("JSON Error", e);
      }

      setAiParks(prev => {
        const existingNames = new Set(prev.map(d => d.name.toLowerCase()));
        
        const validatedDiscovered = discovered.filter(p => {
            if (lat && lng) {
                const realDist = getDistance(lat, lng, p.lat, p.lng);
                return realDist <= 60; 
            }
            return true;
        });

        const uniqueDiscovered = validatedDiscovered.filter(p => !existingNames.has(p.name.toLowerCase()));
        
        if (lat && lng) {
          const nearbyDefaults = INITIAL_PARKS.filter(p => {
            const dist = getDistance(lat, lng, p.lat, p.lng);
            return dist <= 50 && !existingNames.has(p.name.toLowerCase());
          });
          return [...prev, ...uniqueDiscovered, ...nearbyDefaults];
        }
        
        return [...prev, ...uniqueDiscovered];
      });

    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsAiLoading(false);
    }
    
    await vibePromise;
  }, []);

  const handleSearchTrigger = useCallback(() => {
    const q = searchTerm.trim();
    if (q.length >= 2) {
      performDeepSearch(q);
    }
  }, [searchTerm, performDeepSearch]);

  useEffect(() => {
    if (isNearbyMode && userLocation) {
      performDeepSearch("", userLocation.lat, userLocation.lng);
    }
  }, [isNearbyMode, userLocation, performDeepSearch]);

  const toggleRadar = useCallback(() => {
    if (!isNearbyMode) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setIsNearbyMode(true);
          setSearchTerm('');
        }, (err) => {
          alert("GPS toegang is nodig voor de Radar modus.");
        });
      }
    } else {
      setIsNearbyMode(false);
      setUserLocation(null);
      setAiParks([]);
      setHasSearched(false);
      setRegionVibe("");
    }
  }, [isNearbyMode]);

  const filteredParks = useMemo(() => {
    return aiParks.map(p => {
      let distance;
      if (userLocation) {
        distance = getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
      }
      return { ...p, distance };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [aiParks, userLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9]">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white transition-transform group-hover:rotate-12"><i className="fas fa-radar"></i></div>
            <h1 className="text-2xl font-bold text-stone-900 serif">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {(hasSearched || isNearbyMode) && (
            <div className="w-full max-w-xl">
              <SearchBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleSearchTrigger={handleSearchTrigger}
                toggleRadar={toggleRadar}
                isAiLoading={isAiLoading}
                isNearbyMode={isNearbyMode}
                className="!py-1 !rounded-2xl !shadow-none !border-stone-100 bg-stone-50/50" 
              />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {!hasSearched && !isNearbyMode ? (
          <div className="text-center py-24 max-w-3xl mx-auto">
            <div className="mb-12 flex justify-center">
                <ModernRadarIcon active={false} />
            </div>
            <h2 className="text-7xl font-bold text-stone-900 serif mb-8 tracking-tight">SculptuurRadar</h2>
            <p className="text-stone-500 text-2xl mb-12 font-light leading-relaxed">Scan steden of gebruik de radar voor beeldenparken in jouw omgeving.</p>
            <SearchBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearchTrigger={handleSearchTrigger}
              toggleRadar={toggleRadar}
              isAiLoading={isAiLoading}
              isNearbyMode={isNearbyMode}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-12 border-b border-stone-200 pb-8">
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.3em] font-black text-stone-400 mb-3 flex items-center gap-2">
                  {isAiLoading ? (
                    <><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Scan in uitvoering</>
                  ) : 'Resultaten geoptimaliseerd'}
                </h2>
                <div className="text-4xl font-bold text-stone-900 serif">{filteredParks.length} Locaties gevonden</div>
              </div>
              {isAiLoading && (
                <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-3 rounded-2xl shadow-sm">
                   <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs font-bold uppercase tracking-widest text-stone-600">Deep Radar Scan...</span>
                </div>
              )}
            </div>

            {(regionVibe || isVibeLoading) && (
              <div className="mb-14 p-10 bg-white rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-shrink-0">
                    <ModernRadarIcon active={isVibeLoading} />
                  </div>
                  
                  <div className="flex-1">
                    {isVibeLoading ? (
                      <div className="space-y-3">
                        <div className="w-1/3 h-2.5 bg-stone-100 rounded-full animate-pulse"></div>
                        <div className="w-full h-2.5 bg-stone-50 rounded-full animate-pulse"></div>
                        <div className="w-2/3 h-2.5 bg-stone-50/50 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <p className="text-2xl text-stone-800 italic leading-snug font-medium serif max-w-4xl">
                        "{regionVibe}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={(p) => setSelectedPark({ ...p, distance: p.distance })} />
              ))}
              {isAiLoading && (
                <div className="col-span-1 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center p-12 opacity-40 bg-stone-50/30">
                  <i className="fas fa-radar text-2xl mb-4 animate-pulse text-stone-400"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Analyseert omgeving...</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
