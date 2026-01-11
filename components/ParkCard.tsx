
import React from 'react';
import { SculpturePark } from '../types';

interface ParkCardProps {
  park: SculpturePark & { isAiDiscovered?: boolean, distance?: number, isSolitary?: boolean, isInteractive?: boolean };
  onClick: (park: SculpturePark) => void;
}

export const ParkCard = React.memo<ParkCardProps>(({ park, onClick }) => {
  const isLandArt = park.isLandArt || (park.shortDescription && park.shortDescription.toLowerCase().includes('land art'));
  const isInteractive = park.isInteractive || (park.shortDescription && (park.shortDescription.toLowerCase().includes('interactief') || park.shortDescription.toLowerCase().includes('ademt')));
  const isIcon = park.isSolitary || park.isInteractive;

  return (
    <div 
      onClick={() => onClick(park)}
      className="group cursor-pointer bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm transition-all hover:shadow-xl flex flex-col justify-between min-h-[280px]"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-stone-50 text-stone-400 rounded-lg">{park.location}</span>
            {isInteractive && (
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-cyan-50 text-cyan-600 rounded-lg">
                <i className="fas fa-microchip mr-1"></i>
                Interactief
              </span>
            )}
            {isLandArt && !isInteractive && (
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">
                <i className="fas fa-mountain-sun mr-1"></i>
                Land Art
              </span>
            )}
            {isIcon && !isInteractive && !isLandArt && (
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">
                <i className="fas fa-star mr-1"></i>
                Publiek Icoon
              </span>
            )}
            {park.distance !== undefined && (
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                <i className="fas fa-location-dot mr-1"></i>
                {park.distance.toFixed(1)} km
              </span>
            )}
          </div>
          {park.isAiDiscovered && (
            <span className="text-[10px] text-blue-200 font-bold">AI</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-stone-900 leading-tight serif mb-2 group-hover:text-blue-600">
          {park.name}
        </h3>
        <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed italic">
          {park.shortDescription}
        </p>
      </div>
      
      <div className="pt-4 flex items-center justify-between border-t border-stone-50 mt-4">
        <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">
          {isIcon ? 'Bekijk Kunstwerk' : 'Bekijk Details'}
        </span>
        <i className="fas fa-arrow-right text-[10px] text-stone-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
      </div>
    </div>
  );
});
