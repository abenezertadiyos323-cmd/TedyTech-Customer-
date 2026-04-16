import { useState, lazy, Suspense } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DebugPanel } from '@/components/DebugPanel';
import { cn } from '@/lib/utils';
import { useAffiliate, AffiliateContext } from '@/hooks/useAffiliate';

// Hoist import() at module scope so each chunk starts downloading immediately
// when the app opens, not on first click. lazy() reuses the same in-flight
// promise — no double fetch.
const _homeChunk = import('@/components/tabs/HomeTab');
const HomeTab = lazy(() => _homeChunk.then(m => ({ default: m.HomeTab })));

const _savedChunk = import('@/components/tabs/SavedTab');
const SavedTab = lazy(() => _savedChunk.then(m => ({ default: m.SavedTab })));

const _exchangeChunk = import('@/components/tabs/ExchangeTab');
const ExchangeTab = lazy(() => _exchangeChunk.then(m => ({ default: m.ExchangeTab })));

const _aboutChunk = import('@/components/tabs/AboutTab');
const AboutTab = lazy(() => _aboutChunk.then(m => ({ default: m.AboutTab })));

const _earnChunk = import('@/components/tabs/EarnTab');
const EarnTab = lazy(() => _earnChunk.then(m => ({ default: m.EarnTab })));

const Index = () => {
  // Run useAffiliate() once here. The result is shared via AffiliateContext
  // so EarnTab reads from the same subscription — no duplicate Convex queries.
  const affiliateState = useAffiliate();

  const [activeTab, setActiveTab] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [homeKey, setHomeKey] = useState(0); // Key to force HomeTab remount

  const handleTabChange = (tab: string) => {
    // If tapping Home while already on Home, reset navigation state
    if (tab === 'home' && activeTab === 'home') {
      setHomeKey(prev => prev + 1); // Force remount to reset state
      window.scrollTo(0, 0);
      return;
    }
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
      window.scrollTo(0, 0); // Always reset scroll to top on tab switch
    }, 150);
  };

  const handleNavigateToExchange = () => {
    handleTabChange('exchange');
  };

  const handleNavigateToAbout = () => {
    handleTabChange('about');
  };

  const handleNavigateToSaved = () => {
    handleTabChange('saved');
  };

  return (
    <AffiliateContext.Provider value={affiliateState}>
      <div className="max-w-lg mx-auto bg-background min-h-screen relative">
        {/* Tab Content with transitions */}
        <div
          className={cn(
            "transition-all duration-300 ease-out pb-16",
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          {/* All chunks are hoisted at module scope so they download in parallel
              at app open. fallback=null means no spinner ever flashes. */}
          <Suspense fallback={null}>
            {activeTab === 'home' && (
              <HomeTab
                key={homeKey}
                onNavigateToExchange={handleNavigateToExchange}
                onNavigateToAbout={handleNavigateToAbout}
                onNavigateToSaved={handleNavigateToSaved}
              />
            )}
            {activeTab === 'saved' && (
              <SavedTab onNavigateToExchange={handleNavigateToExchange} />
            )}
            {activeTab === 'exchange' && <ExchangeTab />}
            {activeTab === 'about' && <AboutTab onNavigateToExchange={handleNavigateToExchange} />}
            {activeTab === 'earn' && <EarnTab />}
          </Suspense>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Runtime debug panel — DEV only; tree-shaken from production bundle */}
        {import.meta.env.DEV && <DebugPanel />}
      </div>
    </AffiliateContext.Provider>
  );
};

export default Index;
