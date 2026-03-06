import { Crown, Sparkles, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

export function QuickPicks() {
  const { quickPickMode, setQuickPickMode } = useApp();

  const picks = [
    {
      id: 'arrivals',
      label: 'New Arrivals',
      icon: Sparkles,
      action: () => setQuickPickMode('arrivals'),
      isActive: quickPickMode === 'arrivals'
    },
    {
      id: 'accessories',
      label: 'Accessories',
      icon: Headphones,
      action: () => setQuickPickMode('accessories'),
      isActive: quickPickMode === 'accessories'
    },
    {
      id: 'premium',
      label: 'Premium Picks',
      icon: Crown,
      action: () => setQuickPickMode('premium'),
      isActive: quickPickMode === 'premium'
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Quick Picks
      </h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {picks.map((pick, index) => {
          const Icon = pick.icon;
          
          return (
            <button
              key={pick.id}
              onClick={pick.action}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full whitespace-nowrap transition-all duration-300 press-effect opacity-0 animate-fade-in",
                pick.isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-card border border-border text-foreground hover:bg-muted hover:border-primary/30 hover:scale-105"
              )}
              style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: 'forwards' }}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", pick.isActive ? "drop-shadow-sm" : "")} strokeWidth={2.25} />
              <span className="text-xs sm:text-sm font-medium">{pick.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
