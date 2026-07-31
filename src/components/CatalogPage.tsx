import React, { useState } from 'react';
import { PolymerData } from '../types/polymer';
import { Search, BookOpen, Layers, Plus, Minus, ChevronRight, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { SourcedValue } from './SourcedValue';

interface CatalogPageProps {
 polymers: PolymerData[];
 onSelectPolymer: (id: string) => void;
 onOpenResources?: () => void;
 initialFamily?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ polymers, onSelectPolymer, onOpenResources, initialFamily }) => {
 const formatVal = (v: any) => <SourcedValue value={v} />;

 const [search, setSearch] = useState('');
 const [expandedFamilies, setExpandedFamilies] = useState<string[]>(initialFamily ? [initialFamily] : ['Polyolefins']);

 const toggleFamily = (family: string) => {
 setExpandedFamilies((prev) => 
 prev.includes(family) ? prev.filter(f => f !== family) : [...prev, family]
 );
 };

 const filtered = polymers.filter((p) => {
 const q = search.toLowerCase();
 return (
 p.nameFa.toLowerCase().includes(q) ||
 p.nameEn.toLowerCase().includes(q) ||
 p.code.toLowerCase().includes(q) ||
 p.cas.includes(q) ||
 p.tradeNames.some((tn) => tn.toLowerCase().includes(q)) ||
 p.applications.some((app) => app.toLowerCase().includes(q))
 );
 });

 // Group by family
 const families: Record<string, PolymerData[]> = {};
 filtered.forEach((p) => {
 if (!families[p.family]) {
 families[p.family] = [];
 }
 families[p.family].push(p);
 });

 return (
 <div className="max-w-[1080px] mx-auto px-4 py-8">
 {/* Industrial Hero Header */}
 <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 sm:p-8 mb-8 text-center relative overflow-hidden shadow-xs">
 <div className="absolute top-0 right-0 left-0 h-1 bg-accent-primary" />
 
 <div className="flex justify-center mb-3">
 <img src="/logo.svg" alt="Polymer Engineering Association Logo" className="w-14 h-14 object-contain" />
 </div>

 <span className="text-[11px] font-bold text-text-secondary tracking-wider block mb-1">
 انجمن علمی مهندسی پلیمر • POLYMER ENGINEERING ASSOCIATION
 </span>
 <h1 className="text-2xl sm:text-3xl font-black mb-3 text-text-primary">
 دانشنامه و مرجع تخصصی گریدها و خانواده پلیمرها
 </h1>
 <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto mb-6 font-medium">
 مرجع کامل خواص مهندسی، آکادمیک و صنعتی پلیمرها. برای مشاهده مشخصات کامل هر گرید، خانواده پلیمری را انتخاب کرده یا مشخصه مورد نظر را جستجو نمایید.
 </p>

 {/* Action Controls & Search */}
 <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
 <div className="relative w-full">
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="جستجو بر اساس نام، گرید (LDPE, HDPE)، کد CAS یا نام تجاری..."
 className="w-full bg-bg-base border border-border-subtle text-text-primary pr-10 pl-4 py-2.5 rounded-md text-xs sm:text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
 />
 <Search className="absolute right-3.5 top-3 text-text-secondary w-4 h-4" />
 </div>

 {onOpenResources && (
 <button
 onClick={onOpenResources}
 className="w-full sm:w-auto whitespace-nowrap bg-accent-primary hover:bg-teal-900 text-text-primary font-bold px-4 py-2.5 rounded-md text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 border-accent-primary"
 >
 <BookOpen className="w-4 h-4 text-accent-secondary" />
 <span>مراجع علمی</span>
 </button>
 )}
 </div>
 </div>

 {/* Accordions / Family List */}
 <div className="space-y-4">
 {Object.keys(families).length === 0 ? (
 <div className="text-center py-12 bg-bg-surface border border-border-subtle rounded-lg shadow-xs">
 <p className="text-text-secondary text-sm font-semibold">هیچ پلیمری با عبارت جستجو شده یافت نشد.</p>
 </div>
 ) : (
 Object.entries(families).map(([family, items]) => {
 const isExpanded = expandedFamilies.includes(family) || search.length > 0;
 return (
 <div
 key={family}
 className="bg-bg-surface border border-border-subtle rounded-lg overflow-hidden shadow-xs transition-all"
 >
 <button
 onClick={() => toggleFamily(family)}
 className="w-full p-4 flex items-center justify-between text-right font-black text-sm sm:text-base bg-bg-base hover:bg-bg-surface hover:bg-bg-surface/80 transition-colors cursor-pointer border-b border-border-subtle"
 >
 <span className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:gap-2.5 ml-2">
 <Layers className="w-4 h-4 text-accent-primary shrink-0" />
 <span className="text-text-primary shrink-0">خانواده پلیمری {family}</span>
 <span className="text-xs text-text-secondary bg-bg-surface px-2 py-0.5 rounded font-mono tabular-nums whitespace-nowrap mt-1 sm:mt-0">
 {items.length} گرید
 </span>
 </span>
 <span className="text-text-secondary font-bold shrink-0">
 {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
 </span>
 </button>

 {isExpanded && (
 <div className="p-4 grid-cols-1 sm:grid-cols-2 gap-3 bg-bg-surface">
 {items.map((p) => (
 <button
 key={p.id}
 onClick={() => onSelectPolymer(p.id)}
 className="text-right p-4 rounded-md bg-bg-surface border border-border-subtle hover:border-blue-500 hover:border-blue-400 transition-all duration-150 shadow-xs group cursor-pointer"
 >
 <div className="flex justify-between items-start mb-2">
 <span className="font-bold text-sm sm:text-base text-text-primary group-hover:text-accent-primary transition-colors">
 {p.nameFa}
 </span>
 <span className="en-mono text-xs font-bold bg-accent-primary text-text-primary px-2 py-0.5 rounded">
 {p.code}
 </span>
 </div>

 <div className="text-xs text-text-secondary en-mono mb-3 font-mono tabular-nums">
 CAS: {p.cas} | Resin #{p.resinCode}
 </div>

 <div className="flex-wrap gap-2 pt-2 border-t border-border-subtle">
 <span className="text-[11px] bg-bg-surface border border-border-subtle px-2 py-0.5 rounded text-text-secondary font-medium">
 Tg: <span className="en-mono font-mono tabular-nums font-bold text-accent-secondary">{formatVal(p.thermal.tg)}</span>
 </span>
 <span className="text-[11px] bg-bg-surface border border-border-subtle px-2 py-0.5 rounded text-text-secondary font-medium">
 Tm: <span className="en-mono font-mono tabular-nums font-bold text-status-success">{formatVal(p.thermal.tm)}</span>
 </span>
 <span className="text-[11px] bg-bg-surface border border-border-subtle px-2 py-0.5 rounded text-text-secondary font-medium">
 Density: <span className="en-mono font-mono tabular-nums font-bold text-status-warning">{formatVal(p.physical.density)}</span>
 </span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>
 );
};
