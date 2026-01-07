
import React, { useState, useMemo, useCallback } from 'react';
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
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, setSearchTerm, handleSearchTrigger, toggleRadar, isAiLoading, isNearbyMode 
}) => (
  <div className="flex flex-col md:flex-row gap-2 bg-white p-2 rounded-[2.5rem] border border-stone-200 shadow-sm focus-within:border-blue-500 transition-all">
    <div className="relative flex-1 flex items-center">
      <i className="fas fa-search absolute left-6 text-stone-400"></i>
      <input 
        type="text" 
        placeholder="Zoek een stad of regio..."
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
        {isAiLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Zoek'}
      </button>
      <button 
        onClick={toggleRadar}
        className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-stone-900 text-white'}`}
      >
        <i className={`fas ${isNearbyMode ? 'fa-sync-alt animate-spin' : 'fa-crosshairs'} mr-2`}></i>
        {isNearbyMode ? 'Radar Actief' : 'Radar'}
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<(SculpturePark & { distance?: number }) | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiParks, setAiParks] = useState<SculpturePark[]>([]);
  const [curatorText, setCuratorText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    setAiParks([]);
    setCuratorText('');
    setHasSearched(true);
    setIsAiLoading(true);
    setError(null);

    try {
      const locationPrompt = query || (lat && lng ? `de coördinaten ${lat}, ${lng}` : "Europa");
      const prompt = `Geef 15 beeldenparken in ${locationPrompt}. Geef alleen JSON.`;
      
      const res = await askGemini(prompt, []);
      
      if (res.text === "ERROR") {
        setError(res.error || "De AI-sleutel kon niet worden geverifieerd.");
        return;
      }

      const data = JSON.parse(res.text);

      if (data && data.parks) {
        setAiParks(data.parks.map((p: any) => ({
          ...p,
          id: `park-${Math.random().toString(36).substr(2, 5)}`,
          isAiDiscovered: true,
          lat: Number(p.lat),
          lng: Number(p.lng)
        })));
        setCuratorText(data.curatorVibe || "");
      }
    } catch (e: any) {
      setError("Er ging iets mis bij het verwerken van de kunstlocaties: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const toggleRadar = useCallback(() => {
    if (!isNearbyMode) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setIsNearbyMode(true);
          performSearch("", loc.lat, loc.lng);
        },
        () => alert("Zet je GPS aan voor de radarfunctie.")
      );
    } else {
      setIsNearbyMode(false);
      setUserLocation(null);
      setAiParks([]);
      setHasSearched(false);
    }
  }, [isNearbyMode, performSearch]);

  const sortedParks = useMemo(() => {
    return aiParks.map(p => ({
      ...p,
      distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) : undefined
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [aiParks, userLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9]">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-compass"></i>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 serif tracking-tight">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
          </div>
          {(hasSearched || isNearbyMode) && (
            <div className="w-full max-w-xl">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={() => performSearch(searchTerm)} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {!hasSearched && !isNearbyMode ? (
          <div className="text-center py-24 max-w-2xl mx-auto">
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
              Powered by Gemini 3 Pro
            </div>
            <h2 className="text-6xl font-bold text-stone-900 serif mb-6 leading-[1.1]">Ontdek kunst in de <span className="italic text-blue-600">buitenlucht.</span></h2>
            <p className="text-stone-500 mb-12 text-xl font-light leading-relaxed">Scan steden of gebruik de radar voor beeldenparken in jouw omgeving.</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={() => performSearch(searchTerm)} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {error && (
              <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl text-red-900 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div>
                  <p className="font-bold text-sm">Systeemfout</p>
                  <p className="text-sm opacity-70">{error}</p>
                </div>
              </div>
            )}

            {curatorText && !isAiLoading && !error && (
              <div className="mb-10 p-10 bg-white border border-stone-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <p className="text-stone-800 text-xl italic serif leading-relaxed relative z-10">
                  {curatorText}
                </p>
                <i className="fas fa-quote-right absolute bottom-4 right-8 text-stone-50 text-8xl -z-0"></i>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {!isAiLoading && sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={setSelectedPark} />
              ))}
              
              {isAiLoading && (
                 <div className="col-span-full py-32 text-center">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-satellite text-blue-600 animate-pulse"></i>
                      </div>
                    </div>
                    <p className="mt-8 text-stone-400 font-medium serif text-2xl italic">Radar scant Europa...</p>
                 </div>
              )}
            </div>
            
            {!isAiLoading && sortedParks.length === 0 && !error && (
              <div className="text-center py-20 text-stone-400">
                <i className="fas fa-map-marked-alt text-4xl mb-4 opacity-20"></i>
                <p>Geen locaties gevonden. Probeer een andere stad.</p>
              </div>
            )}
          </div>
        )}
      </main>
      {selectedPark && <ParkDetail park={selectedPark} onClose={() => setSelectedPark(null)} />}
    </div>
  );
};

export default App;
