import { ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onShopNow: () => void;
}

export function HeroBanner({ onShopNow }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 text-primary-foreground animate-scale-in hover-lift min-h-[140px]"
      style={{
        background: 'linear-gradient(145deg, hsl(217 85% 22%) 0%, hsl(215 80% 30%) 50%, hsl(210 75% 38%) 100%)'
      }}
    >
      {/* Rich vignette overlay for depth */}
      <div 
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, hsl(217 85% 15% / 0.4) 100%)'
        }}
      />
      
      {/* Soft highlight glow */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-60"
        style={{
          background: 'radial-gradient(ellipse at top left, hsl(210 90% 50% / 0.25) 0%, transparent 60%)'
        }}
      />
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-2 leading-tight">
          Trusted Phone Shop<br />in Addis Ababa
        </h2>
        <p className="text-sm opacity-90 mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          We sell, buy and exchange.
        </p>
        
        <button 
          onClick={onShopNow}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-foreground text-[hsl(210_100%_35%)] font-semibold rounded-2xl hover:bg-primary-foreground/90 transition-all duration-300 press-effect animate-fade-in group shadow-button-glow hover:shadow-button-glow-hover"
          style={{ animationDelay: '0.25s' }}
        >
          Shop Now
          <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
