
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
        placeholder="Zoek stad of regio..."
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
  const [status, setStatus] = useState<'idle' | 'error_key' | 'error_api'>('idle');

  const performSearch = useCallback(async (query: string, lat?: number, lng?: number) => {
    setAiParks([]);
    setCuratorText('');
    setHasSearched(true);
    setIsAiLoading(true);
    setStatus('idle');

    try {
      // De prompt vraagt nu om 15 locaties voor een uitgebreidere lijst
      const prompt = `Lijst minimaal 15 beeldenparken en openlucht kunstlocaties binnen 50 km van ${query || lat + ',' + lng}. Geef JSON object met 'curatorVibe' (max 2 zinnen tekst) and 'parks' (array met name, location, shortDescription, website, lat, lng).`;
      const res = await askGemini(prompt, []);
      
      if (res.text.includes("FOUT_SLEUTEL")) {
        setStatus('error_key');
        return;
      }
      
      const data = JSON.parse(res.text);
      if (data.parks) {
        let results = data.parks.map((p: any) => ({ 
          ...p, id: `ai-${Math.random()}`, isAiDiscovered: true 
        }));

        // Filter op 50km voor GPS-precisie
        if (lat && lng) {
          results = results.filter((p: any) => getDistance(lat, lng, p.lat, p.lng) <= 50);
        }
        setAiParks(results);
        setCuratorText(data.curatorVibe || '');
      } else {
        setStatus('error_api');
      }
    } catch (e) {
      console.error(e);
      setStatus('error_api');
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
        performSearch("", loc.lat, loc.lng);
      }, () => alert("GPS nodig voor radar."));
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
            <h2 className="text-5xl font-bold text-stone-900 serif mb-6">Ontdek kunst in de open lucht.</h2>
            <p className="text-stone-500 mb-10 text-lg italic">"De mooiste musea hebben geen dak."</p>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearchTrigger={() => performSearch(searchTerm)} toggleRadar={toggleRadar} isAiLoading={isAiLoading} isNearbyMode={isNearbyMode} />
          </div>
        ) : (
          <>
            {status === 'error_key' && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                <b>Configuratie nodig:</b> API-sleutel niet gevonden.
              </div>
            )}

            {curatorText && !isAiLoading && (
              <div className="mb-10 p-8 bg-white border border-stone-100 rounded-3xl shadow-sm border-l-4 border-l-blue-600">
                <p className="text-stone-800 text-lg italic serif leading-relaxed">
                  <i className="fas fa-quote-left text-blue-100 mr-3 text-2xl"></i>
                  {curatorText}
                </p>
              </div>
            )}

            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 serif">
                  {isAiLoading ? 'De radar scant...' : `${sortedParks.length} Locaties gevonden`}
                </h2>
                <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest font-bold">Max 50 km van bestemming</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedParks.map(park => (
                <ParkCard key={park.id} park={park} onClick={setSelectedPark} />
              ))}
              {isAiLoading && (
                 <div className="col-span-full py-20 text-center">
                    <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-stone-400 text-xs font-black uppercase tracking-widest">Diepgaande scan bezig...</p>
                 </div>
              )}
            </div>

            {!isAiLoading && sortedParks.length === 0 && (
              <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 italic serif text-lg">Geen locaties gevonden binnen de straal van 50 km.</p>
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
