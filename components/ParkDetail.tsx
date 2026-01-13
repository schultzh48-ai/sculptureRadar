
import React, { useEffect, useState } from 'react';
import { SculpturePark } from '../types';
import { getDeepDive } from '../services/gemini';

interface ParkDetailProps {
  park: SculpturePark & { 
    searchOrigin?: { lat: number, lng: number },
    isSolitary?: boolean,
    isInteractive?: boolean
  };
  onClose: () => void;
}

export const ParkDetail: React.FC<ParkDetailProps> = ({ park, onClose }) => {
  const [deepDiveText, setDeepDiveText] = useState<string | null>(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleDeepDive = async () => {
    setIsLoadingDeepDive(true);
    try {
      const text = await getDeepDive(park.name, park.location);
      setDeepDiveText(text || "Geen details gevonden.");
    } catch (e) {
      setDeepDiveText("Informatie tijdelijk niet beschikbaar.");
    } finally {
      setIsLoadingDeepDive(false);
    }
  };

  const getNavigationUrl = () => {
    const destLat = park.lat;
    const destLng = park.lng;
    
    // Google Maps URL format voor route:
    // https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&origin=LAT,LNG
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    
    if (park.searchOrigin) {
      url += `&origin=${park.searchOrigin.lat},${park.searchOrigin.lng}`;
    }
    
    return url;
  };
  
  const buildDeepSearchUrl = () => {
    const query = `${park.name} ${park.location} kunstwerk collectie informatie`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  const isLandArt = park.isLandArt || park.name.toLowerCase().includes('land art') || park.shortDescription.toLowerCase().includes('land art');
  const isInteractive = park.isInteractive;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md transition-opacity duration-500" onClick={onClose}></div>
      
      <div className="relative bg-[#fcfcfb] w-full max-w-2xl overflow-hidden rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 fade-in duration-300">
        <div className="px-10 py-10 border-b border-stone-100 flex justify-between items-start bg-white/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[9px] uppercase tracking-[0.25em] font-black px-4 py-1.5 rounded-full ${isInteractive ? 'bg-cyan-100 text-cyan-700' : isLandArt ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {isInteractive ? 'Interactief Kunstwerk' : isLandArt ? 'Land Art Monument' : 'Openlucht Museum'}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-stone-900 serif leading-tight tracking-tight">{park.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <i className="fas fa-location-dot text-[10px] text-blue-500"></i>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest italic">{park.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all hover:rotate-90">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="mb-12">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-4">Context</h4>
            <p className="text-stone-600 text-xl leading-relaxed serif italic border-l-2 border-stone-100 pl-6">
              {park.shortDescription}
            </p>
          </div>

          <div className="space-y-8">
            {!deepDiveText && !isLoadingDeepDive && (
              <div className="bg-white p-1 rounded-[2.5rem] shadow-sm border border-stone-100">
                <button 
                  onClick={handleDeepDive}
                  className={`w-full flex flex-col items-center justify-center gap-4 p-12 rounded-[2.2rem] text-white transition-all active:scale-[0.98] relative overflow-hidden group ${isInteractive ? 'bg-cyan-600 hover:bg-cyan-700' : isLandArt ? 'bg-amber-600 hover:bg-amber-700' : 'bg-stone-900 hover:bg-blue-600'}`}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <i className={`fas ${isInteractive ? 'fa-microchip' : isLandArt ? 'fa-mountain-sun' : 'fa-feather-pointed'} text-2xl`}></i>
                  </div>
                  <div className="text-center">
                    <span className="block font-black uppercase tracking-widest text-[11px] mb-1">Ontrafel het verhaal</span>
                    <span className="text-[10px] opacity-60 font-medium tracking-wide">De AI Curator verifieert nu de diepere betekenis</span>
                  </div>
                </button>
              </div>
            )}

            {isLoadingDeepDive && (
              <div className="space-y-6 animate-pulse p-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-4 w-32 bg-stone-100 rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-stone-100 rounded w-full"></div>
                  <div className="h-4 bg-stone-100 rounded w-5/6"></div>
                  <div className="h-4 bg-stone-100 rounded w-4/6"></div>
                </div>
                <div className="flex flex-col items-center py-8">
                  <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Archieven worden geraadpleegd...</span>
                </div>
              </div>
            )}

            {deepDiveText && !isLoadingDeepDive && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col gap-10 mb-12">
                  <div className="prose prose-stone max-w-none">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-[1px] flex-1 bg-stone-100"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 italic">Curator Inzicht</span>
                      <div className="h-[1px] flex-1 bg-stone-100"></div>
                    </div>
                    <div className="text-stone-800 text-lg leading-relaxed serif whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-stone-900">
                      {deepDiveText}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <a href={getNavigationUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 group">
                      <i className="fas fa-location-arrow group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">Plan Route</span>
                    </a>
                    <a href={buildDeepSearchUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-6 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all group">
                      <i className="fas fa-search text-[10px]"></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">Verdieping</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-stone-50/50 border-t border-stone-100 flex items-center justify-center gap-6">
          {park.website && park.website !== '#' && !isLandArt && (
            <>
              <a href={park.website} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <i className="fas fa-external-link-alt"></i> Officiële Bron
              </a>
              <div className="h-4 w-[1px] bg-stone-200"></div>
            </>
          )}
          <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Sluiten</button>
        </div>
      </div>
    </div>
  );
};
