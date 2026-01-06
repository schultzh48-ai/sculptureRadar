
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
    <div className={`flex flex-col md:flex-row gap-2 bg-white p-2 rounded-[2.5rem] border border-stone-200 shadow-sm focus-within:border-blue-400 transition-all ${className}`}>
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
          className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white' : 'bg-stone-900 text-white'}`}
        >
          <i className="fas fa-crosshairs mr-2"></i>
          Radar
        </button>
      </div>
    </div>
  );
};

const RadarAnimation = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <div className="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
    <div className="absolute inset-2 border border-blue-100 rounded-full"></div>
    <div className="absolute inset-4 border border-blue-50 rounded-full"></div>
    <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-t from-blue-500 to-transparent origin-bottom animate-[spin_2s_linear_infinite]"></div>
    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
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
      const prompt = `Schrijf een sfeervol kort verhaal (max 70 woorden) over de artistieke identiteit en beeldenparken in het specifieke zoekgebied: "${queryOrCoords}". Focus op hoe de lokale natuur of architectuur in deze omgeving samensmelt met moderne beeldhouwkunst. Gebruik geen titels of JSON.`;
      const { text } = await askGemini(prompt, []);
      setRegionVibe(text.replace(/\[|\]/g, "").trim());
    } catch (e) {
      setRegionVibe("In dit gebied versmelten kunst en landschap tot een unieke openluchtbeleving.");
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

    if (finalQuery) {
      fetchRegionVibe(finalQuery);
      const initialResults = INITIAL_PARKS.filter(p => 
        p.location.toLowerCase().includes(finalQuery.toLowerCase()) || 
        p.name.toLowerCase().includes(finalQuery.toLowerCase())
      );
      setAiParks(initialResults);
    } else if (lat && lng) {
      fetchRegionVibe(`regio op coördinaten ${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      setAiParks([]);
    }

    try {
      let prompt = `Identificeer ALLE beeldenparken en beeldentuinen binnen een straal van MAXIMAAL 50km rondom ${finalQuery || 'coördinaten ' + lat + ',' + lng}. Gebruik Google Search om de exacte locatie te verifiëren.`;
      
      const { text } = await askGemini(prompt, []);
      let discovered: SculpturePark[] = [];
      try {
        discovered = JSON.parse(text).map((p: any) => ({ 
          ...p, 
          id: p.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
          isAiDiscovered: true 
        }));
      } catch (e) {
        console.error("JSON Parse Error", e);
      }

      setAiParks(prev => {
        const existingNames = new Set(prev.map(d => d.name.toLowerCase()));
        
        // Filter resultaten: Alleen als ze echt in de buurt zijn (als we een referentiepunt hebben)
        const validatedDiscovered = discovered.filter(p => {
            if (lat && lng) {
                const realDist = getDistance(lat, lng, p.lat, p.lng);
                return realDist <= 75; // Ruime marge voor 'regio'
            }
            return true;
        });

        const uniqueDiscovered = validatedDiscovered.filter(p => !existingNames.has(p.name.toLowerCase()));
        
        if (lat && lng) {
          const nearbyDefaults = INITIAL_PARKS.filter(p => {
            const dist = getDistance(lat, lng, p.lat, p.lng);
            return dist <= 60 && !existingNames.has(p.name.toLowerCase());
          });
          return [...prev, ...uniqueDiscovered, ...nearbyDefaults];
        }
        
        return [...prev, ...uniqueDiscovered];
      });

    } catch (e) {
      console.error("Deep Search failed", e);
    } finally {
      setIsAiLoading(false);
    }
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
          alert("Locatie toegang vereist voor Radar.");
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
    <div className="min-h-screen flex flex-col bg-[#f9f9f7]">
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white"><i className="fas fa-compass"></i></div>
            <h1 className="text-xl font-bold text-stone-900 serif">Sculptuur<span className="text-stone-400 italic">Radar</span></h1>
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
                className="!py-1 !rounded-2xl !shadow-none !border-stone-100" 
              />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {!hasSearched && !isNearbyMode ? (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <h2 className="text-6xl font-bold text-stone-900 serif mb-6 tracking-tight">SculptuurRadar</h2>
            <p className="text-stone-500 text-xl mb-10 font-light leading-relaxed">Voer een stad of regio in. We tonen direct bekende locaties en starten een diepe radarscan voor nieuwe ontdekkingen.</p>
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
            <div className="flex justify-between items-end mb-8 border-b border-stone-200 pb-6">
              <div>
                <h2 className="text-[10px] uppercase tracking-widest font-black text-stone-400 mb-2">
                  {isAiLoading ? 'Scan Bezig...' : 'Scan Voltooid'}
                </h2>
                <div className="text-3xl font-bold text-stone-900 serif">{filteredParks.length} Resultaten</div>
              </div>
              {isAiLoading && (
                <div className="flex items-center gap-3 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg">
                   <i className="fas fa-satellite-dish animate-bounce"></i>
                   <span className="text-[10px] font-black uppercase tracking-widest">Diepe radar scan...</span>
                </div>
              )}
            </div>

            {(regionVibe || isVibeLoading) && (
              <div className="mb-10 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {isVibeLoading ? (
                    <div className="flex-shrink-0">
                      <RadarAnimation />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 text-blue-300">
                      <i className="fas fa-sparkles text-4xl"></i>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {isVibeLoading ? (
                      <div className="flex flex-col gap-2">
                        <div className="w-1/2 h-2.5 bg-blue-200 rounded-full animate-pulse"></div>
                        <div className="w-full h-2.5 bg-blue-100 rounded-full animate-pulse"></div>
                        <div className="w-3/4 h-2.5 bg-blue-50 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-2">Omgeving verkennen...</span>
                      </div>
                    ) : (
                      <p className="text-lg text-stone-800 italic leading-relaxed font-medium serif max-w-4xl">
                        "{regionVibe}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={(p) => setSelectedPark({ ...p, distance: p.distance })} />
              ))}
              {isAiLoading && (
                <div className="col-span-1 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center p-10 opacity-50 bg-stone-50/50">
                  <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-4"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Nieuwe parken lokaliseren</span>
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
