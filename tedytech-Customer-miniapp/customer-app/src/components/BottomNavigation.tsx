import { Home, DollarSign, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'earn', label: 'Earn', icon: DollarSign },
  { id: 'exchange', label: 'Exchange', icon: RefreshCw },
  { id: 'about', label: 'About', icon: Info },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { resetToDefaultHome } = useApp();

  const handleTabClick = (tabId: string) => {
    if (tabId === 'home') {
      resetToDefaultHome();
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 bottom-nav-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 press-effect relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-scale-in" />
              )}
              
              <div className={cn(
                "transition-all duration-300",
                isActive && "animate-bounce-in"
              )}>
                <Icon 
                  className={cn(
                    "w-5 h-5 mb-1 transition-all duration-300",
                    isActive && "scale-110"
                  )} 
                  fill={isActive ? "currentColor" : "none"}
                  strokeWidth={isActive ? 1.5 : 2}
                />
              </div>
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
