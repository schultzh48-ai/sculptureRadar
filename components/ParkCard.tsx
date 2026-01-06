
import React from 'react';
import { SculpturePark } from '../types';

interface ParkCardProps {
  park: SculpturePark & { distance?: number, isAiDiscovered?: boolean };
  onClick: (park: SculpturePark) => void;
}

export const ParkCard = React.memo<ParkCardProps>(({ park, onClick }) => {
  return (
    <div 
      onClick={() => onClick(park)}
      className={`group cursor-pointer bg-white rounded-2xl p-5 border transition-all hover:shadow-xl flex flex-col justify-between min-h-[180px] ${park.isAiDiscovered ? 'border-blue-100 bg-blue-50/20' : 'border-stone-100 hover:border-stone-300'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1">
            <span className="text-[8px] uppercase tracking-widest font-black px-2 py-0.5 bg-stone-100 text-stone-500 rounded">{park.location}</span>
            {park.isAiDiscovered && (
              <span className="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Deep Search</span>
            )}
          </div>
          {park.distance !== undefined && (
            <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{park.distance.toFixed(1)} km</span>
          )}
        </div>
        <h3 className="text-base font-bold text-stone-900 leading-tight serif group-hover:text-stone-600 transition-colors mb-2">
          {park.name}
        </h3>
        <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">
          {park.shortDescription}
        </p>
      </div>
      <div className="pt-4 flex items-center text-[9px] font-black text-stone-300 group-hover:text-stone-900 transition-colors uppercase tracking-[0.2em]">
        Verken locatie <i className="fas fa-arrow-right ml-2 text-[8px]"></i>
      </div>
    </div>
  );
});
