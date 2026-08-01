import React, { useState, useEffect, useRef } from 'react';
import { polymersData } from './data/polymersData';
import { Hansen3DChart } from './components/Hansen3DChart';
import { PolymerData } from './types/polymer';
import type { SourcedValue as SourcedValueData } from './types/polymer';
import { Navbar } from './components/Navbar';
import { HeroChainAnimation } from './components/HeroChainAnimation';
import { ResinBadge } from './components/ResinBadge';
import { SourcedValue } from './components/SourcedValue';
const MarketShareChart = React.lazy(() =>
  import('./components/MarketShareChart').then((m) => ({ default: m.MarketShareChart })),
);
import { StateSimulator } from './components/StateSimulator';
const StressStrainChart = React.lazy(() =>
  import('./components/StressStrainChart').then((m) => ({ default: m.StressStrainChart })),
);
const MolecularViewer3D = React.lazy(() =>
  import('./components/MolecularViewer3D').then((m) => ({ default: m.MolecularViewer3D })),
);
import { BranchingSimulator } from './components/BranchingSimulator';
import { TacticitySimulator } from './components/TacticitySimulator';
import { DPCalculator } from './components/DPCalculator';
import { DynamicQuiz } from './components/DynamicQuiz';
import { CatalogPage } from './components/CatalogPage';
import { CompareModal } from './components/CompareModal';
import { ResourcesModal } from './components/ResourcesModal';
import { ProcessingWindowSimulator } from './components/ProcessingWindowSimulator';
import { AlloyingSimulator } from './components/AlloyingSimulator';
import { LCACircularEconomy } from './components/LCACircularEconomy';
import { PolymerCombobox } from './components/PolymerCombobox';
import { InfoTooltip } from './components/InfoTooltip';
import {
  Lightbulb,
  FileText,
  Globe,
  Recycle,
  Dna,
  Calendar,
  Factory,
  Package,
  Flame,
  Cog,
  FlaskConical,
  Zap,
  Building2,
  BarChart3,
  Microscope,
  Info,
  ArrowRightLeft,
  BookOpen,
  ChevronRight,
  Layers,
  Box,
  ArrowUp,
} from 'lucide-react';

const formatVal = (v: SourcedValueData | string | number | null | undefined) => (
  <SourcedValue value={v} variant="block" />
);

