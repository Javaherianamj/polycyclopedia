import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  title?: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, title, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-text-secondary hover:text-accent-primary hover:text-accent-secondary transition-colors p-0.5 rounded-full cursor-pointer focus:outline-none"
        aria-label="اطلاعات بیشتر"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full right-1/2 translate-x-1/2 mb-2 w-56 sm:w-64 p-2.5 bg-bg-surface text-text-primary text-[11px] leading-relaxed rounded-md shadow-lg border border-border-subtle pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
          {title && <div className="font-bold text-accent-secondary mb-1 text-xs">{title}</div>}
          <div>{text}</div>
          <div className="absolute top-full right-1/2 translate-x-1/2 border-4 border-transparent border-t-border-subtle" />
        </div>
      )}
    </div>
  );
};
