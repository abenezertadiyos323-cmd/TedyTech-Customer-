import { useState, useRef } from 'react';
import { MapPin, Phone, Navigation, CheckCircle, Clock, DollarSign } from 'lucide-react';
import tedyTechLogo from '@/assets/ted-mobile-logo.png';
import { storeConfig } from '@/config/storeConfig';
import { useApp } from '@/contexts/AppContext';
import { useCreatePhoneAction } from '@/hooks/usePhoneActions';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// ─── i18n ──────────────────────────────────────────────────────────────────
type Lang = 'en' | 'am';

interface FaqItem {
  id: string;
  title: string;
  content: string;
  contentAm?: string;
  hasExchangeButton?: boolean;
}

interface Translations {
  whyChooseUs: string;
  chipTrusted: string;
  chipFairExchange: string;
  chipFast: string;
  chipWarranty: string;
  faqTitle: string;
  goToExchange: string;
}

// ─── Bilingual FAQ items ────────────────────────────────────────────────────
// English content is first. contentAm = exact Amharic text provided by store owner.
// Do NOT modify contentAm strings — paste only, no rewrites.
const faqItems: FaqItem[] = [
  {
    id: 'item-1',
    title: "📦 1 Year Warranty — What's Covered?",
    content:
      "All phones sold at TedyTech come with a 1-year warranty covering manufacturing defects, hardware failures, and battery issues.\n\n• Covered: factory defects, hardware faults, battery degradation.\n• NOT covered: cracked screens, water damage, physical misuse.\n\nTo make a claim, bring your receipt and the phone to our Addis Ababa store.",
    contentAm:
      "📦 የ1 ዓመት ዋስትና — ምን ምን ያካትታል?\n\nበTedyTech የሚሸጡ ሁሉም ስልኮች ከፋብሪካ የሚመጡ የቴክኒክ ጉድለቶችን፣ የሃርድዌር ብልሽቶችን እና የባትሪ ችግሮችን የሚሸፍን የ1 ዓመት ዋስትና አላቸው።\n\n• የሚካተቱት፦ የፋብሪካ ጉድለቶች፣ የሃርድዌር ብልሽቶች፣ የባትሪ መበላሸት።\n• የማይካተቱት፦ የተሰበረ ስክሪን፣ በውሃ የደረሰ ጉዳት፣ በአጠቃቀም ስህተት የሚመጡ ጉዳቶች።\n\nአገልግሎቱን ለማግኘት፣ ደረሰኝዎን እና ስልኩን አዲስ አበባ በሚገኘው ሱቃችን ይዘው ይምጡ።",
  },
  {
    id: 'item-2',
    title: '🔄 Return & Refund Policy',
    content:
      "Returns are accepted within 48 hours of purchase if the phone has a defect we missed.\n\n• Phone must be in the same condition as sold — unused, no physical damage.\n• Bring your original receipt.\n• After 48 hours: no cash refunds. We offer store credit or an exchange.",
    contentAm:
      "🔄 የእቃ መመለስ እና የገንዘብ ተመላሽ ፖሊሲ\n\nስልኩ እኛ ያላስተዋልነው የቴክኒክ ችግር (Defect) ካለበት፣ ከተገዛበት ቀን ጀምሮ በ48 ሰዓታት ውስጥ መመለስ ይቻላል።\n\n• ስልኩ በተሸጠበት ሁኔታ መሆን አለበት — ጥቅም ላይ ያልዋለ እና ምንም አይነት የአካል ጉዳት (Physical damage) ያልደረሰበት።\n\n• ዋናውን ደረሰኝ ይዘው ይምጡ።\n\n• ከ48 ሰዓታት በኋላ፦ የጥሬ ገንዘብ ተመላሽ አይደረግም። በምትኩ በሱቃችን ሌላ እቃ መግዣ (Store credit) ወይም ሌላ ስልክ መቀየር እንችላለን።",
  },
  {
    id: 'item-3',
    title: '🚚 Shipping & Delivery',
    content:
      "We deliver within Addis Ababa.\n\n• Same-day pickup available at our store.\n• Home delivery within 24 hours (fee varies by location).\n• We partner with trusted local couriers.\n• Prefer in-person? Visit us at Bole — opposite the school, Alemnesch Plaza 014.",
    contentAm:
      "አዲስ አበባ ውስጥ እናደርሳለን።\n\n• በዕለቱ ከሱቃችን መረከብ (Pickup) ይቻላል።\n• በ24 ሰዓት ውስጥ የቤት ለቤት አቅርቦት (የማድረሻ ክፍያ እንደ ቦታው ይለያያል)።\n• ከታማኝ የሀገር ውስጥ መላላኪያዎች ጋር እንሰራለን።\n• በአካል መገኘት ይመርጣሉ? ቦሌ — አለምነሽ ፕላዛ (Alemnesh Plaza) 014 በሚገኘው TedyTech ሱቃችን ይጎብኙን።",
  },
  {
    id: 'item-4',
    title: '🛡️ How We Verify Phones (Anti-Fraud)',
    content:
      "Every phone goes through strict verification before sale:\n\n✔ IMEI checked — not blacklisted or reported stolen.\n✔ Authentic hardware — no clone or counterfeit parts.\n✔ iCloud / Google account unlocked — no activation lock.\n✔ Full diagnostic test — camera, battery, screen, speakers.\n\nCloned or locked phones are never sold at TedyTech.",
    contentAm:
      "🛡️ ስልኮችን የምናረጋግጥበት መንገድ (ከማጭበርበር የጸዳ)\n\nእያንዳንዱ ስልክ ከመሸጡ በፊት ጥብቅ የማጣራት ሂደት ውስጥ ያልፋል፦\n\n✔ IMEI ተፈትሿል፦ በጥቁር መዝገብ ላይ ያልሰፈረ ወይም የተሰረቀ ተብሎ ሪፖርት ያልተደረገበት።\n✔ ኦሪጅናል ሃርድዌር፦ ምንም አይነት የተቀዳ (clone) ወይም አስመሳይ እቃ የሌለው።\n✔ iCloud / Google አካውንት የተከፈተ፦ ምንም አይነት የኤክቲቬሽን መቆለፊያ (activation lock) የሌለው።\n✔ ሙሉ የቴክኒክ ምርመራ፦ ካሜራ፣ ባትሪ፣ ስክሪን እና ስፒከር።\n\nየተቀዱ (Clone) ወይም የተቆለፉ ስልኮች በTedyTech በፍፁም አይሸጡም።",
  },
  {
    id: 'item-5',
    title: '⏱️ Exchange Process Timeline',
    content:
      "The entire exchange process typically takes under 1 hour:\n\n1. Bring your phone — our team evaluates it (15–20 min).\n2. Receive a fair offer based on model, condition, and storage.\n3. Accept the offer and choose your new phone.\n4. Pay any difference and leave with your upgrade — often same day.",
    contentAm:
      "⏱️ የልውውጥ ሂደት የጊዜ ሰሌዳ\n\nአጠቃላይ የልውውጥ ሂደቱ ብዙውን ጊዜ ከ1 ሰዓት በታች ይፈጃል፦\n\nስልክዎን ይዘው ይምጡ — የቡድናችን አባላት ይመረምሩታል (ከ15–20 ደቂቃ)።\n\nእንደ ስልኩ ሞዴል፣ ሁኔታ እና የሜሞሪ መጠን (Storage) ተመጣጣኝ ዋጋ ይሰጥዎታል።\n\nየቀረበልዎትን ዋጋ ሲቀበሉ አዲሱን ስልክዎን ይመርጣሉ።\n\nየዋጋ ልዩነቱን በመክፈል አዲሱን ስልክዎን (Upgrade) ይዘው ይሄዳሉ — ይህም በአብዛኛው በዚያው ቀን ይጠናቀቃል።",
  },
  {
    id: 'item-6',
    title: '📱 Is the Phone Box Included?',
    content:
      "Brand-new phones always come with the original box and full accessories.\n\nFor used/refurbished phones, original packaging varies — some include the box, some don't. Ask us about a specific phone before purchasing.",
    contentAm:
      "📱 የስልኩ ካርቶን ይካተታል?\n\nአዲስ (Brand-new) ስልኮች ሁልጊዜ ከዋናው ካርቶናቸው እና ከሙሉ መለዋወጫዎቻቸው (accessories) ጋር ይመጣሉ።\n\nለያገለገሉ ወይም እንደ አዲስ ለታደሱ (used/refurbished) ስልኮች፣ የማሸጊያው ሁኔታ ይለያያል — አንዳንዶቹ ካርቶን አላቸው፣ አንዳንዶቹ ደግሞ የላቸውም። ከመግዛትዎ በፊት ስለሚፈልጉት ስልክ በዝርዝር ይጠይቁን።",
  },
  {
    id: 'item-7',
    title: '❓ Do You Buy / Accept Trade-Ins?',
    content:
      "Yes! We buy used phones and accept trade-ins.\n\n• Bring your phone for a free evaluation (no commitment).\n• We assess model, condition, and storage — you get an instant offer.\n• Accept it as credit toward a new phone, or take cash.\n\nReady to exchange? Tap below to start:",
    contentAm:
      "❓ ስልኮችን ትገዛላችሁ / በልውውጥ (Trade-In) ትቀበላላችሁ?\n\nአዎ! ያገለገሉ ስልኮችን እንገዛለን እንዲሁም በልውውጥ እንቀበላለን።\n\n• ያለምንም ግዴታ (no commitment) ለነፃ ግምገማ ስልክዎን ይዘው ይምጡ።\n• የስልኩን ሞዴል፣ ሁኔታ እና የሜሞሪ መጠን (Storage) በማየት ወዲያውኑ ዋጋ እንሰጥዎታለን።\n• የሰጠናችሁን ዋጋ ለአዲስ ስልክ መግዣ (Credit) መጠቀም ወይም በጥሬ ገንዘብ (Cash) መውሰድ ይችላሉ።\n\nለመለዋወጥ ዝግጁ ነዎት? ለመጀመር ከታች ይጫኑ፦",
    hasExchangeButton: true,
  },
];

