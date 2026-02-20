import { useState, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useBrowsePhones } from '@/hooks/usePhones';
import { useCreateExchangeRequest } from '@/hooks/usePhoneActions';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

// Hoist at module scope — starts downloading the cmdk chunk immediately when
// ExchangeTab's own chunk evaluates, so the picker is pre-warmed before the
// user can open the dropdown. Suspense fallback=null means nothing blocks if
// it isn't ready yet (only happens on extremely slow connections).
const _phonePickerChunk = import('./ExchangePhonePicker');
const PhonePickerContent = lazy(() =>
  _phonePickerChunk.then((m) => ({ default: m.ExchangePhonePicker })),
);

const STORAGE_OPTIONS = [64, 128, 256, 512];
const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair'];

export function ExchangeTab() {
  const { sessionId } = useSession();
  const { data: phones = [], isLoading: phonesLoading } = useBrowsePhones({});
  const createExchange = useCreateExchangeRequest(sessionId);

  // Form state
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('');
  const [yourModel, setYourModel] = useState('');
  const [yourStorage, setYourStorage] = useState<number | null>(null);
  const [yourCondition, setYourCondition] = useState<string>('');
  const [extraDetails, setExtraDetails] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [phoneSelectOpen, setPhoneSelectOpen] = useState(false);

  // Filter to only phones (not accessories)
  const availablePhones = useMemo(() => {
    return phones.filter((p) => !p.is_accessory && p.in_stock);
  }, [phones]);

  // Get selected phone display text
  const selectedPhoneDisplay = useMemo(() => {
    if (!selectedPhoneId) return null;
    const phone = availablePhones.find((p) => p.id === selectedPhoneId);
    if (!phone) return null;
    return `${phone.brand} ${phone.model}${phone.storage_gb ? ` ${phone.storage_gb}GB` : ''}`;
  }, [selectedPhoneId, availablePhones]);

  const canSubmit =
    selectedPhoneId && yourModel.trim() && yourStorage && yourCondition;

  const handleSubmit = async () => {
    if (!canSubmit || !sessionId) return;

    try {
      await createExchange.mutate({
        desiredPhoneId: selectedPhoneId,
        offeredModel: yourModel.trim(),
        offeredStorageGb: yourStorage!,
        offeredCondition: yourCondition.toLowerCase(),
        offeredNotes: extraDetails.trim(),
      });
      // Immediately redirect to Telegram bot
      window.location.href = 'https://t.me/TedyTechBot?start=exchange';
    } catch (error) {
      // Error toast handled in hook
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24 px-4">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the phone you want, then enter your phone details.
        </p>
      </div>

      {/* Card 1: Phone You Want */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Phone You Want
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label className="text-sm font-medium">
                Phone You Want
              </Label>
              <Popover open={phoneSelectOpen} onOpenChange={setPhoneSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={phoneSelectOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedPhoneDisplay || "Select the phone you want"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border z-50"
                  align="start"
                >
                  {/* cmdk lives in its own pre-warmed chunk — fallback=null so
                      the popover stays empty for a frame rather than spinning */}
                  <Suspense fallback={null}>
                    <PhonePickerContent
                      phones={availablePhones}
                      phonesLoading={phonesLoading}
                      selectedPhoneId={selectedPhoneId}
                      onSelect={(id) => {
                        setSelectedPhoneId(id);
                        setPhoneSelectOpen(false);
                      }}
                    />
                  </Suspense>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Pick the phone you want to upgrade to.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Your Phone (Trade-In) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Your Phone (Trade-In)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Your Phone Model */}
              <div className="space-y-2">
                <Label htmlFor="your-model" className="text-sm font-medium">
                  Your Phone Model
                </Label>
                <Input
                  id="your-model"
                  placeholder="Example: iPhone 11 / Samsung S21"
                  value={yourModel}
                  onChange={(e) => setYourModel(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Storage Chips */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Storage</Label>
                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS.map((storage) => (
                    <button
                      key={storage}
                      type="button"
                      onClick={() => setYourStorage(storage)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        yourStorage === storage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-primary/20 hover:text-foreground hover:border-primary/50"
                      )}
                    >
                      {storage}GB
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Chips */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Condition</Label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => setYourCondition(condition)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        yourCondition === condition
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-primary/20 hover:text-foreground hover:border-primary/50"
                      )}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Details - Collapsible */}
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {detailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    + Add extra details (optional)
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="extra-details"
                      className="text-sm font-medium"
                    >
                      Extra Details (Optional)
                    </Label>
                    <Textarea
                      id="extra-details"
                      placeholder="Scratches, battery health, any issues… (optional)"
                      value={extraDetails}
                      onChange={(e) => setExtraDetails(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

      {/* CTA Section */}
      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createExchange.isPending}
          className="w-full"
          size="lg"
        >
          {createExchange.isPending ? 'Submitting...' : 'Submit Exchange'}
        </Button>
      </div>
    </div>
  );
}
