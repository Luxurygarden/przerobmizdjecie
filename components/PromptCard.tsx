import React from 'react';
import { Sparkles, Eraser, Loader2 } from 'lucide-react';

interface PromptCardProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
  canEnhance: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, setPrompt, onEnhance, isEnhancing, canEnhance }) => {
  return (
    <div className="w-full bg-[#111827] rounded-xl p-1 shadow-lg border border-gray-800 mt-6">
       <div className="p-4 border-b border-gray-800/50 mb-2 flex justify-between items-center relative">
         <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            Twoja Wizja
            </h2>
         </div>
         <div className="absolute right-4 flex gap-2">
            <button
                onClick={onEnhance}
                disabled={!canEnhance || !prompt.trim() || isEnhancing}
                className="p-1.5 rounded-full bg-[#1f2937] hover:bg-[#374151] text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1f2937]"
                title="Ulepsz opis przez AI"
            >
                {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
            <button
                onClick={() => setPrompt('')}
                disabled={!prompt}
                className="p-1.5 rounded-full bg-[#1f2937] hover:bg-[#374151] text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1f2937]"
                title="Wyczyść opis"
            >
                <Eraser size={16} />
            </button>
         </div>
      </div>

      <div className="m-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Dobra wizja zawiera kontekst (np. ogród przy domu jednorodzinnym), przeznaczenie (np. rekreacyjny) i konkretne zmiany. Przykład: Zaproponuj nowoczesną aranżację tarasu z wielkoformatowych płyt betonowych przy domu..."
          disabled={isEnhancing}
          className="w-full h-40 bg-[#1a2236] text-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder-gray-500 border border-gray-700/50"
        />
      </div>
    </div>
  );
};

export default PromptCard;