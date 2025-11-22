import React from 'react';
import { Building2, Loader2 } from 'lucide-react';

interface ResultCardProps {
  resultImage: string | null;
  isLoading: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ resultImage, isLoading }) => {
  return (
    <div className="w-full bg-[#111827] rounded-xl p-1 shadow-lg border border-gray-800 mt-6 h-full min-h-[400px] flex flex-col">
       {/* If result image exists, remove padding/headers to show full image, otherwise default layout */}
       {resultImage ? (
           <div className="w-full h-full rounded-lg overflow-hidden relative bg-black">
                <img 
                    src={resultImage} 
                    alt="Generated Design" 
                    className="w-full h-full object-contain"
                />
                <a 
                  href={resultImage} 
                  download="przerobione-zdjecie.png"
                  className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-colors"
                >
                  Pobierz
                </a>
           </div>
       ) : (
         <div className="flex flex-col items-center justify-center h-full p-8 text-center relative">
           {isLoading ? (
             <div className="flex flex-col items-center animate-pulse">
               <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Generuję wizualizację...</h3>
               <p className="text-gray-400">To może potrwać chwilę. Model myśli...</p>
             </div>
           ) : (
             <>
                <div className="mb-6">
                    <div className="w-20 h-20 border-2 border-gray-600 rounded-lg flex items-center justify-center mx-auto text-gray-600">
                        <Building2 size={40} strokeWidth={1} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    Tu pojawi się Twoja wizualizacja
                </h3>
                <p className="text-gray-400 max-w-md">
                    Po wgraniu zdjęcia i opisaniu wizji, Twój projekt ogrodu pojawi się tutaj.
                </p>
             </>
           )}
         </div>
       )}
    </div>
  );
};

export default ResultCard;