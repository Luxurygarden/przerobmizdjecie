import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadCard from './components/UploadCard';
import PromptCard from './components/PromptCard';
import ResultCard from './components/ResultCard';
import PricingModal from './components/PricingModal';
import AnalysisCard from './components/AnalysisCard';
import AuthModal from './components/AuthModal';
import { UploadedFile, GenerationState, UserProfile } from './types';
import { analyzeImage, generateTransformedImage } from './services/aiService';
import { authService } from './services/authService';
import { supabase } from './services/supabaseClient';
import { Box, Wand2, Lock, LogIn } from 'lucide-react';

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // UI State
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    resultImage: null,
  });

  // Restore session on mount and keep it in sync
  useEffect(() => {
    authService.getCurrentUser().then(setUser);

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      authService.refreshCredits(session.user.id).then(setUser).catch(() => setUser(null));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const loggedUser = await authService.signIn(email, password);
    setUser(loggedUser);
    setIsAuthOpen(false);
  };

  const handleSignUp = async (email: string, password: string) => {
    const { user: newUser, needsEmailConfirmation } = await authService.signUp(email, password);
    if (newUser) {
      setUser(newUser);
      setIsAuthOpen(false);
    }
    return { needsEmailConfirmation };
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setAnalysisResult(null);
    setCurrentFile(null);
    setPrompt('');
  };

  const refreshCredits = async () => {
    if (!user) return;
    try {
      const refreshed = await authService.refreshCredits(user.id);
      setUser(refreshed);
    } catch {
      // ignore transient refresh failures
    }
  };

  const handleFileSelect = async (file: UploadedFile) => {
    setCurrentFile(file);

    // Reset analysis state for new file
    setAnalysisResult(null);
    setAnalysisError(null);

    if (!user) return;

    // Trigger Analysis
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(file.base64, file.mimeType);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed', error);
      setAnalysisError('Nie udało się przeanalizować zdjęcia.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    // 0. Check Auth
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    // 1. Check Credits
    if (user.credits <= 0) {
      setIsPricingOpen(true);
      return;
    }

    // 2. Validation
    if (!currentFile) {
      setGenerationState((prev) => ({ ...prev, error: 'Proszę wgrać zdjęcie.' }));
      return;
    }
    if (!prompt.trim()) {
      setGenerationState((prev) => ({ ...prev, error: 'Proszę opisać wizję.' }));
      return;
    }

    // 3. Generation Process (credits are checked and deducted server-side, atomically)
    setGenerationState({ isLoading: true, error: null, resultImage: null });

    try {
      const result = await generateTransformedImage(currentFile.base64, currentFile.mimeType, prompt);
      setGenerationState({ isLoading: false, error: null, resultImage: result });
      await refreshCredits();
    } catch (err: any) {
      console.error(err);
      await refreshCredits();

      if (err.message === 'INSUFFICIENT_CREDITS') {
        setIsPricingOpen(true);
        setGenerationState({ isLoading: false, error: null, resultImage: null });
      } else if (err.message === 'UNAUTHORIZED') {
        setUser(null);
        setIsAuthOpen(true);
        setGenerationState({ isLoading: false, error: null, resultImage: null });
      } else {
        setGenerationState({
          isLoading: false,
          error: 'Wystąpił błąd podczas generowania. Spróbuj ponownie.',
          resultImage: null,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] font-sans text-white selection:bg-blue-500/30">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onPurchase={() => setIsPricingOpen(false)}
      />

      <Header
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onAddCredits={() => setIsPricingOpen(true)}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <UploadCard currentFile={currentFile} onFileSelect={handleFileSelect} />

            <AnalysisCard isLoading={isAnalyzing} analysis={analysisResult} error={analysisError} />

            <PromptCard prompt={prompt} setPrompt={setPrompt} />

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
                  disabled={generationState.isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2
                        ${
                          generationState.isLoading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : user && user.credits > 0
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

                <button className="w-full py-3 px-4 rounded-lg font-bold text-lg border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <Box size={20} /> ZOBACZ W 3D
                </button>
              </div>

              {generationState.error && (
                <div className="px-4 pb-4 text-red-400 text-sm text-center">{generationState.error}</div>
              )}
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <ResultCard resultImage={generationState.resultImage} isLoading={generationState.isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
