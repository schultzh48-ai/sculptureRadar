
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
    setRegionVibe("");
    try {
      const prompt = `Vertel als onze Hoofdcurator een inspirerend verhaal over de beeldenparken in "${queryOrCoords}". Wat maakt deze regio artistiek uniek? Schrijf minimaal 100 woorden.`;
      const { text } = await askGemini(prompt, []);
      setRegionVibe(text || "Een regio waar kunst en natuur een unieke dialoog aangaan.");
    } catch (e) {
      setRegionVibe("Er is een fout opgetreden bij het ophalen van de curator-tekst.");
    } finally {
      setIsVibeLoading(false);
    }
  };

  const performDeepSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    const finalQuery = query.trim();
    if (!finalQuery && !lat) return;
    
    setHasSearched(true);
    setIsAiLoading(true);
    
    // Lokale filter direct toepassen
    const initialResults = INITIAL_PARKS.filter(p => {
      if (finalQuery) {
        return p.location.toLowerCase().includes(finalQuery.toLowerCase()) || 
               p.name.toLowerCase().includes(finalQuery.toLowerCase());
      }
      if (lat && lng) {
        return getDistance(lat, lng, p.lat, p.lng) <= 150;
      }
      return false;
    });
    setAiParks(initialResults);

    fetchRegionVibe(finalQuery || `omgeving ${lat},${lng}`);

    try {
      const searchPrompt = `Zoek via Google Search naar bekende beeldenparken en beeldentuinen in "${finalQuery || 'lat ' + lat + ', lng ' + lng}". Geef resultaten uitsluitend als JSON array met velden: name, location, shortDescription, website, lat, lng.`;
      const { text } = await askGemini(searchPrompt, []);
      
      if (text && text.length > 5) {
        try {
          const discovered = JSON.parse(text).map((p: any) => ({ 
            ...p, 
            id: p.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
            isAiDiscovered: true 
          }));
          
          setAiParks(prev => {
            const existingNames = new Set(prev.map(d => d.name.toLowerCase()));
            const uniqueDiscovered = discovered.filter((p: any) => !existingNames.has(p.name.toLowerCase()));
            return [...prev, ...uniqueDiscovered];
          });
        } catch (e) {
          console.error("AI parse error", e);
        }
      }
    } catch (e) {
      console.error("AI search failed", e);
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
          alert("GPS is nodig voor deze functie.");
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

  const sortedParks = useMemo(() => {
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
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white transition-transform group-hover:rotate-12">
              <i className="fas fa-radar"></i>
            </div>
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
            <h2 className="text-6xl md:text-7xl font-bold text-stone-900 serif mb-8 tracking-tight">SculptuurRadar</h2>
            <p className="text-stone-500 text-xl md:text-2xl mb-12 font-light leading-relaxed">Vind de mooiste beeldenparken in Europa via AI of GPS.</p>
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
                    <><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Zoeken in artistieke database...</>
                  ) : 'Resultaten gevonden'}
                </h2>
                <div className="text-4xl font-bold text-stone-900 serif">{sortedParks.length} Locaties</div>
              </div>
            </div>

            {(regionVibe || isVibeLoading) && (
              <div className="mb-14 p-12 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <div className="flex flex-col md:flex-row items-start gap-12">
                  <div className="flex-shrink-0">
                    <ModernRadarIcon active={isVibeLoading} />
                  </div>
                  <div className="flex-1">
                    {isVibeLoading ? (
                      <div className="space-y-4 max-w-2xl animate-pulse">
                        <div className="w-full h-3 bg-stone-100 rounded-full"></div>
                        <div className="w-5/6 h-3 bg-stone-100 rounded-full"></div>
                        <div className="w-4/6 h-3 bg-stone-100 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="relative">
                        <i className="fas fa-quote-left absolute -top-8 -left-8 text-6xl text-stone-50"></i>
                        <p className="text-xl md:text-2xl text-stone-800 italic serif leading-relaxed font-medium">
                          {regionVibe}
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                            <div className="w-12 h-[1px] bg-blue-600"></div>
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-blue-600">Hoofdcurator</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={(p) => setSelectedPark({ ...p, distance: p.distance })} />
              ))}
              
              {isAiLoading && (
                 <div className="col-span-1 border-2 border-dashed border-stone-100 rounded-3xl flex flex-col items-center justify-center p-8 bg-stone-50/50 min-h-[220px]">
                    <div className="w-10 h-10 border-4 border-stone-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">Live scan uitgevoerd...</span>
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
