import React from 'react';
import { ScanEye, Sparkles, AlertCircle } from 'lucide-react';

interface AnalysisCardProps {
  isLoading: boolean;
  analysis: string | null;
  error: string | null;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ isLoading, analysis, error }) => {
  if (!isLoading && !analysis && !error) return null;

  return (
    <div className="w-full bg-[#111827] rounded-xl p-1 shadow-lg border border-gray-800 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-3 border-b border-gray-800/50 flex items-center gap-2">
        <ScanEye size={18} className="text-blue-400" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
          Analiza Obrazu AI
        </h3>
      </div>

      <div className="p-4 text-sm text-gray-300">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 animate-pulse">Analizuję zawartość zdjęcia...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400 py-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="flex items-start gap-2 mb-2 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                <Sparkles size={16} className="text-yellow-400 mt-1 shrink-0" />
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {analysis}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;