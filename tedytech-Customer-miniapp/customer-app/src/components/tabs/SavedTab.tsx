import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { ProductCard } from '../ProductCard';
import { ProductDetail } from '../ProductDetail';
import { useApp } from '@/contexts/AppContext';
import { useFavorites, favoriteToPhone } from '@/hooks/useFavorites';
import type { Phone } from '@/types/phone';

interface SavedTabProps {
  onNavigateToExchange: () => void;
}

export function SavedTab({ onNavigateToExchange }: SavedTabProps) {
  const { sessionId } = useApp();
  const { data: favorites = [], isLoading } = useFavorites(sessionId);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);

  const savedPhonesList = favorites.map(favoriteToPhone);

  const handlePhoneClick = (phone: Phone) => {
    setSelectedPhone(phone);
    setSelectedPhoneId(phone.id);
  };

  if (selectedPhoneId) {
    return (
      <ProductDetail
        phoneId={selectedPhoneId}
        phone={selectedPhone || undefined}
        onBack={() => { setSelectedPhoneId(null); setSelectedPhone(null); }}
        onExchange={onNavigateToExchange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Saved Phones</h1>
          <p className="text-sm text-muted-foreground">
            {savedPhonesList.length} {savedPhonesList.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedPhonesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">No saved phones yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tap the heart icon on any phone to save it here for later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedPhonesList.map((phone, index) => (
              <ProductCard key={phone.id} phone={phone} onClick={() => handlePhoneClick(phone)} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
