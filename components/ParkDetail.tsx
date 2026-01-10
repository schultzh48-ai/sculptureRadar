
import React, { useEffect, useState } from 'react';
import { SculpturePark } from '../types';
import { getDeepDive } from '../services/gemini';

interface ParkDetailProps {
  park: SculpturePark & { 
    searchOrigin?: { lat: number, lng: number },
    isSolitary?: boolean 
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
      setDeepDiveText("Fout bij ophalen.");
    } finally {
      setIsLoadingDeepDive(false);
    }
  };

  const getNavigationUrl = () => {
    const destination = `${park.lat},${park.lng}`;
    const destinationName = encodeURIComponent(park.name);
    
    if (park.searchOrigin) {
      const origin = `${park.searchOrigin.lat},${park.searchOrigin.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&destination_place_id=${destinationName}`;
    }
    
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${destinationName}`;
  };
  
  const buildDeepSearchUrl = () => {
    const query = `${park.name} ${park.location} artwork documentation history`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&source=ai-overview&udm=14`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh]">
        <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-start bg-white/95 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${park.isSolitary ? 'text-amber-600' : 'text-blue-600'}`}>
                {park.isLandArt ? 'Land Art Project' : park.isSolitary ? 'Sculptuur' : 'Beeldenpark / Museum'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-stone-900 serif leading-tight">{park.name}</h2>
            <p className="text-stone-400 text-xs font-medium mt-1 uppercase tracking-wider italic">{park.location}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
          <div className="animate-in fade-in duration-500 mb-10">
            <p className="text-stone-600 text-lg leading-relaxed serif italic">
              {park.shortDescription}
            </p>
          </div>

          <div className="space-y-8">
            {!deepDiveText && (
              <button 
                onClick={handleDeepDive}
                disabled={isLoadingDeepDive}
                className={`w-full flex flex-col items-center justify-center gap-3 p-10 rounded-3xl text-white shadow-xl transition-all disabled:opacity-50 active:scale-[0.98] ${park.isSolitary ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
              >
                {isLoadingDeepDive ? (
                  <><i className="fas fa-circle-notch animate-spin text-3xl"></i><span className="font-bold uppercase tracking-widest text-[10px]">AI Scanner start...</span></>
                ) : (
                  <>
                    <i className={`fas ${park.isLandArt ? 'fa-mountain-sun' : park.isSolitary ? 'fa-monument' : 'fa-feather-pointed'} text-3xl`}></i>
                    <span className="font-bold uppercase tracking-widest text-[11px]">Start AI Analyse</span>
                  </>
                )}
              </button>
            )}

            {deepDiveText && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="flex flex-col gap-6 mb-8">
                  <div className={`p-8 bg-stone-50 rounded-3xl border border-stone-100 border-l-4 ${park.isSolitary ? 'border-l-amber-600' : 'border-l-blue-600'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <i className={`fas fa-bookmark text-sm ${park.isSolitary ? 'text-amber-600' : 'text-blue-600'}`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">AI Context</span>
                    </div>
                    <div className="text-stone-800 text-base leading-relaxed serif whitespace-pre-wrap italic">
                      {deepDiveText}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <a href={buildDeepSearchUrl()} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-5 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all text-center gap-2 group">
                      <i className={`fas fa-brain text-xl group-hover:scale-110 transition-transform ${park.isSolitary ? 'text-amber-400' : 'text-blue-400'}`}></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Open AI-Modus</span>
                    </a>
                    <a href={getNavigationUrl()} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center justify-center p-5 border rounded-2xl transition-all text-center gap-2 ${park.isSolitary ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
                      <i className="fas fa-location-arrow text-xl"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Route</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-10 mt-10 border-t border-stone-100 space-y-3">
             {park.website && park.website !== '#' && (
               <a href={park.website} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 p-5 border border-stone-200 text-stone-900 rounded-2xl hover:bg-stone-50 transition-all font-bold text-xs">
                  <i className="fas fa-globe text-stone-400"></i> Bezoek officiële website
                </a>
             )}
             
             {!deepDiveText && (
               <a href={getNavigationUrl()} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 p-5 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all font-bold text-xs shadow-lg shadow-stone-200">
                  <i className={`fas fa-location-arrow ${park.isSolitary ? 'text-amber-400' : 'text-blue-400'}`}></i> Bekijk op de kaart
                </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
