
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
        placeholder="Zoek een stad of regio (bijv. 'Spanje')..."
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
        className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
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
      const locationPrompt = query || (lat && lng ? `de coördinaten ${lat}, ${lng}` : "Spanje");
      const prompt = `Geef een lijst van minimaal 12 beeldenparken en openlucht kunstlocaties in ${locationPrompt}. Reageer uitsluitend in JSON formaat zoals gevraagd.`;
      
      const res = await askGemini(prompt, []);
      
      if (res.text === "ERROR") {
        setError(res.error || "De AI kon de informatie niet ophalen.");
        return;
      }

      const data = JSON.parse(res.text);

      if (data && data.parks && data.parks.length > 0) {
        setAiParks(data.parks.map((p: any) => ({
          ...p,
          id: `park-${Math.random().toString(36).substr(2, 7)}`,
          isAiDiscovered: true,
          lat: Number(p.lat),
          lng: Number(p.lng)
        })));
        setCuratorText(data.curatorVibe || "Ik heb deze kunstlocaties voor je gevonden.");
      } else {
        setError("Geen resultaten gevonden voor deze locatie. Probeer een andere stad of land.");
      }
    } catch (e: any) {
      console.error("Parse error:", e);
      setError("Er ging iets mis bij het verwerken van de gegevens. Probeer het nog eens.");
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
        () => alert("Zet je locatie aan in je browserinstellingen om de radar te gebruiken.")
      );
    } else {
      setIsNearbyMode(false);
      setUserLocation(null);
      setAiParks([]);
      setHasSearched(false);
      setError(null);
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
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg transform hover:rotate-12 transition-transform">
              <i className="fas fa-eye"></i>
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
          <div className="text-center py-20 max-w-3xl mx-auto">
            <div className="inline-block px-4 py-2 mb-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
              Intelligente Kunst Detectie
            </div>
            <h2 className="text-6xl font-bold text-stone-900 serif mb-8 leading-[1.1]">Ontdek de mooiste <span className="italic text-blue-600">beeldenparken.</span></h2>
            <p className="text-stone-500 mb-12 text-xl font-light leading-relaxed max-w-xl mx-auto italic">Vind verborgen kunstwerken en monumentale sculpturen in heel Europa.</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={() => performSearch(searchTerm)} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {error && (
              <div className="mb-8 p-8 bg-amber-50 border border-amber-100 rounded-[2rem] text-amber-900 flex items-center gap-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <i className="fas fa-info-circle text-xl"></i>
                </div>
                <div>
                  <p className="font-bold text-base mb-1">Informatie</p>
                  <p className="text-sm opacity-80 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {curatorText && !isAiLoading && !error && (
              <div className="mb-12 p-10 bg-white border border-stone-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 group-hover:w-3 transition-all"></div>
                <p className="text-stone-800 text-2xl italic serif leading-relaxed relative z-10">
                  "{curatorText}"
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
                      <div className="w-24 h-24 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-compass text-blue-600 text-2xl animate-pulse"></i>
                      </div>
                    </div>
                    <p className="mt-10 text-stone-400 font-medium serif text-2xl italic tracking-wide">De radar scant de regio op kunst...</p>
                 </div>
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
