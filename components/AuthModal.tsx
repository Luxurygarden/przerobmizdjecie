import React, { useState } from 'react';
import { X, Loader2, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
        setEmail('');
        setPassword('');
      } else {
        const { needsEmailConfirmation } = await onSignUp(email, password);
        if (needsEmailConfirmation) {
          setConfirmationSent(true);
        }
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'Nieprawidłowy e-mail lub hasło.'
        : err.message?.includes('Email not confirmed')
        ? 'Potwierdź adres e-mail klikając link, który wysłaliśmy.'
        : 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative bg-[#111827] border border-gray-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center">
          <button
            onClick={() => { setConfirmationSent(false); onClose(); }}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <Mail size={32} className="mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-bold text-white mb-2">Sprawdź skrzynkę e-mail</h2>
          <p className="text-sm text-gray-400">
            Wysłaliśmy link potwierdzający rejestrację. Kliknij go, a potem wróć i zaloguj się.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#111827] border border-gray-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">
          {mode === 'signin' ? 'Zaloguj się' : 'Załóż konto'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {mode === 'signin' ? 'Wpisz swoje dane, aby kontynuować.' : 'Nowi użytkownicy otrzymują 5 darmowych kredytów.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@przyklad.pl"
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Hasło (min. 6 znaków)"
              className="w-full bg-[#0f172a] border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : mode === 'signin' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
          className="w-full text-center text-sm text-gray-400 hover:text-white mt-4 transition-colors"
        >
          {mode === 'signin' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
