
import React, { useEffect } from 'react';
import { SculpturePark } from '../types';

interface ParkDetailProps {
  park: SculpturePark & { distance?: number };
  onClose: () => void;
}

export const ParkDetail: React.FC<ParkDetailProps> = ({ park, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Google Maps Directions URL: saddr=Current+Location (of leeg laten) en daddr=bestemming
  const googleMapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&destination_place_id=${encodeURIComponent(park.name)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{park.location}</span>
              {park.distance !== undefined && (
                <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  <i className="fas fa-location-arrow mr-1 scale-75"></i>
                  {park.distance.toFixed(1)} km van jou
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-stone-900 serif">{park.name}</h2>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-stone-900 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <p className="text-stone-600 leading-relaxed mb-8">{park.shortDescription}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Locatie Info</span>
              <span className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-stone-300"></i>
                {park.location}
              </span>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Coördinaten</span>
              <span className="text-xs font-mono text-stone-600">{park.lat.toFixed(4)}, {park.lng.toFixed(4)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Interactie</h4>
            <a href={park.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-stone-900 transition-colors">
                  <i className="fas fa-globe text-xs"></i>
                </div>
                <span className="text-sm font-bold text-stone-800">Officiële Website</span>
              </div>
              <i className="fas fa-external-link-alt text-stone-300 group-hover:text-stone-900 transition-colors"></i>
            </a>
            <a href={googleMapsRouteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50/30 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <i className="fas fa-directions text-xs"></i>
                </div>
                <span className="text-sm font-bold text-stone-800">Route plannen via Google Maps</span>
              </div>
              <i className="fas fa-location-arrow text-blue-300 group-hover:text-blue-600 transition-colors"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
