import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ChevronsUpDown, CheckCircle, Loader2 } from "lucide-react";
import { useBrowsePhones } from "@/hooks/usePhones";
import {
  useCreateExchangeRequest,
  useCreatePhoneAction,
  useTelegramStartLinkBuilder,
  openTelegramDeepLink,
} from "@/hooks/usePhoneActions";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

const _phonePickerChunk = import("./ExchangePhonePicker");
const PhonePickerContent = lazy(() =>
  _phonePickerChunk.then((m) => ({ default: m.ExchangePhonePicker })),
);

const STORAGE_OPTIONS = [64, 128, 256, 512];
const CONDITION_OPTIONS = ["Like New", "Excellent", "Good", "Fair", "Poor"];

type ExchangeStep = "form" | "review" | "submitted";

export function ExchangeTab() {
  const { sessionId, targetExchangePhone } = useApp();
  const { data: phones = [], isLoading: phonesLoading } = useBrowsePhones({});
  const createExchange = useCreateExchangeRequest(sessionId);
  const createPhoneAction = useCreatePhoneAction(sessionId);
  const { buildStartLink } = useTelegramStartLinkBuilder();

  const [step, setStep] = useState<ExchangeStep>("form");
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");
  const [yourModel, setYourModel] = useState("");
  const [yourStorage, setYourStorage] = useState<number | null>(null);
  const [yourCondition, setYourCondition] = useState<string>("");
  const [extraDetails, setExtraDetails] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [phoneSelectOpen, setPhoneSelectOpen] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);

  useEffect(() => {
    if (targetExchangePhone?.id) {
      setSelectedPhoneId(targetExchangePhone.id);
    }
  }, [targetExchangePhone?.id]);

  const availablePhones = useMemo(
    () => phones.filter((phone) => !phone.is_accessory && phone.in_stock),
    [phones],
  );

  const selectedPhoneDisplay = useMemo(() => {
    if (!selectedPhoneId) return null;
    const phone = availablePhones.find((item) => item.id === selectedPhoneId);
    if (!phone) return null;
    return `${phone.brand} ${phone.model}${phone.storage_gb ? ` ${phone.storage_gb}GB` : ""}`;
  }, [selectedPhoneId, availablePhones]);

  const selectedPhoneDetail = useMemo(() => {
    if (!selectedPhoneId) return null;
    return availablePhones.find((item) => item.id === selectedPhoneId);
  }, [selectedPhoneId, availablePhones]);

  const canSubmit =
    selectedPhoneId && yourModel.trim() && yourStorage && yourCondition;

  const handleContinue = () => {
    if (!canSubmit) return;
    setStep("review");
  };

  const handleEditRequest = () => {
    setStep("form");
  };

  const handleFinalSubmit = async () => {
    if (!canSubmit || !sessionId) return;

    try {
      const exchangeRequestId = await createExchange.mutate({
        desiredPhoneId: selectedPhoneId,
        offeredModel: yourModel.trim(),
        offeredStorageGb: yourStorage!,
        offeredCondition: yourCondition.toLowerCase(),
        offeredNotes: extraDetails.trim(),
      });

      try {
        await createPhoneAction.mutate({
          actionType: "exchange",
          sourceTab: targetExchangePhone ? "product_detail" : "home",
          sourceProductId: selectedPhoneId,
          timestamp: Date.now(),
          showErrorToast: false,
        });
      } catch {
        // Analytics logging should not block the exchange handoff.
      }

      const desiredPhoneLabel = selectedPhoneDetail
        ? `${selectedPhoneDetail.brand} ${selectedPhoneDetail.model}${selectedPhoneDetail.storage_gb ? ` ${selectedPhoneDetail.storage_gb}GB` : ""}`
        : selectedPhoneDisplay;

      const deepLink = await buildStartLink({
        actionType: "exchange",
        productId: selectedPhoneId,
        productLabel: desiredPhoneLabel,
        exchangeRequestId,
      });

      setTelegramUrl(deepLink);
      setStep("submitted");
    } catch {
      // Error toast handled by hooks
      setStep("review");
    }
  };

  // Form Step
  if (step === "form") {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the phone you want, then enter your phone details.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Phone You Want
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label className="text-sm font-medium">Phone You Want</Label>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Your Phone (Trade-In)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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
                        : "bg-muted text-muted-foreground border-border hover:bg-primary/20 hover:text-foreground hover:border-primary/50",
                    )}
                  >
                    {storage}GB
                  </button>
                ))}
              </div>
            </div>

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
                        : "bg-muted text-muted-foreground border-border hover:bg-primary/20 hover:text-foreground hover:border-primary/50",
                    )}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

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
                  <Label htmlFor="extra-details" className="text-sm font-medium">
                    Extra Details (Optional)
                  </Label>
                  <Textarea
                    id="extra-details"
                    placeholder="Scratches, battery health, any issues... (optional)"
                    value={extraDetails}
                    onChange={(e) => setExtraDetails(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <div className="pt-2">
          <Button
            onClick={handleContinue}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Review Step
  if (step === "review") {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6">
        <div className="pt-4">
          <h1 className="text-2xl font-bold text-foreground">Review Request</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please review your exchange request before submitting.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Your Current Phone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Model</span>
              <span className="text-sm font-medium text-right">{yourModel}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Storage</span>
              <span className="text-sm font-medium text-right">{yourStorage}GB</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Condition</span>
              <span className="text-sm font-medium text-right">{yourCondition}</span>
            </div>
            {extraDetails && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-muted-foreground">Notes</span>
                <span className="text-sm font-medium text-right max-w-xs">
                  {extraDetails}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              What You Want
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPhoneDetail && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium text-right">
                    {selectedPhoneDetail.brand} {selectedPhoneDetail.model}
                    {selectedPhoneDetail.storage_gb &&
                      ` ${selectedPhoneDetail.storage_gb}GB`}
                  </span>
                </div>
                {selectedPhoneDetail.price_birr !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-sm font-medium text-right">
                      ETB {selectedPhoneDetail.price_birr.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleFinalSubmit}
            disabled={createExchange.isPending || createPhoneAction.isPending}
            className="w-full"
            size="lg"
          >
            {createExchange.isPending || createPhoneAction.isPending
              ? "Submitting..."
              : "Submit Request"}
          </Button>
          <Button
            onClick={handleEditRequest}
            variant="outline"
            disabled={createExchange.isPending || createPhoneAction.isPending}
            className="w-full"
            size="lg"
          >
            Edit Request
          </Button>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 px-6 text-center min-h-[60vh]">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Exchange Request Submitted
          </h2>
          <p className="text-sm text-muted-foreground">
            Our team will contact you on Telegram with the next step.
          </p>
        </div>
        <div className="space-y-2 w-full max-w-xs">
          {telegramUrl && (
            <Button
              className="w-full"
              onClick={() => {
                openTelegramDeepLink(telegramUrl);
              }}
            >
              Continue to Telegram Bot
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("form");
              setSelectedPhoneId("");
              setYourModel("");
              setYourStorage(null);
              setYourCondition("");
              setExtraDetails("");
              setTelegramUrl(null);
            }}
          >
            Back to Exchange
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
