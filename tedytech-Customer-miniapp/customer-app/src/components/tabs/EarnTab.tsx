import React, { useState, useEffect } from 'react';
import { Copy, Share2, DollarSign, Clock, CheckCircle, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAffiliateContext, useCreateAffiliate } from '@/hooks/useAffiliate';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { ReferralDebugPanel } from '@/components/ReferralDebugPanel';
import { storeConfig } from '@/config/storeConfig';



// ---------------------------------------------------------------------------
// Local error boundary — catches render errors inside EarnTab only.
// Prevents a broken Earn tab from crashing the entire app.
// ---------------------------------------------------------------------------

interface EarnErrorBoundaryState {
  hasError: boolean;
}

class EarnErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EarnErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EarnErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-xs">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">
              Earn tab encountered an error
            </h2>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// EarnTabInner — main component, wrapped by EarnErrorBoundary below
// ---------------------------------------------------------------------------

function EarnTabInner() {
  const { telegramUser } = useApp();
  const {
    stats,
    hasAffiliate,
  } = useAffiliateContext();
  const createAffiliate = useCreateAffiliate();
  const [hasTriedCreate, setHasTriedCreate] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showManualCopyDialog, setShowManualCopyDialog] = useState(false);

  // ── Auto-create affiliate on first Earn tab visit ─────────────────────────
  // Uses telegramUserId directly — no verifiedCustomerId dependency.
  useEffect(() => {
    if (!telegramUser?.id) return;
    if (hasAffiliate || hasTriedCreate) return;
    if (createAffiliate.isPending) return;

    setHasTriedCreate(true);
    setMutationError(null);
    createAffiliate.mutate().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setMutationError(msg);
      toast.error('Failed to join affiliate program');
    });
  }, [
    telegramUser?.id,
    hasAffiliate,
    hasTriedCreate,
    createAffiliate,
  ]);

  // Reset when Telegram user changes
  useEffect(() => {
    setHasTriedCreate(false);
    setMutationError(null);
  }, [telegramUser?.id]);

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString()} ETB`;

  const referralCode = stats.referralCode ?? '';
  const referralLink = stats.referralCode
    ? `https://t.me/${storeConfig.botUsername}?start=${stats.referralCode}`
    : '';
  const shareMessage = referralLink
    ? `Get your next phone from TedyTech! Use my referral code ${referralCode}: ${referralLink}`
    : '';
  const referredPeopleLabel = `${stats.totalReferredCount} ${
    stats.totalReferredCount === 1 ? 'person' : 'people'
  }`;

  // Check if bot is live (not using default username)
  const isBotReady = import.meta.env.VITE_BOT_USERNAME !== undefined &&
    import.meta.env.VITE_BOT_USERNAME !== '';

  const handleCopyCode = () => {
    if (stats.referralCode) {
      navigator.clipboard.writeText(stats.referralCode).catch(() => {});
      toast.success(isBotReady ? 'Code copied!' : 'Code copied — ready to share when bot is live');
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;

    // Primary: Clipboard API
    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(referralLink);
        copied = true;
      } catch {
        // fall through to textarea fallback
      }
    }

    // Fallback: hidden textarea + execCommand (works in Telegram WebView)
    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = referralLink;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      toast.success('Copied referral link');
    } else {
      toast.error('Copy failed — tap to select');
      setShowManualCopyDialog(true);
    }
  };

  const handleShare = () => {
    if (!referralLink) return;
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`;
    const tg = (window as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void; openLink?: (url: string) => void } } })
      .Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(tgShareUrl);
    } else if (tg?.openLink) {
      tg.openLink(tgShareUrl);
    } else {
      window.open(tgShareUrl, '_blank');
    }
  };

  // Always render the full dashboard immediately.
  // Stats default to zero values; referralCode defaults to null (shown as '—').
  // Buttons are disabled when referralCode is null.
  // Auto-create fires in the background once auth resolves.
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-foreground">Affiliate Program</h1>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 pt-20 pb-6">
        {/* Hero Text */}
        <div className="text-center py-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Earn money when your friend buys a phone through you.
          </h2>
          <p className="text-sm text-muted-foreground">
            Get <span className="text-primary font-bold">{stats.commissionPercent}%</span> commission on every successful referral
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Referred: <span className="text-foreground font-semibold">{referredPeopleLabel}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalEarnings)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.pendingEarnings)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(stats.paidEarnings)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referrals</p>
                <p className="text-lg font-bold text-foreground">{stats.totalReferredCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your Referral Code</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-bold text-center text-foreground tracking-wider">
              {referralCode || '—'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="shrink-0"
              disabled={!stats.referralCode}
              title="Copy your referral code"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {!isBotReady && stats.referralCode && (
            <p className="text-xs text-muted-foreground px-2">
              ✓ Code ready — share anytime you like!
            </p>
          )}
        </Card>

        {/* Referral Link Section */}
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Your Referral Link</h3>
            {!isBotReady && (
              <span className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                Bot coming
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground truncate font-mono">
              {referralLink || '—'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
              disabled={!stats.referralCode}
              title={!isBotReady ? 'Bot not live yet — link format will be ready soon' : 'Copy referral link'}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          {!isBotReady && stats.referralCode && (
            <p className="text-xs text-muted-foreground mb-3 px-2">
              ⏱️ Bot not live yet — link will work after bot is created. Copy your code for now and share when ready!
            </p>
          )}
          <Button
            className="w-full gap-2"
            onClick={handleShare}
            disabled={!stats.referralCode || !isBotReady}
            title={!isBotReady ? 'Share will be available once bot is live' : 'Share via Telegram'}
          >
            <Share2 className="w-4 h-4" />
            {isBotReady ? 'Share' : 'Share (coming soon)'}
          </Button>
        </Card>

        {/* How It Works */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">How It Works</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                1
              </div>
              <p className="text-sm text-muted-foreground">Share your referral code or link with friends</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                2
              </div>
              <p className="text-sm text-muted-foreground">Your friend uses your code when buying a phone</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                3
              </div>
              <p className="text-sm text-muted-foreground">You earn {stats.commissionPercent}% commission after purchase</p>
            </div>
          </div>
        </Card>

        {/* Inline retry — shown only when creation was attempted AND truly failed.
            Checks !stats.referralCode so a successful create (which sets the code
            in getUserReferralStats immediately) does not show a false error. */}
        {hasTriedCreate && !hasAffiliate && !stats.referralCode && !createAffiliate.isPending && (
          <div className="text-center space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              {mutationError
                ? `Setup failed: ${mutationError}`
                : 'Could not create your referral code. Tap to try again.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setHasTriedCreate(false);
                setMutationError(null);
              }}
            >
              Retry setup
            </Button>
          </div>
        )}

        {/* Payout Info */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">
            💰 Paid manually by admin
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">Build: a2bb76c7</p>
        </div>

        {/* Debug panel — hidden unless ?debug=1 or localStorage TEDY_DEBUG=1 */}
        <ReferralDebugPanel />
      </div>

      {/* Manual-copy fallback dialog — shown when clipboard API fails */}
      {showManualCopyDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowManualCopyDialog(false)}
        >
          <div
            className="bg-card rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground">Copy your referral link</h3>
            <p className="text-xs text-muted-foreground">Long-press the link below and tap Copy:</p>
            <input
              readOnly
              value={referralLink}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground font-mono break-all"
              onFocus={(e) => e.currentTarget.select()}
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowManualCopyDialog(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — EarnTabInner wrapped in local error boundary
// ---------------------------------------------------------------------------

export function EarnTab() {
  return (
    <EarnErrorBoundary>
      <EarnTabInner />
    </EarnErrorBoundary>
  );
}
