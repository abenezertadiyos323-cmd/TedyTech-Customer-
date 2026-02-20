import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import type { ExchangeRequest } from "@/types/order";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ExchangeStatus } from "@/hooks/useExchanges";

interface ExchangeDetailSheetProps {
  exchange: ExchangeRequest | null;
  onUpdate: (exchangeId: string, status: ExchangeStatus, valuationNote?: string) => Promise<void>;
  onClose: () => void;
}

const STATUS_OPTIONS: ExchangeStatus[] = [
  "pending",
  "reviewing",
  "approved",
  "rejected",
  "completed",
];

const normalizeStatus = (status: unknown): ExchangeStatus => {
  if (typeof status === "string" && STATUS_OPTIONS.includes(status as ExchangeStatus)) {
    return status as ExchangeStatus;
  }
  return "pending";
};

export function ExchangeDetailSheet({ exchange, onUpdate, onClose }: ExchangeDetailSheetProps) {
  const [status, setStatus] = useState<ExchangeStatus>("pending");
  const [valuationNote, setValuationNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!exchange) return null;

  useEffect(() => {
    if (!exchange) {
      return;
    }
    setStatus(normalizeStatus(exchange.status));
    setValuationNote((exchange as any).valuationNote || "");
    setError(null);
    setIsUpdating(false);
  }, [exchange]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate(exchange._id, status, valuationNote);
      onClose();
    } catch (error) {
      setError((error as Error).message || "Failed to update exchange.");
    } finally {
      setIsUpdating(false);
    }
  };

  const customerLabel =
    (exchange as any).customerName ||
    (exchange as any).customerPhone ||
    (exchange as any).customerTelegramUserId ||
    (exchange.sessionId ? `Session ${exchange.sessionId.substring(0, 12)}...` : "Unknown customer");
  const offeredDevice = (exchange as any).offeredDevice || exchange.offeredModel || "Unknown device";
  const requestedDevice =
    (exchange as any).requestedDevice || exchange.desiredPhoneName || "Unknown device";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-h-[85vh] bg-background rounded-t-2xl overflow-y-auto animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold flex-1">Exchange</h2>
            <StatusBadge status={status} variant="exchange" />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card className="admin-card">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Customer</p>
                <p className="font-semibold">{customerLabel}</p>
                {(exchange as any).customerPhone && (
                  <p className="text-sm text-muted-foreground mt-0.5">{(exchange as any).customerPhone}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Offering</p>
                <p className="font-semibold">{offeredDevice}</p>
                {exchange.offeredCondition && (
                  <p className="text-sm text-muted-foreground">{exchange.offeredCondition}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Wants</p>
                <p className="font-semibold">{requestedDevice}</p>
              </div>
            </CardContent>
          </Card>

          {exchange.offeredNotes && (
            <Card className="admin-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Customer Notes</p>
                <p className="text-sm">{exchange.offeredNotes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="admin-card">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      variant={status === option ? "default" : "outline"}
                      size="sm"
                      className="min-h-[36px]"
                      onClick={() => setStatus(option)}
                      disabled={isUpdating}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Valuation Note</p>
                <Input
                  value={valuationNote}
                  onChange={(event) => setValuationNote(event.target.value)}
                  placeholder="Add valuation note"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Created</span>
                <span>{formatDateTime(exchange.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full min-h-[44px]"
            onClick={() => void handleUpdate()}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              "Save Exchange Update"
            )}
          </Button>

          {/* Spacer for bottom safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
