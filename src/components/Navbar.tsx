import React from 'react';
import { PolymerData } from '../types/polymer';
import { BookOpen, Scale, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  polymers: PolymerData[];
  selectedPolymerId: string | null;
  onSelectPolymer: (id: string) => void;
  onGoToCatalog: () => void;
  onToggleCompare: () => void;
  onOpenResources: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  polymers,
  selectedPolymerId,
  onSelectPolymer,
  onGoToCatalog,
  onToggleCompare,
  onOpenResources,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-bg-surface/90 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-4 sm:px-8 z-50 shadow-xs">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoToCatalog}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity text-right cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-bg-surface p-1 border border-border-subtle shadow-xs flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition-colors">
            <img
              src="/logo.svg"
              alt="Polymer Engineering Association"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col text-right">
            <span className="font-black text-lg sm:text-2xl tracking-tight text-accent-primary leading-none font-mono en-mono">
              Polypedia
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary mt-0.5">
              دانشنامه مهندسی پلیمر
            </span>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenResources}
          className="flex items-center gap-1.5 bg-bg-base hover:bg-bg-surface text-text-primary px-2 sm:px-3 py-1.5 rounded-md text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
          title="مشاهده مراجع و منابع علمی"
        >
          <BookOpen className="w-3.5 h-3.5 text-text-secondary" />
          <span className="hidden sm:inline">مراجع علمی</span>
        </button>

        <button
          onClick={onToggleCompare}
          className="flex items-center gap-1.5 bg-bg-base hover:bg-bg-surface text-text-primary px-2 sm:px-3.5 py-1.5 rounded-md text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
          title="مقایسه فنی دو پلیمر"
        >
          <Scale className="w-3.5 h-3.5 text-text-secondary" />
          <span className="hidden sm:inline">مقایسه فنی</span>
        </button>

        {/* Sleek Theme Switcher Capsule */}
        <div className="flex bg-bg-base p-0.5 rounded-md border border-border-subtle">
          <button
            onClick={onToggleTheme}
            className={`px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              isDark
                ? 'bg-accent-primary text-text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span className="hidden sm:inline">Dark</span>
          </button>
          <button
            onClick={onToggleTheme}
            className={`px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              !isDark
                ? 'bg-bg-surface text-text-primary shadow-xs border-border-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span className="hidden sm:inline">Light</span>
          </button>
        </div>
      </div>
    </header>
  );
};
