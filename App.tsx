import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadCard from './components/UploadCard';
import PromptCard from './components/PromptCard';
import ResultCard from './components/ResultCard';
import PricingModal from './components/PricingModal';
import AnalysisCard from './components/AnalysisCard';
import { ApiKeyManager } from './components/ApiKeyManager';
import { UploadedFile, GenerationState, UserProfile } from './types';
import { generateTransformedImage, requestApiKeySelection, analyzeImage, enhancePrompt } from './services/geminiService';
import { authService } from './services/authService';
import { Box, Wand2, Lock, LogIn } from 'lucide-react';

const App: React.FC = () => {
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  
  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // UI State
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    resultImage: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
    }
  }, []);

  const handleLogin = async () => {
    try {
        const loggedUser = await authService.loginWithGoogle();
        setUser(loggedUser);
    } catch (error) {
        console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAnalysisResult(null);
    if (currentFile) URL.revokeObjectURL(currentFile.previewUrl);
    setCurrentFile(null);
    setPrompt('');
  };

  const handlePurchase = (amount: number) => {
    if (!user) {
        handleLogin();
        return;
    }
    const updatedUser = authService.updateCredits(user.id, amount);
    setUser(updatedUser);
    setGenerationState(prev => ({ ...prev, error: null })); // Clear error if they were blocked by credits
  };

  const handleFileSelect = async (file: UploadedFile) => {
    // Release the previous preview so repeated uploads don't leak blob URLs
    if (currentFile) URL.revokeObjectURL(currentFile.previewUrl);
    setCurrentFile(file);
    
    // Reset analysis state for new file
    setAnalysisResult(null);
    setAnalysisError(null);
    
    if (!isApiKeyReady) {
      setAnalysisError('Połącz klucz API, aby przeanalizować zdjęcie.');
      return;
    }

    // Trigger Analysis
    setIsAnalyzing(true);
    try {
        const result = await analyzeImage(file.base64, file.mimeType);
        setAnalysisResult(result);
    } catch (error) {
        console.error("Analysis failed", error);
        setAnalysisError("Nie udało się przeanalizować zdjęcia.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!isApiKeyReady || !prompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const improved = await enhancePrompt(
        prompt,
        currentFile?.base64,
        currentFile?.mimeType
      );
      setPrompt(improved);
    } catch (error) {
      console.error('Enhance failed', error);
      setGenerationState(prev => ({ ...prev, error: 'Nie udało się ulepszyć opisu.' }));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    // 0. Check Auth
    if (!user) {
        handleLogin();
        return;
    }

    // 1. Check Credits
    if (user.credits <= 0) {
        setIsPricingOpen(true);
        return;
    }

    // 2. Validation
    if (!currentFile) {
      setGenerationState(prev => ({ ...prev, error: 'Proszę wgrać zdjęcie.' }));
      return;
    }
    if (!prompt.trim()) {
        setGenerationState(prev => ({ ...prev, error: 'Proszę opisać wizję.' }));
        return;
    }

    // 3. Generation Process
    setGenerationState({ isLoading: true, error: null, resultImage: null });
    
    // Deduct credit optimistically
    const updatedUser = authService.updateCredits(user.id, -1);
    setUser(updatedUser);

    try {
      const result = await generateTransformedImage(
        currentFile.base64,
        currentFile.mimeType,
        prompt,
        currentFile.width,
        currentFile.height
      );
      setGenerationState({ isLoading: false, error: null, resultImage: result });
    } catch (err: any) {
      console.error(err);
      
      // Refund credit on failure
      const refundedUser = authService.updateCredits(user.id, 1);
      setUser(refundedUser);
      
      if (err.message === "KEY_ERROR") {
          setIsApiKeyReady(false);
          await requestApiKeySelection();
          setGenerationState({ 
            isLoading: false, 
            error: "Sesja klucza API wygasła. Proszę wybrać klucz ponownie.", 
            resultImage: null 
          });
      } else {
          setGenerationState({ 
            isLoading: false, 
            error: 'Wystąpił błąd podczas generowania. Spróbuj ponownie.', 
            resultImage: null 
          });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] font-sans text-white selection:bg-blue-500/30">
      <ApiKeyManager onReady={() => setIsApiKeyReady(true)} />
      
      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)}
        onPurchase={handlePurchase}
      />

      <Header 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onAddCredits={() => setIsPricingOpen(true)} 
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            
            <UploadCard 
              currentFile={currentFile} 
              onFileSelect={handleFileSelect} 
            />

            <AnalysisCard 
                isLoading={isAnalyzing}
                analysis={analysisResult}
                error={analysisError}
            />

            <PromptCard 
              prompt={prompt} 
              setPrompt={setPrompt} 
              onEnhance={handleEnhancePrompt}
              isEnhancing={isEnhancing}
              canEnhance={isApiKeyReady}
            />

            {/* Action Section */}
            <div className="w-full bg-[#111827] rounded-xl p-1 shadow-lg border border-gray-800 mt-6">
               <div className="p-4 border-b border-gray-800/50 mb-2 text-center">
                   <h2 className="text-lg font-bold text-white uppercase tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                   ZOBACZ JAK TO WYGLĄDA
                   </h2>
               </div>
               <div className="p-4 flex flex-col gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!isApiKeyReady || generationState.isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2
                        ${generationState.isLoading 
                            ? 'bg-gray-600 cursor-not-allowed' 
                            : (user && user.credits > 0)
                                ? 'bg-gradient-to-r from-[#3b82f6] to-[#9333ea] hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20'
                                : !user 
                                    ? 'bg-white text-black hover:bg-gray-200'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200'
                        }
                    `}
                  >
                    {generationState.isLoading ? (
                        'Generowanie...'
                    ) : !user ? (
                        <>
                            Zaloguj się, aby generować <LogIn size={20} />
                        </>
                    ) : user.credits > 0 ? (
                        <>
                            Generuj Projekt (1 Kredyt) <Wand2 size={20} />
                        </>
                    ) : (
                        <>
                            Doładuj Kredyty <Lock size={20} />
                        </>
                    )}
                  </button>

                  <button
                    disabled
                    title="Funkcja w przygotowaniu"
                    className="w-full py-3 px-4 rounded-lg font-bold text-lg border border-gray-700 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     <Box size={20} /> ZOBACZ W 3D
                     <span className="text-xs font-normal uppercase tracking-wider">(wkrótce)</span>
                  </button>
               </div>
               
               {generationState.error && (
                   <div className="px-4 pb-4 text-red-400 text-sm text-center">
                       {generationState.error}
                   </div>
               )}
            </div>

          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
             <ResultCard 
                resultImage={generationState.resultImage} 
                isLoading={generationState.isLoading} 
             />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;