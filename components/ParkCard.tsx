
import React from 'react';
import { SculpturePark } from '../types';

interface ParkCardProps {
  park: SculpturePark & { distance?: number, isAiDiscovered?: boolean, isSolitary?: boolean };
  onClick: (park: SculpturePark) => void;
}

export const ParkCard = React.memo<ParkCardProps>(({ park, onClick }) => {
  return (
    <div 
      onClick={() => onClick(park)}
      className={`group cursor-pointer bg-white rounded-[2rem] p-7 border transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between min-h-[280px] relative overflow-hidden ${park.isAiDiscovered ? 'border-blue-100 shadow-sm shadow-blue-50' : 'border-stone-100 shadow-sm shadow-stone-100'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] uppercase tracking-widest font-black px-2.5 py-1 bg-stone-50 text-stone-400 rounded-lg">{park.location}</span>
            {park.isLandArt ? (
              <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-emerald-100">Land Art</span>
            ) : park.isSolitary ? (
              <span className="bg-amber-50 text-amber-600 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-amber-100">Sculptuur</span>
            ) : (
              <span className="bg-blue-50 text-blue-600 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-blue-100">Park/Museum</span>
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-stone-900 leading-tight serif mb-3 group-hover:text-blue-600 transition-colors">
          {park.name}
        </h3>
        <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed font-medium">
          {park.shortDescription}
        </p>
      </div>

      <div className="pt-6 mt-auto">
        <div className="w-full flex items-center text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
          <span>Bekijk Analyse</span>
          <i className="fas fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 transition-all"></i>
        </div>
      </div>
    </div>
  );
});