const translations: Record<Lang, Translations> = {
  en: {
    whyChooseUs: 'Why Customers Choose Us',
    chipTrusted: 'Trusted',
    chipFairExchange: 'Fair Exchange',
    chipFast: 'Fast',
    chipWarranty: '1 Year Warranty',
    faqTitle: 'Warranty & Policies',
    goToExchange: 'Go to Exchange →',
  },
  am: {
    whyChooseUs: 'ደንበኞቻችን ለምን ይመርጡናል',
    chipTrusted: 'ታማኝ',
    chipFairExchange: 'ፍትሃዊ ልውውጥ',
    chipFast: 'ፈጣን',
    chipWarranty: '1 ዓመት ዋስትና',
    faqTitle: 'ዋስትና እና ፖሊሲዎች',
    goToExchange: 'ወደ ልውውጥ ሂድ →',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface AboutTabProps {
  onNavigateToExchange?: () => void;
}

export function AboutTab({ onNavigateToExchange }: AboutTabProps) {
  const { sessionId, telegramUser } = useApp();
  const createPhoneAction = useCreatePhoneAction(sessionId);

  const lang: Lang = telegramUser?.language_code?.startsWith('am') ? 'am' : 'en';
  const t = translations[lang];

  const [openFaq, setOpenFaq] = useState<string>('');
  const faqRef = useRef<HTMLDivElement>(null);

  const trustChips = ['✅ Verified Phones', '🔄 Exchange Available', '📍 Addis Ababa'];

  const benefitChips = [
    { emoji: '✅', label: t.chipTrusted, faqId: 'item-4' },
    { emoji: '💰', label: t.chipFairExchange, faqId: 'item-7' },
    { emoji: '⚡', label: t.chipFast, faqId: 'item-5' },
    { emoji: '🔒', label: t.chipWarranty, faqId: 'item-1' },
  ];

  const promises = [
    { icon: Clock, text: 'Fast response' },
    { icon: CheckCircle, text: 'Fair exchange evaluation' },
    { icon: DollarSign, text: 'Clear prices' },
  ];

  const handleChipClick = (faqId: string) => {
    setOpenFaq(faqId);
    // Scroll FAQ section into view after state update
    setTimeout(() => {
      faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCall = async () => {
    if (sessionId && storeConfig.phoneNumberE164) {
      try {
        await createPhoneAction.mutate({
          actionType: "call",
          sourceTab: "about",
          timestamp: Date.now(),
        });
      } catch {
        // Keep call CTA usable even if lead logging fails.
      }
    }
    if (storeConfig.phoneNumberE164) {
      window.location.href = `tel:${storeConfig.phoneNumberE164}`;
    }
  };

  const handleDirections = async () => {
    if (sessionId && storeConfig.mapsUrl) {
      try {
        await createPhoneAction.mutate({
          actionType: "map",
          sourceTab: "about",
          timestamp: Date.now(),
        });
      } catch {
        // Keep directions CTA usable even if lead logging fails.
      }
    }
    if (storeConfig.mapsUrl) {
      window.open(storeConfig.mapsUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <img src={tedyTechLogo} alt="TedyTech" className="w-full h-full object-cover" />
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
                className="px-3 py-1.5 bg-primary/15 border border-primary/25 text-primary text-xs font-semibold rounded-full opacity-0 animate-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/*
          Why Choose Us — compact benefit chips (2×2 on mobile, 4×1 on sm+)
          REGRESSION GUARD: the chip <button> carries `overflow-hidden` so the flex container
          clips content at the cell boundary, and the label <span> carries `min-w-0` so the
          flex algorithm allows it to shrink below its natural content width. Both classes are
          required for CSS `truncate` (overflow:hidden + text-overflow:ellipsis) to actually
          fire on narrow screens (320px) and long Amharic labels (e.g. "ፍትሃዊ ልውውጥ").
          Do NOT remove overflow-hidden from the button or min-w-0 from the span.
        */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground animate-slide-in-left">{t.whyChooseUs}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {benefitChips.map((chip, index) => (
              <button
                key={chip.faqId}
                onClick={() => handleChipClick(chip.faqId)}
                aria-label={chip.label}
                className="h-10 overflow-hidden flex items-center justify-center gap-1.5 rounded-full border border-border bg-card text-foreground text-sm font-medium hover:bg-muted active:scale-95 transition-all duration-150 opacity-0 animate-fade-in"
                style={{ animationDelay: `${0.3 + index * 0.07}s`, animationFillMode: 'forwards' }}
              >
                <span aria-hidden="true">{chip.emoji}</span>
                <span className="truncate min-w-0">{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Service Promise */}
        <div
          className="bg-primary/10 rounded-2xl p-4 border border-primary/15 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          <h3 className="font-semibold text-foreground mb-3">Today's Service Promise</h3>
          <div className="space-y-2">
            {promises.map((promise, index) => {
              const Icon = promise.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.7 + index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground/80">{promise.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Address Block */}
        <div
          className="bg-card rounded-2xl p-4 border border-border opacity-0 animate-fade-in hover-lift"
          style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
        >
          <h3 className="font-semibold text-foreground mb-3">አድራሻ</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 animate-pulse-soft" />
              <span>
                አለምነሽ ፕላዛ 014<br />
                (ቴድ ስፖርት)
              </span>
            </p>
          </div>
        </div>

        {/*
          FAQ Accordion — Warranty & Policies
          REGRESSION GUARD: `scroll-mt-16` (64px) is required on this div. The sticky <header>
          above is ~56–60px tall. Without this offset, scrollIntoView({ block:'start' })
          triggered by chip clicks scrolls the section title flush with the viewport top — i.e.
          directly behind the sticky header — in both browser and Telegram WebView (Chromium on
          Android, WKWebView on iOS). CSS scroll-margin-top is respected by scrollIntoView in
          both engines. Do NOT remove scroll-mt-16 (or equivalent scroll-margin-top value).
        */}
        <div
          ref={faqRef}
          className="space-y-3 scroll-mt-16 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.88s', animationFillMode: 'forwards' }}
        >
          <h3 className="font-semibold text-foreground">{t.faqTitle}</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Accordion
              type="single"
              collapsible
              value={openFaq}
              onValueChange={setOpenFaq}
            >
              {/*
                REGRESSION GUARD: AccordionItem has NO className override here — the shadcn
                default `border-b` on each item is the sole source of visual dividers between
                FAQ rows. Do NOT add className="border-0" (that removes all dividers). Do NOT
                attempt to replace dividers with a `divide-y` class on the outer wrapper div:
                Accordion.Root is the only direct child of that div, so `divide-y` (which
                targets `> *:not(:first-child)`) never reaches the accordion items and produces
                no borders. The default border-b + container overflow-hidden is the correct
                pattern.
              */}
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                >
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium text-left text-foreground hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/20 transition-colors">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 text-sm text-muted-foreground">
                    <p className="whitespace-pre-line leading-relaxed">{item.content}</p>
                    {item.contentAm && (
                      <p className="whitespace-pre-line leading-relaxed mt-3 pt-3 border-t border-border/40 text-muted-foreground/80">
                        {item.contentAm}
                      </p>
                    )}
                    {item.hasExchangeButton && (
                      <button
                        onClick={onNavigateToExchange}
                        className="mt-3 w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm active:scale-95 hover:bg-primary/90 transition-all duration-150"
                      >
                        {t.goToExchange}
                      </button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="space-y-2 opacity-0 animate-slide-up"
          style={{ animationDelay: '0.95s', animationFillMode: 'forwards' }}
        >
          <button
            onClick={handleCall}
            disabled={!storeConfig.phoneNumberE164}
            className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 text-sm press-effect shadow-button hover-glow group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            <span>Call Physical Store</span>
          </button>
          <button
            onClick={handleDirections}
            disabled={!storeConfig.mapsUrl}
            className="w-full py-3 bg-secondary text-secondary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all duration-300 text-sm press-effect group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            <span>Get Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
