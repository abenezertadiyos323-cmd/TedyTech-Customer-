import { Shield, Zap, MapPin, Phone, Navigation, CheckCircle, Clock, DollarSign } from 'lucide-react';
import tedMobileLogo from '@/assets/ted-mobile-logo-88.webp';

export function AboutTab() {
  const trustChips = [
    "Trusted Store",
    "Exchange Available", 
    "Addis Ababa"
  ];

  const features = [
    {
      icon: Shield,
      title: "Trusted & Transparent",
      description: "Every phone is inspected and priced fairly. No hidden fees."
    },
    {
      icon: Zap,
      title: "Fast Exchange Process",
      description: "Get your trade-in value quickly. Upgrade same day."
    },
    {
      icon: MapPin,
      title: "Physical Store Location",
      description: "Visit us in person. See phones before you buy."
    }
  ];

  const promises = [
    { icon: Clock, text: "Fast response" },
    { icon: CheckCircle, text: "Fair exchange evaluation" },
    { icon: DollarSign, text: "Clear prices" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="p-4 animate-slide-down">
          <h1 className="text-xl font-bold text-foreground">About TedyTech</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden flex items-center justify-center shadow-lg animate-bounce-in hover-glow">
            <img src={tedMobileLogo} alt="TED MOBILE" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">TEDYTECH™</h2>
            <p className="text-muted-foreground">We sell, buy and exchange.</p>
          </div>
          
          {/* Trust Chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {trustChips.map((chip, index) => (
              <span
                key={chip}
                className="px-3 py-1.5 bg-blue-light text-primary text-xs font-medium rounded-full opacity-0 animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground animate-slide-in-left">Why Customers Choose Us</h3>
          <div className="space-y-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card rounded-2xl p-4 border border-border card-shadow hover-lift opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-light rounded-xl flex items-center justify-center flex-shrink-0 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Service Promise */}
        <div className="bg-success-light rounded-2xl p-4 border border-success/20 opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <h3 className="font-semibold text-success mb-3">Today's Service Promise</h3>
          <div className="space-y-2">
            {promises.map((promise, index) => {
              const Icon = promise.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-2 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.7 + index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <Icon className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">{promise.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Address Block */}
        <div className="bg-card rounded-2xl p-4 border border-border opacity-0 animate-fade-in hover-lift" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <h3 className="font-semibold text-foreground mb-3">አድራሻ</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 animate-pulse-soft" />
              <span>
                ቦሌ ት/ቤት ፊትለፊት<br />
                አለምነሽ ፕላዛ 014<br />
                (ቴድ ስፖርት)
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 opacity-0 animate-slide-up" style={{ animationDelay: '0.85s', animationFillMode: 'forwards' }}>
          <button className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 text-sm press-effect shadow-button hover-glow group">
            <Phone className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            <span>Call Physical Store</span>
          </button>
          <button className="w-full py-3 bg-secondary text-secondary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all duration-300 text-sm press-effect group">
            <Navigation className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            <span>Get Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
