import { useState, useEffect } from 'react';
import { Copy, Share2, DollarSign, Clock, CheckCircle, Users, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAffiliate, useCreateAffiliate } from '@/hooks/useAffiliate';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export function EarnTab() {
  const { isAuthenticated, isAuthLoading, authUserId } = useApp();
  const { stats, hasAffiliate, isLoading: affiliateLoading, error: affiliateError } = useAffiliate();
  const createAffiliate = useCreateAffiliate();
  const [hasTriedCreate, setHasTriedCreate] = useState(false);

  // Derived loading state
  const isLoading = isAuthLoading || (affiliateLoading && isAuthenticated && !!authUserId && !hasAffiliate);


  // Auto-create affiliate when authenticated user visits Earn tab
  useEffect(() => {
    // Don't attempt if still loading auth
    if (isAuthLoading) return;
    
    // Don't attempt if not authenticated
    if (!isAuthenticated || !authUserId) return;
    
    // Don't attempt if already has affiliate or already tried
    if (hasAffiliate || hasTriedCreate) return;
    
    // Don't attempt if currently creating
    if (createAffiliate.isPending) return;

    setHasTriedCreate(true);
    createAffiliate.mutate().catch(() => {
      toast.error('Failed to join affiliate program');
    });
  }, [isAuthenticated, authUserId, hasAffiliate, hasTriedCreate, isAuthLoading, createAffiliate]);

  // Reset hasTriedCreate when authUserId changes
  useEffect(() => {
    setHasTriedCreate(false);
  }, [authUserId]);

  const referralCode = stats.referralCode || '';
  const referralLink = stats.referralCode 
    ? `https://tedytech.com/ref/${stats.referralCode}` 
    : '';

  const handleCopyCode = () => {
    if (stats.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast.success('Referral code copied!');
    }
  };

  const handleCopyLink = () => {
    if (stats.referralCode) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied!');
    }
  };

  const handleShare = async () => {
    if (!stats.referralCode) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TEDYTECH',
          text: `Use my referral code ${stats.referralCode} to get great deals on phones at TEDYTECH!`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ETB`;
  };

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading affiliate program...</p>
        </div>
      </div>
    );
  }

  // Show error state if auth failed
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Connection Error</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Unable to connect to the affiliate program. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show error if affiliate creation failed
  if (affiliateError && !hasAffiliate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Setup Required</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Unable to load your affiliate account. Please try again.
          </p>
          <Button 
            onClick={() => {
              setHasTriedCreate(false);
              createAffiliate.mutate();
            }} 
            disabled={createAffiliate.isPending}
          >
            {createAffiliate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show creating state while affiliate is being set up
  if (!hasAffiliate && (createAffiliate.isPending || !hasTriedCreate)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Setting up your affiliate account...</p>
        </div>
      </div>
    );
  }

  // If we tried creating but still have no affiliate, show an actionable error (not a blank state)
  if (!hasAffiliate && hasTriedCreate && !createAffiliate.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Couldn’t set up your account</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            We couldn’t create or load your affiliate record. Please try again.
          </p>
          <Button
            onClick={() => {
              setHasTriedCreate(false);
              createAffiliate.mutate();
            }}
            disabled={createAffiliate.isPending}
          >
            {createAffiliate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Retry setup
          </Button>
        </div>
      </div>
    );
  }

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
          <Button 
            className="w-full gap-2"
            onClick={handleShare}
            disabled={!stats.referralCode}
          >
            <Share2 className="w-4 h-4" />
            Share Link
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
