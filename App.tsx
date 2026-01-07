
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
        className={`px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${isNearbyMode ? 'bg-red-500 text-white' : 'bg-stone-900 text-white'}`}
      >
        <i className="fas fa-crosshairs mr-2"></i>
        {isNearbyMode ? 'Radar Aan' : 'Radar'}
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
      const locationContext = query ? `in de buurt van ${query}` : `rondom de coördinaten ${lat}, ${lng}`;
      const prompt = `Zoek minimaal 15 beeldenparken en land-art locaties ${locationContext}. Reageer alleen met de gevraagde JSON.`;
      
      const res = await askGemini(prompt, []);
      
      if (res.text === "ERROR") {
        setError(res.error || "De AI-service kon niet worden gestart. Controleer of de API_KEY correct is ingesteld.");
        return;
      }

      let data;
      try {
        data = JSON.parse(res.text);
      } catch (parseError) {
        console.error("JSON Parse Error:", res.text);
        setError("De AI gaf geen geldig resultaat terug. Probeer het opnieuw.");
        return;
      }

      if (data && data.parks && Array.isArray(data.parks)) {
        const results = data.parks.map((p: any) => ({ 
          ...p, 
          id: `ai-${Math.random().toString(36).substr(2, 9)}`, 
          isAiDiscovered: true,
          lat: parseFloat(p.lat) || 0,
          lng: parseFloat(p.lng) || 0
        }));
        setAiParks(results);
        setCuratorText(data.curatorVibe || 'Ik heb de volgende locaties voor je gevonden.');
      } else {
        setError("Er zijn geen specifieke beeldenparken gevonden voor deze zoekopdracht.");
      }
    } catch (e: any) {
      setError("Er is een probleem opgetreden bij het laden van de kunst: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const toggleRadar = useCallback(() => {
    if (!isNearbyMode) {
      if (!navigator.geolocation) {
        alert("Geolocatie wordt niet ondersteund.");
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setIsNearbyMode(true);
        performSearch("", loc.lat, loc.lng);
      }, (err) => {
        alert("Locatie-toegang geweigerd. Zoek handmatig op een stad.");
      });
    } else {
      setIsNearbyMode(false);
      setUserLocation(null);
      setAiParks([]);
      setCuratorText('');
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
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-radar"></i>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 serif">Sculptuur<span className="text-blue-600 italic">Radar</span></h1>
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
            <h2 className="text-5xl font-bold text-stone-900 serif mb-6 animate-in fade-in zoom-in duration-700">Ontdek kunst in de open lucht.</h2>
            <p className="text-stone-500 mb-10 text-lg italic animate-in fade-in slide-in-from-bottom-4 duration-1000">Scan elke regio voor beeldenparken en land-art.</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={() => performSearch(searchTerm)} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                <i className="fas fa-key text-amber-500 mt-1"></i>
                <div>
                  <p className="text-sm font-bold uppercase tracking-tight mb-1">Configuratie-opmerking</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            )}

            {curatorText && !isAiLoading && !error && (
              <div className="mb-10 p-8 bg-white border border-stone-100 rounded-3xl shadow-sm border-l-4 border-l-blue-600">
                <p className="text-stone-800 text-lg italic serif leading-relaxed">
                  <i className="fas fa-quote-left text-blue-100 mr-3 text-2xl"></i>
                  {curatorText}
                </p>
              </div>
            )}

            <div className="mb-8 flex justify-between items-end">
              {!error && (
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 serif">
                    {isAiLoading ? 'De radar scant...' : `${sortedParks.length} Locaties gevonden`}
                  </h2>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {!isAiLoading && sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={setSelectedPark} />
              ))}
              
              {isAiLoading && (
                 <div className="col-span-full py-20 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-stone-500 font-medium serif text-xl italic">Bezig met scannen van de regio...</p>
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
