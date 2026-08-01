import React, { useState, useRef, useEffect } from 'react';
import { PolymerData } from '../types/polymer';
import { Search, ChevronDown, Check } from 'lucide-react';

interface PolymerComboboxProps {
  polymers: PolymerData[];
  activePolymerId: string;
  onSelect: (id: string) => void;
}

export const PolymerCombobox: React.FC<PolymerComboboxProps> = ({
  polymers,
  activePolymerId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Group by family
  const groupedPolymers = polymers.reduce(
    (acc, polymer) => {
      if (!acc[polymer.family]) {
        acc[polymer.family] = [];
      }
      acc[polymer.family].push(polymer);
      return acc;
    },
    {} as Record<string, PolymerData[]>,
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter based on search query
  const filteredGroups = Object.keys(groupedPolymers).reduce(
    (acc, family) => {
      const filtered = groupedPolymers[family].filter(
        (p) =>
          p.nameFa.includes(searchQuery) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.family.includes(searchQuery),
      );
      if (filtered.length > 0) {
        acc[family] = filtered;
      }
      return acc;
    },
    {} as Record<string, PolymerData[]>,
  );

  const activePolymer = polymers.find((p) => p.id === activePolymerId);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-base border border-border-subtle text-text-primary text-xs font-bold py-2.5 px-3 rounded flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span className="truncate pr-2">
          {activePolymer ? `${activePolymer.nameFa} (${activePolymer.code})` : 'انتخاب پلیمر'}
        </span>
        <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-surface border border-border-subtle rounded-lg shadow-xl max-h-80 overflow-y-auto">
          <div className="sticky top-0 bg-bg-surface p-2 border-b border-border-subtle">
            <div className="relative">
              <Search className="absolute right-2 top-2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="جستجوی پلیمر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-base border border-border-subtle text-text-primary text-xs rounded pl-2 pr-8 py-2 focus:outline-none focus:border-blue-500"
                dir="rtl"
              />
            </div>
          </div>

          <div className="py-1">
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">
                پلیمری یافت نشد.
              </div>
            ) : (
              Object.keys(filteredGroups).map((family) => (
                <div key={family}>
                  <div className="px-3 py-1.5 text-[10px] font-black text-text-secondary uppercase tracking-wider bg-bg-surface/50">
                    {family}
                  </div>
                  {filteredGroups[family].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelect(p.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-right px-3 py-3 text-xs flex items-center justify-between hover:bg-bg-base hover:bg-bg-surface transition-colors ${activePolymerId === p.id ? 'bg-accent-secondary bg-blue-900/20 text-accent-primary font-bold' : 'text-text-secondary'}`}
                    >
                      <span className="truncate">
                        <bdi>
                          {p.nameFa} ({p.code})
                        </bdi>
                      </span>
                      {activePolymerId === p.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
