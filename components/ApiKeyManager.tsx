import React, { useEffect, useState } from 'react';
import { checkApiKeyStatus, requestApiKeySelection } from '../services/geminiService';
import { KeyRound } from 'lucide-react';

interface ApiKeyManagerProps {
  onReady: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);

  const verifyKey = async () => {
    const status = await checkApiKeyStatus();
    setHasKey(status);
    if (status) {
      onReady();
    }
  };

  useEffect(() => {
    verifyKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    await requestApiKeySelection();
    // We assume success after triggering the dialog as per instructions, 
    // but we can double check in a real app. 
    // Here we optimistically update or re-verify.
    setTimeout(verifyKey, 1000); 
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl shadow-blue-900/20">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <KeyRound className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Wymagany Klucz API</h2>
        <p className="text-gray-400 mb-6">
          Aby korzystać z modelu <strong>Gemini Nano Banana Pro</strong> (Preview), musisz połączyć własny klucz API z płatnego projektu Google Cloud.
        </p>
        
        <button
          onClick={handleConnect}
          className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
        >
          Połącz Klucz API
        </button>
        
        <div className="mt-6 text-xs text-gray-500">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-blue-400">
                Informacje o rozliczeniach
            </a>
        </div>
      </div>
    </div>
  );
};