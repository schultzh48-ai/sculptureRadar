
import React from 'react';
import { SculpturePark } from '../types';

interface ParkCardProps {
  park: SculpturePark & { isAiDiscovered?: boolean };
  onClick: (park: SculpturePark) => void;
}

export const ParkCard = React.memo<ParkCardProps>(({ park, onClick }) => {
  return (
    <div 
      onClick={() => onClick(park)}
      className="group cursor-pointer bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm transition-all hover:shadow-xl flex flex-col justify-between min-h-[260px]"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
            <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-stone-50 text-stone-400 rounded-lg">{park.location}</span>
            {park.isLandArt && (
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">Land Art</span>
            )}
          </div>
          {park.isAiDiscovered && (
            <span className="text-[9px] text-blue-400 font-bold opacity-60">AI</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-stone-900 leading-tight serif mb-2 group-hover:text-blue-600">
          {park.name}
        </h3>
        <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
          {park.shortDescription}
        </p>
      </div>
      
      <div className="pt-4 flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Bekijken</span>
        <i className="fas fa-chevron-right text-[10px] text-stone-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
      </div>
    </div>
  );
});
