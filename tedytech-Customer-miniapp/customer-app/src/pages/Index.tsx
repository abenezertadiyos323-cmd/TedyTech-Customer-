import { useState, lazy, Suspense } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DebugPanel } from '@/components/DebugPanel';
import { cn } from '@/lib/utils';
import { useAffiliate, AffiliateContext } from '@/hooks/useAffiliate';
// Lazy load tab components to reduce initial bundle size
const HomeTab = lazy(() => import('@/components/tabs/HomeTab').then(m => ({ default: m.HomeTab })));
const SavedTab = lazy(() => import('@/components/tabs/SavedTab').then(m => ({ default: m.SavedTab })));
const ExchangeTab = lazy(() => import('@/components/tabs/ExchangeTab').then(m => ({ default: m.ExchangeTab })));
const AboutTab = lazy(() => import('@/components/tabs/AboutTab').then(m => ({ default: m.AboutTab })));
// Hoist the import() so the chunk downloads immediately at app open.
// lazy() reuses the same in-flight promise — no double fetch.
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
      return;
    }
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTransitioning(false);
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
      <div className="max-w-lg mx-auto bg-background min-h-screen relative overflow-hidden">
        {/* Tab Content with transitions */}
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <Suspense fallback={<div className="min-h-screen bg-background pb-24"><div className="flex items-center justify-center pt-40"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div></div>}>
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
            {activeTab === 'about' && <AboutTab />}
            {activeTab === 'earn' && <EarnTab />}
          </Suspense>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Runtime debug panel — only visible on localhost or ?debug=1 */}
        <DebugPanel />
      </div>
    </AffiliateContext.Provider>
  );
};

export default Index;
