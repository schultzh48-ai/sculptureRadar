import React, { useState, useEffect } from 'react';
import { askArtistExpert } from '../services/gemini';

interface ArtistExpertProps {
  isVisible?: boolean;
}

export const ArtistExpert: React.FC<ArtistExpertProps> = ({ isVisible }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string, sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setQuery('');
      setResult(null);
    }
  }, [isVisible]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await askArtistExpert(query);
      setResult(res);
    } catch (err) {
      setResult({ text: "De expert kon de archieven momenteel niet bereiken.", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-32 pt-16 border-t border-stone-200">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-4">
            <i className="fas fa-certificate text-sm"></i>
          </div>
          <h3 className="text-3xl font-bold serif italic mb-3">Geverifieerde Kunst Expertise</h3>
          <p className="text-stone-500 serif italic">Stel een gerichte vraag over een kunstenaar of techniek. De AI doorzoekt actuele bronnen voor een feitelijk antwoord.</p>
        </div>

        <div className="bg-white rounded-[3rem] p-4 shadow-xl border border-stone-100 mb-12 focus-within:ring-2 ring-blue-500/10 transition-all">
          <form onSubmit={handleAsk} className="flex gap-2">
            <input 
              className="flex-1 px-8 py-4 outline-none text-base serif italic bg-transparent" 
              placeholder="Bijv: Welke invloed had Land Art op moderne architectuur?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-stone-900 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all disabled:opacity-30 flex items-center gap-3 shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <i className="fas fa-magnifying-glass-chart"></i>
              )}
              Raadpleeg
            </button>
          </form>
        </div>

        {loading && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 text-center py-10">
            <div className="inline-block w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">Data wordt geverifieerd...</p>
          </div>
        )}

        {result && !loading && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-4">
            <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">
                  <i className="fas fa-check"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 italic">Feitelijke Analyse</span>
              </div>
              <p className="text-stone-800 text-lg leading-relaxed serif">
                {result.text}
              </p>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="px-10 py-4 flex flex-wrap gap-4 items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Verwijzingen:</span>
                {result.sources.slice(0, 3).map((source: any, idx: number) => (
                  <a 
                    key={idx}
                    href={source.web?.uri || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold text-blue-500 hover:text-stone-900 transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50"
                  >
                    <i className="fas fa-link text-[8px]"></i>
                    {source.web?.title?.substring(0, 30) || 'Bron'}...
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};