import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { cn, formatDateTime } from "@/lib/utils";
import type { ExchangeRequest } from "@/types/order";
import { ArrowRight } from "lucide-react";

interface ExchangeCardProps {
  exchange: ExchangeRequest;
  onClick?: () => void;
  className?: string;
}

export function ExchangeCard({ exchange, onClick, className }: ExchangeCardProps) {
  const customerLabel =
    (exchange as any).customerName ||
    (exchange as any).customerPhone ||
    (exchange as any).customerTelegramUserId ||
    (exchange.sessionId ? `Session ${exchange.sessionId.substring(0, 12)}...` : "Unknown customer");
  const offeredDevice = (exchange as any).offeredDevice || exchange.offeredModel || "Unknown device";
  const requestedDevice =
    (exchange as any).requestedDevice || exchange.desiredPhoneName || "Unknown device";
  const valuationNote = (exchange as any).valuationNote;

  return (
    <Card className={cn("admin-card-interactive", className)} onClick={onClick}>
      <CardContent className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={exchange.status} variant="exchange" />
          <p className="text-xs text-muted-foreground">{formatDateTime(exchange.createdAt)}</p>
        </div>

        {/* Exchange Details */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Customer</p>
            <p className="font-semibold text-sm">{customerLabel}</p>
            {(exchange as any).customerPhone && (
              <p className="text-xs text-muted-foreground mt-0.5">{(exchange as any).customerPhone}</p>
            )}
          </div>

          {/* Offered Device */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Offering</p>
            <p className="font-semibold text-sm">
              {offeredDevice}
            </p>
            {exchange.offeredCondition && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Condition: {exchange.offeredCondition}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Desired Device */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Wants</p>
            <p className="font-semibold text-sm">{requestedDevice}</p>
          </div>

          {/* Notes */}
          {exchange.offeredNotes && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-xs line-clamp-2">{exchange.offeredNotes}</p>
            </div>
          )}

          {valuationNote && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Valuation Note</p>
              <p className="text-xs line-clamp-2">{valuationNote}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
