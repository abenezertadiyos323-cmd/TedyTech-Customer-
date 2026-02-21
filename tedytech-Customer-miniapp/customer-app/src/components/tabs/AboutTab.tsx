import { useState, useRef } from 'react';
import { MapPin, Phone, Navigation, CheckCircle, Clock, DollarSign } from 'lucide-react';
import tedMobileLogo from '@/assets/ted-mobile-logo-88.webp';
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
  hasExchangeButton?: boolean;
}

interface Translations {
  whyChooseUs: string;
  chipTrusted: string;
  chipFairExchange: string;
  chipFast: string;
  chipWarranty: string;
  faqTitle: string;
  faq: FaqItem[];
  goToExchange: string;
}

const translations: Record<Lang, Translations> = {
  en: {
    whyChooseUs: 'Why Customers Choose Us',
    chipTrusted: 'Trusted',
    chipFairExchange: 'Fair Exchange',
    chipFast: 'Fast',
    chipWarranty: '1 Year Warranty',
    faqTitle: 'Warranty & Policies',
    goToExchange: 'Go to Exchange →',
    faq: [
      {
        id: 'item-1',
        title: "📦 1 Year Warranty — What's Covered?",
        content:
          "All phones sold at TedyTech come with a 1-year warranty covering manufacturing defects, hardware failures, and battery issues.\n\n• Covered: factory defects, hardware faults, battery degradation.\n• NOT covered: cracked screens, water damage, physical misuse.\n\nTo make a claim, bring your receipt and the phone to our Addis Ababa store.",
      },
      {
        id: 'item-2',
        title: '🔄 Return & Refund Policy',
        content:
          "Returns are accepted within 48 hours of purchase if the phone has a defect we missed.\n\n• Phone must be in the same condition as sold — unused, no physical damage.\n• Bring your original receipt.\n• After 48 hours: no cash refunds. We offer store credit or an exchange.",
      },
      {
        id: 'item-3',
        title: '🚚 Shipping & Delivery',
        content:
          "We deliver within Addis Ababa.\n\n• Same-day pickup available at our store.\n• Home delivery within 24 hours (fee varies by location).\n• We partner with trusted local couriers.\n• Prefer in-person? Visit us at Bole — opposite the school, Alemnesch Plaza 014.",
      },
      {
        id: 'item-4',
        title: '🛡️ How We Verify Phones (Anti-Fraud)',
        content:
          "Every phone goes through strict verification before sale:\n\n✔ IMEI checked — not blacklisted or reported stolen.\n✔ Authentic hardware — no clone or counterfeit parts.\n✔ iCloud / Google account unlocked — no activation lock.\n✔ Full diagnostic test — camera, battery, screen, speakers.\n\nCloned or locked phones are never sold at TedyTech.",
      },
      {
        id: 'item-5',
        title: '⏱️ Exchange Process Timeline',
        content:
          "The entire exchange process typically takes under 1 hour:\n\n1. Bring your phone — our team evaluates it (15–20 min).\n2. Receive a fair offer based on model, condition, and storage.\n3. Accept the offer and choose your new phone.\n4. Pay any difference and leave with your upgrade — often same day.",
      },
      {
        id: 'item-6',
        title: '📱 Is the Phone Box Included?',
        content:
          "Brand-new phones always come with the original box and full accessories.\n\nFor used/refurbished phones, original packaging varies — some include the box, some don't. Ask us about a specific phone before purchasing.",
      },
      {
        id: 'item-7',
        title: '❓ Do You Buy / Accept Trade-Ins?',
        content:
          "Yes! We buy used phones and accept trade-ins.\n\n• Bring your phone for a free evaluation (no commitment).\n• We assess model, condition, and storage — you get an instant offer.\n• Accept it as credit toward a new phone, or take cash.\n\nReady to exchange? Tap below to start:",
        hasExchangeButton: true,
      },
    ],
  },
  am: {
    whyChooseUs: 'ደንበኞቻችን ለምን ይመርጡናል',
    chipTrusted: 'ታማኝ',
    chipFairExchange: 'ፍትሃዊ ልውውጥ',
    chipFast: 'ፈጣን',
    chipWarranty: '1 ዓመት ዋስትና',
    faqTitle: 'ዋስትና እና ፖሊሲዎች',
    goToExchange: 'ወደ ልውውጥ ሂድ →',
    faq: [
      {
        id: 'item-1',
        title: '📦 1 ዓመት ዋስትና — ምን ይሸፍናል?',
        content:
          "በቴዲቴክ የሚሸጡ ሁሉም ስልኮች 1 ዓመት ዋስትና አላቸው — የማምረቻ ጉድለቶችን፣ የሃርድዌር ችግሮችን እና የባትሪ ጉዳዮችን ይሸፍናል።\n\n• የሚሸፈነው: የፋብሪካ ጉድለቶች፣ የሃርድዌር ስህተቶች፣ የባትሪ መዳከም።\n• የማይሸፈነው: የተሰባበረ ስክሪን፣ የውሃ ጉዳት፣ አካላዊ ጉዳት።\n\nዋስትና ለመጠቀም ደረሰኝዎን እና ስልኩን ወደ ሱቃችን ያምጡ።",
      },
      {
        id: 'item-2',
        title: '🔄 መመለስ እና ገንዘብ መቀበያ ፖሊሲ',
        content:
          "ስልኩ ጉድለት ካለ ከተገዛ በኋላ በ48 ሰዓታት ውስጥ ተቀባይነት ይኖረዋል።\n\n• ስልኩ እንደተሸጠው ሁኔታ መሆን አለበት — ጥቅም ላይ ያልዋለ፣ አካላዊ ጉዳት የሌለበት።\n• ዋናውን ደረሰኝ ያምጡ።\n• ከ48 ሰዓታት በኋላ: ጥሬ ገንዘብ አይመለስም። የሱቅ ክሬዲት ወይም ልውውጥ እናቀርባለን።",
      },
      {
        id: 'item-3',
        title: '🚚 ማድረሻ እና አቅርቦት',
        content:
          "በአዲስ አበባ ውስጥ እናደርሳለን።\n\n• ዕለቱኑ ለመውሰድ ዝግጁ ነን።\n• በ24 ሰዓታት ውስጥ ወደ ቤትዎ እናደርሳለን (ክፍያ እንደ አካባቢ ይለያያል)።\n• ከታማኝ አካባቢ ኩሪየሮች ጋር እንሰራለን።\n• ቀጥታ ለመምጣት: ቦሌ — ት/ቤት ፊትለፊት፣ አለምነሽ ፕላዛ 014 ይጎብኙን።",
      },
      {
        id: 'item-4',
        title: '🛡️ ስልኮችን እንዴት እናረጋግጣለን (ፀረ-ማጭበርበሪያ)',
        content:
          "እያንዳንዱ ስልክ ከመሸጡ በፊት ጥብቅ ምርመራ ያልፋል:\n\n✔ IMEI ተረጋጋጠ — ጥቁር ዝርዝር ላይ የለም ወይም ሰርቆ ሪፖርት ያልተደረገ።\n✔ ትክክለኛ ሃርድዌር — ምንም ክሎን ወይም የወረዱ ክፍሎች የሉም።\n✔ iCloud / Google መለያ ተከፍቷል — ምንም ማስጀመሪያ ቁልፍ የለም።\n✔ ሙሉ ምርመራ — ካሜራ፣ ባትሪ፣ ስክሪን፣ ድምጽ ማጉያ።\n\nክሎን ወይም ቆልፈው የተቀመጡ ስልኮች በቴዲቴክ ፈጽሞ አይሸጡም።",
      },
      {
        id: 'item-5',
        title: '⏱️ የልውውጥ ሂደት ጊዜ',
        content:
          "ሙሉ የልውውጥ ሂደቱ ብዙውን ጊዜ ከ1 ሰዓት ያነሰ ጊዜ ይወስዳል:\n\n1. ስልክዎን ያምጡ — ቡድናችን ይገምግመዋል (15–20 ደቂቃ)።\n2. ሞዴሉን፣ ሁኔታውን እና ማህደሩን ብቃቱ ላይ ተመስርቶ ፍትሃዊ ቅናሽ ያገኛሉ።\n3. ቅናሹን ተቀበሉ እና አዲስ ስልክ ይምረጡ።\n4. ልዩነቱን ይክፈሉ እና ዕለቱኑ ወደ አፕግሬዱ ይሂዱ።",
      },
      {
        id: 'item-6',
        title: '📱 የስልኩ ሳጥን ይካተታል?',
        content:
          "አዲስ ስልኮች ሁል ጊዜ ዋናቸውን ሳጥን እና ሁሉም ተጨማሪ ዕቃዎችን ይዘው ይመጣሉ።\n\nለጥቅም ላይ/ያገለገሉ ስልኮች፣ ዋናው ማሸጊያ ተገኝነት ይለያያል — አንዳንዱ ሳጥን ያካትታል፣ አንዳንዱ ደግሞ አያካትትም። ከመግዛቱ በፊት ስለ ልዩ ስልኩ ይጠይቁን።",
      },
      {
        id: 'item-7',
        title: '❓ ጥቅም ላይ የዋሉ ስልኮችን ይገዛሉ / ልውውጥ ይቀበላሉ?',
        content:
          "አዎ! ጥቅም ላይ የዋሉ ስልኮችን እንገዛለን እና ልውውጥ እንቀበላለን።\n\n• ስልክዎን ለነጻ ግምገማ ያምጡ (ምንም ቃልኪዳን የለም)።\n• ሞዴሉን፣ ሁኔታውን እና ማህደሩን እንገምግማለን — ፈጣን ቅናሽ ያገኛሉ።\n• ቅናሹን ወደ አዲስ ስልክ ክሬዲት ሲሄዱ ወይም ጥሬ ገንዘብ ይቀበሉ።\n\nለልውውጥ ዝግጁ ነዎት? ከዚህ በታች ይጫኑ:",
        hasExchangeButton: true,
      },
    ],
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

  const trustChips = ['Trusted Store', 'Exchange Available', 'Addis Ababa'];

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

  const handleCall = () => {
    // Fire-and-forget lead log — never blocks the tel: redirect
    if (sessionId && storeConfig.phoneNumberE164) {
      createPhoneAction.mutate({
        phoneId: 'store_contact',
        actionType: 'call',
        sourceTab: 'about',
      }).catch(() => {/* non-blocking */});
    }
    if (storeConfig.phoneNumberE164) {
      window.location.href = `tel:${storeConfig.phoneNumberE164}`;
    }
  };

  const handleDirections = () => {
    // Fire-and-forget lead log — never blocks the maps redirect
    if (sessionId && storeConfig.mapsUrl) {
      createPhoneAction.mutate({
        phoneId: 'store_contact',
        actionType: 'map',
        sourceTab: 'about',
      }).catch(() => {/* non-blocking */});
    }
    if (storeConfig.mapsUrl) {
      window.open(storeConfig.mapsUrl, '_blank');
    }
  };

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
          className="bg-success-light rounded-2xl p-4 border border-success/20 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
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
        <div
          className="bg-card rounded-2xl p-4 border border-border opacity-0 animate-fade-in hover-lift"
          style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
        >
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
              {t.faq.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                >
                  <AccordionTrigger className="px-4 py-3 text-sm font-medium text-left text-foreground hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/20 transition-colors">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 text-sm text-muted-foreground">
                    <p className="whitespace-pre-line leading-relaxed">{item.content}</p>
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