export default function App() {
  // Hash routing helper
  const getPolymerFromHash = (): string | null => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (!hash || hash === 'catalog' || hash === 'home') return null;
    const exists = polymersData.some((p) => p.id === hash);
    return exists ? hash : null;
  };

  const [selectedPolymerId, setSelectedPolymerId] = useState<string | null>(getPolymerFromHash);
  const [targetFamily, setTargetFamily] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'ind' | 'eng' | 'aca'>('ind');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [showResources, setShowResources] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Scroll behavior for FABs
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show "Scroll to top" only after 300px
      setIsScrolled(currentScrollY > 300);

      // Update last scroll position
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync theme attribute on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Sync window location hash with selected polymer & listen for browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      setSelectedPolymerId(getPolymerFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectPolymer = (id: string | null) => {
    setSelectedPolymerId(id);
    if (!id) setTargetFamily(undefined);
    if (id) {
      window.location.hash = id;
    } else {
      window.location.hash = 'catalog';
    }
    setActiveTab('ind');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBackToFamily = () => {
    if (activePolymer) setTargetFamily(activePolymer.family);
    setSelectedPolymerId(null);
    window.location.hash = 'catalog';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activePolymer: PolymerData | undefined = polymersData.find(
    (p) => p.id === selectedPolymerId,
  );

  const renderSidebarContent = () => {
    if (!activePolymer) return null;
    return (
      <>
        {/* Quick Passport Card */}
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-border-subtle mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-primary" />
              <span>مشخصات کلیدی رزین</span>
            </span>
            <span className="en-mono font-mono tabular-nums text-xs font-bold text-accent-primary">
              {activePolymer.code}
            </span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-text-secondary" />
                <span>شناسه CAS:</span>
              </span>
              <span className="en-mono font-mono tabular-nums font-bold text-text-primary">
                {activePolymer.cas}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Recycle className="w-3.5 h-3.5 text-text-secondary" />
                <span>کد بازیافت رزین:</span>
              </span>
              <ResinBadge resinCode={activePolymer.resinCode} code={activePolymer.code} compact />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-text-secondary" />
                <span>خانواده پلیمری:</span>
              </span>
              <span className="en-mono font-mono text-xs font-bold text-status-success">
                {activePolymer.family}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                <span>سال کشف / توسعه:</span>
              </span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-status-warning">
                {activePolymer.discoveryYear}
              </span>
            </div>
          </div>
        </div>

        {/* Key Thermal & Mechanical Quick Specs */}
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary pb-3 border-b border-border-subtle mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-status-success" />
            <span>خلاصه شاخص‌های فنی</span>
          </h3>

          <div className="space-y-2.5">
            <div className="bg-bg-surface p-2.5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
              <span className="text-xs text-text-secondary">دمای انتقال شیشه‌ای (Tg)</span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-accent-primary">
                {formatVal(activePolymer.thermal.tg)}
              </span>
            </div>

            <div className="bg-bg-surface p-2.5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
              <span className="text-xs text-text-secondary">دمای ذوب (Tm)</span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-status-success">
                {formatVal(activePolymer.thermal.tm)}
              </span>
            </div>

            <div className="bg-bg-surface p-2.5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
              <span className="text-xs text-text-secondary">چگالی (Density)</span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-status-warning">
                {formatVal(activePolymer.physical.density)}
              </span>
            </div>

            <div className="bg-bg-surface p-2.5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
              <span className="text-xs text-text-secondary">شاخص جریان مذاب (MFI)</span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-text-primary">
                {formatVal(activePolymer.processing.mfi)}
              </span>
            </div>

            <div className="bg-bg-surface p-2.5 rounded-xl border border-border-subtle shadow-sm flex justify-between items-center">
              <span className="text-xs text-text-secondary">استحکام کششی</span>
              <span className="en-mono font-mono tabular-nums text-xs font-bold text-text-primary">
                {formatVal(activePolymer.mechanical.tensileStrength)}
              </span>
            </div>
          </div>
        </div>

        {/* Polymer Switcher Navigation */}
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-text-primary mb-2.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-primary" />
            <span>تغییر سریع پلیمر</span>
          </h3>
          <PolymerCombobox
            polymers={polymersData}
            activePolymerId={activePolymer.id}
            onSelect={(id) => {
              setIsMobileSidebarOpen(false);
              handleSelectPolymer(id);
            }}
          />
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setShowCompare(true);
            }}
            className="w-full bg-accent-primary hover:bg-blue-700 text-text-primary text-xs font-bold py-2.5 px-4 rounded shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>مقایسه با سایر پلیمرها</span>
          </button>

          <button
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setShowResources(true);
            }}
            className="w-full bg-bg-surface hover:bg-bg-surface text-text-primary text-xs font-bold py-2.5 px-4 rounded border border-border-subtle flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-text-secondary" />
            <span>استا‌نداردها و مراجع تخصصی</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans transition-colors duration-200 pb-16">
      {/* Top Navbar */}
      <Navbar
        polymers={polymersData}
        selectedPolymerId={selectedPolymerId}
        onSelectPolymer={handleSelectPolymer}
        onGoToCatalog={() => handleSelectPolymer(null)}
        onToggleCompare={() => setShowCompare(true)}
        onOpenResources={() => setShowResources(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main className="pt-20">
        {selectedPolymerId === null || !activePolymer ? (
          <CatalogPage
            polymers={polymersData}
            onSelectPolymer={handleSelectPolymer}
            onOpenResources={() => setShowResources(true)}
            initialFamily={targetFamily}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Breadcrumb Trail */}
            <div className="flex items-center text-xs font-bold text-text-secondary mb-4 bg-bg-surface px-3 py-2 rounded-lg border border-border-subtle shadow-xs w-fit">
              <button
                onClick={() => handleSelectPolymer(null)}
                className="hover:text-accent-primary transition-colors cursor-pointer"
              >
                کاتالوگ
              </button>
              <span className="mx-2 text-text-secondary">/</span>
              <button
                onClick={handleGoBackToFamily}
                className="hover:text-accent-primary transition-colors cursor-pointer"
              >
                {activePolymer.family}
              </button>
              <span className="mx-2 text-text-secondary">/</span>
              <span className="text-text-primary">{activePolymer.nameFa}</span>
            </div>

            {/* 65/35 Asymmetric Split Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Column (65% width = 8/12 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Header Hero Banner */}
                <section className="bg-bg-surface border border-border-subtle rounded-lg p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                    <div className="flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
                        {activePolymer.nameFa}
                      </h1>
                      <span className="px-2.5 py-0.5 bg-accent-primary text-text-primary text-xs font-mono tabular-nums font-bold rounded">
                        CAS {activePolymer.cas}
                      </span>
                    </div>
                    <span className="en-mono font-mono tabular-nums text-xs font-bold text-bg-surface bg-accent-primary px-2.5 py-1 rounded border-accent-secondary border-accent-primary">
                      {activePolymer.code} DATASHEET
                    </span>
                  </div>

                  <div className="en-mono font-mono text-xs text-text-secondary mb-3">
                    {activePolymer.nameEn} • {activePolymer.family}
                  </div>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                    {activePolymer.overviewText}
                  </p>

                  {/* Animated Polymer Chain */}
                  <HeroChainAnimation chainType={activePolymer.chainType} />
                </section>

                {/* Tab Navigation - Segmented Control Grid */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-bg-surface rounded-lg border border-border-subtle">
                  <button
                    onClick={() => setActiveTab('ind')}
                    className={`py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'ind'
                        ? 'bg-accent-secondary/10 border border-accent-secondary/30 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Factory className="w-4 h-4" />
                    <span>صنعتی و کاربردی</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('eng')}
                    className={`py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'eng'
                        ? 'bg-accent-secondary/10 border border-accent-secondary/30 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Cog className="w-4 h-4" />
                    <span>دیتاشیت مهندسی</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('aca')}
                    className={`py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'aca'
                        ? 'bg-accent-secondary/10 border border-accent-secondary/30 text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Microscope className="w-4 h-4" />
                    <span>شیمی و فیزیک پایه</span>
                  </button>
                </div>

                {/* TAB 1: Industrial & Applied */}
                {activeTab === 'ind' && (
                  <div className="space-y-6">
                    {/* Polymer Passport */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-3">
                        <FileText className="w-4 h-4 text-accent-primary" />
                        <span>شناسنامه فنی پلیمر</span>
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed mb-4 text-text-secondary">
                        {activePolymer.overviewText}
                      </p>

                      <div className="text-xs text-text-secondary">
                        <span className="font-bold text-text-secondary">نام‌های تجاری معروف: </span>
                        <span>{activePolymer.tradeNames.join(' ، ')}</span>
                      </div>
                    </div>

                    {/* Market Share Chart */}
                    <React.Suspense
                      fallback={
                        <div className="h-[400px] w-full bg-bg-surface rounded-lg animate-pulse mb-6" />
                      }
                    >
                      <MarketShareChart
                        data={activePolymer.marketShare}
                        polymerName={activePolymer.nameFa}
                        isDark={isDark}
                      />
                    </React.Suspense>

                    {/* Processing Methods & Machinery */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Factory className="w-4 h-4 text-accent-primary" />
                        <span>روش‌های فرآیند و ماشین‌آلات</span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
                            <span>دمای فرآیند</span>
                            <InfoTooltip text="بازه دمایی مناسب برای ذوب و شکل‌دهی پلیمر بدون تخریب حرارتی آن." />
                          </div>
                          <div className="text-sm font-bold text-text-primary" dir="ltr">
                            {formatVal(activePolymer.processing.processTemp)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
                            <span>شاخص جریان مذاب (MFI)</span>
                            <InfoTooltip text="جرم پلیمر (به گرم) که در مدت 10 دقیقه از یک دای استاندارد تحت وزن و دمای مشخص عبور می‌کند. شاخصی برای روانی مذاب و وزن مولکولی است." />
                          </div>
                          <div className="text-sm font-bold text-text-primary" dir="ltr">
                            {formatVal(activePolymer.processing.mfi)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
                            <span>نسبت دمش (BUR)</span>
                            <InfoTooltip text="نسبت قطر حباب فیلم به قطر دای در فرآیند تولید فیلم دمشی (Blown Film). کنترل‌کننده آرایش‌یافتگی مولکولی و استحکام دو محوره فیلم است." />
                          </div>
                          <div className="text-sm font-bold text-text-primary">
                            {formatVal(activePolymer.processing.bur)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs font-bold text-text-primary mb-2">
                          تکنیک‌های رایج شکل‌دهی:
                        </div>
                        <ul className="list-disc list-inside text-xs space-y-1 text-text-secondary">
                          {activePolymer.processing.techniques.map((tech, idx) => (
                            <li key={idx}>{tech}</li>
                          ))}
                        </ul>
                      </div>

                      {activePolymer.processing.specialNoteTitle && (
                        <div className="border-r-3 border-status-warning bg-status-warning/10 p-3.5 rounded-r mt-4">
                          <h4 className="font-bold text-xs text-status-warning mb-1">
                            {formatVal(activePolymer.processing.specialNoteTitle)}
                          </h4>
                          <p className="text-sm leading-relaxed text-text-primary">
                            {formatVal(activePolymer.processing.specialNoteContent)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Processing Window Simulator */}
                    <ProcessingWindowSimulator polymer={activePolymer} />

                    {/* Alloying & Blending Simulator */}
                    <AlloyingSimulator polymer={activePolymer} />

                    {/* Applications */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-3">
                        <Package className="w-5 h-5 text-status-success" />
                        <span>حوزه‌های کاربردی اصلی</span>
                      </h2>
                      <ul className="space-y-2 text-xs text-text-secondary">
                        {activePolymer.applications.map((app, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-accent-primary font-bold">•</span>
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Iranian & Multinational Manufacturers */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Building2 className="w-4 h-4 text-accent-primary" />
                        <span>تولیدکنندگان جهانی و داخلی</span>
                      </h2>

                      <div className="mb-5">
                        <h4 className="font-bold text-xs text-text-primary mb-2">
                          تولیدکنندگان ایرانی:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activePolymer.iranianManufacturers.map((mfg, idx) => (
                            <div
                              key={idx}
                              className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm text-xs font-medium text-text-primary"
                            >
                              {mfg}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-text-primary mb-2">
                          شرکت‌های چندملیتی شاخص:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {activePolymer.multinationalManufacturers.map((mfg, idx) => (
                            <div
                              key={idx}
                              className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm text-xs font-medium text-text-primary"
                            >
                              {mfg}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Life Cycle Assessment & Circular Economy */}
                    <LCACircularEconomy polymer={activePolymer} />
                  </div>
                )}

                {/* TAB 2: Engineering Datasheet */}
                {activeTab === 'eng' && (
                  <div className="space-y-6">
                    {/* Physical State Simulator */}
                    <StateSimulator polymer={activePolymer} />

                    {/* Thermal Properties Card */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Flame className="w-5 h-5 text-status-warning" />
                        <span>خواص حرارتی</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            دمای انتقال شیشه‌ای (Tg){' '}
                            <InfoTooltip text="دمایی است که در آن پلیمر از حالت سخت و شکننده (شیشه‌ای) به حالت انعطاف‌پذیر (لاستیکی) تغییر فاز می‌دهد." />
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-accent-secondary"
                          >
                            {formatVal(activePolymer.thermal.tg)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            دمای ذوب (Tm){' '}
                            <InfoTooltip text="دمای ذوب بلوری (Melting Temperature) دمایی است که در آن مناطق بلوری پلیمر ذوب شده و به حالت مذاب در می‌آیند." />
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-status-success"
                          >
                            {formatVal(activePolymer.thermal.tm)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            آنتالپی ذوب (تجربی)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.enthalpyExp)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            آنتالپی ذوب (100% بلورین)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.enthalpy100Cryst)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            دمای تخریب حرارتی{' '}
                            <InfoTooltip text="دمایی است که در آن پیوندهای شیمیایی زنجیره اصلی پلیمر شروع به شکستن کرده و پلیمر تجزیه می‌شود." />
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-status-error"
                          >
                            {formatVal(activePolymer.thermal.degradationTemp)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            تغییر شکل حرارتی (HDT)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.hdt)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            دمای نرم‌شدگی ویکات
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.vicat)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            هدایت حرارتی
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.conductivity)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ضریب انبساط حرارتی (CTE)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.thermal.cte)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mechanical Properties Card */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Cog className="w-4 h-4 text-accent-primary" />
                        <span>خواص مکانیکی</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            استحکام کششی
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.mechanical.tensileStrength)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">مدول یانگ</div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.mechanical.youngModulus)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ازدیاد طول در شکست
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.mechanical.elongationAtBreak)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">مدول خمشی</div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.mechanical.flexuralModulus)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            سختی (Shore D)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.mechanical.hardnessShoreD)}
                          </div>
                        </div>
                        {activePolymer.mechanical.izodImpact && (
                          <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                            <div className="text-[11px] font-bold text-text-secondary">
                              مقاومت ضربه‌ای (ایزود)
                            </div>
                            <div
                              dir="ltr"
                              className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                            >
                              {formatVal(activePolymer.mechanical.izodImpact)}
                            </div>
                          </div>
                        )}
                      </div>
                      {activePolymer.mechanical.description && (
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {formatVal(activePolymer.mechanical.description)}
                        </p>
                      )}
                    </div>

                    {/* Physical Properties */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Box className="w-5 h-5 text-status-success" />
                        <span>خواص فیزیکی پایه</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            چگالی (Density)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-status-warning"
                          >
                            {formatVal(activePolymer.physical.density)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            جذب آب (24h)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.physical.waterAbsorption)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ضریب شکست نور
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.physical.refractiveIndex)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            نفوذپذیری O₂
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.physical.oxygenPermeability)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            نفوذپذیری CO₂
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.physical.co2Permeability)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ظاهر و شفافیت
                          </div>
                          <div className="text-xs font-bold text-text-primary">
                            {formatVal(activePolymer.physical.appearance)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chemical Resistance Table */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <FlaskConical className="w-4 h-4 text-accent-primary" />
                        <span>مقاومت شیمیایی</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activePolymer.chemicalResistance.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm flex justify-between items-center text-xs"
                          >
                            <span className="font-medium text-text-primary">{item.category}</span>
                            <span className={`font-bold ${item.colorClass}`}>{item.rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Electrical Properties */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Zap className="w-5 h-5 text-status-warning" />
                        <span>خواص الکتریکی</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ثابت دی‌الکتریک
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.electrical.dielectricConstant)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            استقامت دی‌الکتریک
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.electrical.dielectricStrength)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            مقاومت حجمی
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.electrical.volumeResistivity)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ضریب تلفات دی‌الکتریک
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.electrical.dissipationFactor)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stress Strain Chart and Analysis */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <React.Suspense
                        fallback={
                          <div className="h-[400px] w-full bg-bg-surface rounded-lg animate-pulse" />
                        }
                      >
                        <StressStrainChart currentPolymer={activePolymer} isDark={isDark} />
                      </React.Suspense>
                      <div className="mt-5 p-4 bg-bg-base border border-border-subtle rounded-lg">
                        <h4 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-status-warning" /> تحلیل رفتار مکانیکی
                        </h4>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed break-words whitespace-normal">
                          بر اساس نمودار تنش-کرنش و داده‌های فنی، پلیمر{' '}
                          <span className="font-bold text-accent-primary">
                            {activePolymer.nameFa}
                          </span>{' '}
                          دارای استحکام کششی حدود{' '}
                          <span className="en-mono font-bold">
                            {activePolymer.mechanical.tensileStrength?.value} MPa
                          </span>{' '}
                          و ازدیاد طول تا پارگی{' '}
                          <span className="en-mono font-bold">
                            {activePolymer.mechanical.elongationAtBreak?.value}%
                          </span>{' '}
                          می‌باشد. این ترکیب از خواص نشان‌دهنده رفتار{' '}
                          {activePolymer.id === 'ps'
                            ? 'ترد و شکننده با مدول بالا و جذب انرژی پایین (منطقه پلاستیک بسیار محدود)'
                            : activePolymer.id === 'ldpe' || activePolymer.id === 'lldpe'
                              ? 'بسیار نرم و چقرمه با قابلیت تغییر شکل پلاستیک وسیع (انعطاف‌پذیری بالا)'
                              : activePolymer.id === 'hdpe' || activePolymer.id === 'pp'
                                ? 'چقرمه با استحکام تسلیم مشخص و قابلیت کشش سرد (Cold Drawing)'
                                : activePolymer.id === 'pet'
                                  ? 'مستحکم با رفتار پلاستیک متوسط و تمایل به بلورینگی ناشی از کرنش'
                                  : 'پلاستیک با نقطه تسلیم مشخص'}{' '}
                          تحت بارگذاری محوری است.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Academic & Basic Physics */}
                {activeTab === 'aca' && (
                  <div className="space-y-6">
                    {/* Structure & Monomer */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-3">
                        <Dna className="w-5 h-5 text-status-success" />
                        <span>ساختار مولکولی و معماری زنجیر</span>
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed mb-4 text-text-secondary">
                        مونومر سازنده {activePolymer.code}،{' '}
                        {formatVal(activePolymer.academic.monomerName)} با فرمول شیمیایی{' '}
                        <span className="en-mono font-mono tabular-nums font-bold text-accent-primary">
                          {formatVal(activePolymer.academic.monomerFormula)}
                        </span>{' '}
                        و جرم مولی{' '}
                        <span className="en-mono font-mono tabular-nums font-bold text-accent-primary">
                          {formatVal(activePolymer.academic.monomerMolarMass)} g/mol
                        </span>{' '}
                        می‌باشد. واحد تکرارشونده آن به صورت{' '}
                        <span className="en-mono font-mono tabular-nums font-bold text-accent-primary">
                          {formatVal(activePolymer.academic.repeatingUnit)}
                        </span>{' '}
                        نمایش داده می‌شود.
                      </p>

                      {activePolymer.id === 'ldpe' && (
                        <BranchingSimulator polymer={activePolymer} />
                      )}
                      {activePolymer.id === 'ps' && <TacticitySimulator polymer={activePolymer} />}
                      <React.Suspense
                        fallback={
                          <div className="h-[300px] w-full bg-bg-surface rounded-lg animate-pulse mt-6" />
                        }
                      >
                        <MolecularViewer3D
                          atoms={activePolymer.atoms3d}
                          monomerName={formatVal(activePolymer.academic.monomerName)}
                          polymerCode={activePolymer.code}
                          isDark={isDark}
                        />
                      </React.Suspense>
                    </div>

                    {/* Crystal System & Morphology */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Layers className="w-4 h-4 text-accent-primary" />
                        <span>مورفولوژی و شبکه‌ی بلوری</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            درصد بلورینگی
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-accent-primary"
                          >
                            {formatVal(activePolymer.academic.crystallinityRange)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            پارامترهای سلول واحد (a, b, c)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-[13px] sm:text-sm font-black mt-0.5 text-text-primary whitespace-pre-wrap leading-tight"
                          >
                            {formatVal(activePolymer.academic.unitCell).replace(' (', '\n(')}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ضخامت لاملاها
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.lamellaThickness)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            اندازه اسفرولیت‌ها
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.spheruliteSize)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Polymerization Kinetics */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-3">
                        <FlaskConical className="w-4 h-4 text-accent-primary" />
                        <span>سینتیک سنتز و پلیمریزاسیون</span>
                      </h2>
                      <p className="text-xs sm:text-sm leading-relaxed mb-3 text-text-secondary">
                        <span className="font-bold">مکانیزم واکنش: </span>
                        {formatVal(activePolymer.academic.mechanism)}
                      </p>

                      <div className="mb-3">
                        <span className="font-bold text-xs text-text-primary block mb-1">
                          انواع راکتورهای صنعتی:
                        </span>
                        <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
                          {activePolymer.academic.reactorTypes.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-xs text-text-secondary bg-bg-base p-3 rounded border border-border-subtle leading-relaxed">
                        <span className="font-bold text-text-primary">ملاحظات سینتیکی: </span>
                        {formatVal(activePolymer.academic.kineticNotes)}
                      </p>
                    </div>

                    {/* Molecular Weight Characteristics */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <BarChart3 className="w-4 h-4 text-accent-primary" />
                        <span>ویژگی‌های وزن مولکولی</span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            وزن مولکولی وزنی (Mw)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.mw)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            وزن مولکولی عددی (Mn)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.mn)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            شاخص چندپخشی (PDI){' '}
                            <InfoTooltip text="شاخص پراکندگی (Polydispersity Index) نشان‌دهنده گستردگی توزیع وزن مولکولی است. هرچه PDI به ۱ نزدیک‌تر باشد، طول زنجیرها یکنواخت‌تر است." />
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-status-warning"
                          >
                            {formatVal(activePolymer.academic.pdi)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            درجه پلیمریزاسیون (DP)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.dpRange)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            وزن درهم‌تنیدگی (Me)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.entanglementMw)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                            شعاع ژیراسیون (Rg){' '}
                            <InfoTooltip text="شعاع چرخش (Radius of Gyration) معیاری از اندازه یک کلاف پلیمری در فضا است و نشان می‌دهد جرم ماکرومولکول چگونه حول مرکز جرم توزیع شده است." />
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.radiusOfGyration)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Rheology */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Cog className="w-4 h-4 text-accent-primary" />
                        <span>رئولوژی پیشرفته</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ویسکوزیته برش صفر (η0)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.zeroShearViscosity)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            ضریب توان (Power Law Index n)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.powerLawIndex)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {formatVal(activePolymer.academic.rheologyNotes)}
                      </p>
                    </div>

                    {/* Advanced Physics & Hansen Solubility */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-4">
                        <Microscope className="w-4 h-4 text-accent-primary" />
                        <span>فیزیک پیشرفته و ترمودینامیک</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            پارامتر حلالیت (δ)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.solubilityParameter)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            مولفه پراکندگی (δD)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.hansenD)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            مولفه قطبی (δP)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.hansenP)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            پیوند هیدروژنی (δH)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.hansenH)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            فلوری-هاگینز (χ)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.floryHugginsChi)}
                          </div>
                        </div>
                        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
                          <div className="text-[11px] font-bold text-text-secondary">
                            کسر حجم آزاد (FFV)
                          </div>
                          <div
                            dir="ltr"
                            className="en-mono font-mono tabular-nums text-sm font-black mt-0.5 text-text-primary"
                          >
                            {formatVal(activePolymer.academic.ffv)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {formatVal(activePolymer.academic.thermoNotes)}
                      </p>

                      <Hansen3DChart
                        polymerCode={activePolymer.code}
                        d={activePolymer.academic.hansenD?.value || 0}
                        p={activePolymer.academic.hansenP?.value || 0}
                        h={activePolymer.academic.hansenH?.value || 0}
                      />
                    </div>

                    {/* Degree of Polymerization Calculator */}
                    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs">
                      <DPCalculator polymer={activePolymer} />
                    </div>

                    {/* Dynamic Quiz */}
                    <DynamicQuiz questions={activePolymer.quiz} polymerCode={activePolymer.code} />
                  </div>
                )}
              </div>

              {/* Sticky Sidebar Column (Desktop Only) */}
              <div className="hidden lg:block lg:col-span-4 space-y-5">
                <div className="lg:sticky lg:top-24 space-y-5">{renderSidebarContent()}</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Compare Modal */}
      {showCompare && (
        <CompareModal polymers={polymersData} onClose={() => setShowCompare(false)} />
      )}

      {/* Resources & Academic Sources Modal */}
      <ResourcesModal isOpen={showResources} onClose={() => setShowResources(false)} />

      {/* Mobile Sidebar Bottom Sheet Overlay */}
      {isMobileSidebarOpen && selectedPolymerId !== null && (
        <div className="lg:hidden fixed inset-0 z-[100] flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bg-surface/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative bg-bg-surface w-full max-h-[85vh] rounded-t-2xl shadow-2xl flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Handle / Close bar */}
            <div
              className="flex justify-center p-4 border-b border-border-subtle cursor-pointer active:bg-bg-base active:bg-bg-surface/50 transition-colors rounded-t-2xl"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div className="w-12 h-1.5 bg-bg-surface rounded-full" />
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 space-y-5 pb-10">{renderSidebarContent()}</div>
          </div>
        </div>
      )}

      {/* Mobile FABs Container */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[90] flex items-end justify-between pointer-events-none">
        {/* Specs FAB (Bottom Left) */}
        {selectedPolymerId !== null ? (
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="pointer-events-auto bg-bg-surface/90 text-text-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-3.5 rounded-2xl flex items-center gap-2 font-bold cursor-pointer border border-border-subtle backdrop-blur-md active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4 text-accent-primary" />
            <span className="text-xs pr-1">مشخصات</span>
          </button>
        ) : (
          <div />
        )}

        {/* Mobile Scroll to Top FAB (Bottom Right) */}
        {isScrolled && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="بازگشت به بالای صفحه"
            className="pointer-events-auto bg-bg-surface/90 text-text-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-3.5 rounded-2xl flex items-center justify-center cursor-pointer border border-border-subtle backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowUp className="w-5 h-5 text-accent-primary stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Desktop Scroll to Top FAB */}
      {isScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="بازگشت به بالای صفحه"
          className="hidden lg:flex fixed bottom-6 right-6 z-[90] bg-bg-surface/90 text-text-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-3.5 rounded-2xl items-center justify-center cursor-pointer border border-border-subtle backdrop-blur-md hover:-translate-y-1 active:translate-y-0 transition-transform duration-300"
        >
          <ArrowUp className="w-5 h-5 text-accent-primary stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
