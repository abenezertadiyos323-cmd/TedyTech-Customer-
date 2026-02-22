import React, { useState, useEffect } from 'react';
import { Copy, Share2, DollarSign, Clock, CheckCircle, Users, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAffiliateContext, useCreateAffiliate } from '@/hooks/useAffiliate';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';


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
  const { isAuthenticated, isAuthLoading, authUserId, verifiedCustomerId } = useApp();
  const {
    stats,
    hasAffiliate,
    canUseAffiliate,
  } = useAffiliateContext();
  const createAffiliate = useCreateAffiliate();
  const [hasTriedCreate, setHasTriedCreate] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ── Auto-create affiliate when authenticated user visits Earn tab ─────────
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !authUserId) return;
    if (!verifiedCustomerId || !canUseAffiliate) return;
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
    isAuthenticated,
    authUserId,
    verifiedCustomerId,
    canUseAffiliate,
    hasAffiliate,
    hasTriedCreate,
    isAuthLoading,
    createAffiliate,
  ]);

  // Reset when user identity changes
  useEffect(() => {
    setHasTriedCreate(false);
    setMutationError(null);
  }, [authUserId]);

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString()} ETB`;

  const referralCode = stats.referralCode ?? '';
  const referralLink = stats.referralCode
    ? `${window.location.origin}/?ref=${stats.referralCode}`
    : '';
  const shareMessage = referralLink
    ? `Get your next phone from TedyTech! Use my referral code ${referralCode}: ${referralLink}`
    : '';

  const handleCopyCode = () => {
    if (stats.referralCode) {
      navigator.clipboard.writeText(stats.referralCode).catch(() => {});
      toast.success('Copied!');
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink).catch(() => {});
      toast.success('Link copied!');
    }
  };

  const handleShareTelegram = () => {
    if (!referralLink) return;
    const tg = (window as { Telegram?: { WebApp?: { openLink?: (url: string) => void } } })
      .Telegram?.WebApp;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Get your next phone from TedyTech! Use my referral code ${referralCode}`)}`;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareMessage) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  // Always render the full dashboard immediately.
  // Stats default to zero values; referralCode defaults to null (shown as '—').
  // Buttons are disabled when referralCode is null.
  // Auto-create fires in the background once auth resolves.
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-foreground">Affiliate Program</h1>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pt-20">
        {/* Hero Text */}
        <div className="text-center py-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Earn money when your friend buys a phone through you.
          </h2>
          <p className="text-sm text-muted-foreground">
            Get <span className="text-primary font-bold">{stats.commissionPercent}%</span> commission on every successful referral
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
                <p className="text-lg font-bold text-foreground">{stats.successfulReferrals}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Referral Code Section */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your Referral Code</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-bold text-center text-foreground tracking-wider">
              {referralCode || '—'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="shrink-0"
              disabled={!stats.referralCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Referral Link Section */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your Referral Link</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground truncate">
              {referralLink || '—'}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
              disabled={!stats.referralCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleShareTelegram}
              disabled={!stats.referralCode}
            >
              <Share2 className="w-4 h-4" />
              Telegram
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleShareWhatsApp}
              disabled={!stats.referralCode}
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
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

        {/* Inline retry — shown only after creation was attempted and failed */}
        {hasTriedCreate && !hasAffiliate && !createAffiliate.isPending && (
          <div className="text-center space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              {mutationError
                ? `Setup error: ${mutationError}`
                : 'Could not set up affiliate account.'}
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
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            💰 Paid manually by admin
          </p>
        </div>
      </div>
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
