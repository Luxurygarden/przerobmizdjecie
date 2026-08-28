import React, { useEffect, useRef, useState } from 'react';
import { Zap, Plus, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onAddCredits: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onAddCredits }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on an outside click, so it works on touch devices
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="w-full py-4 px-6 flex flex-col sm:flex-row justify-between items-center bg-[#050810]/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800 gap-4 sm:gap-0">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-blue-500 tracking-wider drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
          przerobmizdjecie.pl
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        {user ? (
            <>
                {/* Credits Counter (Only visible when logged in) */}
                <div className="flex items-center bg-[#111827] rounded-full border border-gray-700 p-1 pr-4 shadow-lg">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1.5 text-black mr-2 shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div className="flex flex-col mr-3">
                        <span className="text-xs text-gray-400 font-medium leading-none uppercase">Kredyty</span>
                        <span className="text-sm font-bold text-white leading-none">{user.credits}</span>
                    </div>
                    <button 
                        onClick={onAddCredits}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 transition-colors border border-gray-600"
                        title="Doładuj kredyty"
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-gray-800 hidden sm:block"></div>

                {/* User Profile */}
                <div className="flex items-center gap-3 relative" ref={menuRef}>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                        <p className="text-xs text-gray-500">Plan Free</p>
                    </div>
                    <button
                        className="relative"
                        onClick={() => setIsMenuOpen(open => !open)}
                        aria-expanded={isMenuOpen}
                        aria-haspopup="menu"
                        title="Menu konta"
                    >
                        <img 
                            src={user.avatarUrl} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full border-2 border-gray-700 hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050810] rounded-full"></div>
                    </button>

                    {/* Dropdown Logout */}
                    <div className={`absolute right-0 top-12 w-48 bg-[#111827] border border-gray-800 rounded-lg shadow-xl transition-all transform z-50 ${
                        isMenuOpen
                            ? 'opacity-100 visible translate-y-0'
                            : 'opacity-0 invisible translate-y-[-10px]'
                    }`}>
                         <div className="p-3 border-b border-gray-800 text-xs text-gray-400">
                            Zalogowany jako <br/> <span className="text-white font-medium">{user.email}</span>
                         </div>
                         <button 
                            onClick={() => { setIsMenuOpen(false); onLogout(); }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 flex items-center gap-2 transition-colors rounded-b-lg"
                         >
                            <LogOut size={16} /> Wyloguj się
                         </button>
                    </div>
                </div>
            </>
        ) : (
            <button 
                onClick={onLogin}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                <span>Zaloguj z Google</span>
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;