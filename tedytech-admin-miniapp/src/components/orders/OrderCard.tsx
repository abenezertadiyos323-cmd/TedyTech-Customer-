import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { cn, formatDateTime, formatPrice } from "@/lib/utils";
import type { AdminOrder, AdminOrderStatus } from "@/types/order";
import { Loader2 } from "lucide-react";

interface OrderCardProps {
  order: AdminOrder;
  onStatusChange?: (status: AdminOrderStatus) => void;
  isUpdating?: boolean;
  className?: string;
}

const ORDER_STATUS_OPTIONS: AdminOrderStatus[] = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
];

export function OrderCard({
  order,
  onStatusChange,
  isUpdating = false,
  className,
}: OrderCardProps) {
  const customerLabel =
    order.customerName || order.customerPhone || order.customerTelegramUserId || "Unknown customer";
  const itemSummary =
    order.itemSummary ||
    (order.itemCount && order.itemCount > 0
      ? `${order.itemCount} item${order.itemCount > 1 ? "s" : ""}`
      : "No item summary");

  return (
    <Card className={cn("admin-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <StatusBadge status={order.status} variant="order" />
          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="text-sm font-semibold">{customerLabel}</p>
            {order.customerPhone && (
              <p className="text-xs text-muted-foreground mt-0.5">{order.customerPhone}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="text-sm">{itemSummary}</p>
          </div>

          {typeof order.totalAmount === "number" && (
            <p className="text-sm font-bold text-primary">{formatPrice(order.totalAmount)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {ORDER_STATUS_OPTIONS.map((status) => (
            <Button
              key={status}
              variant={order.status === status ? "default" : "outline"}
              size="sm"
              className="min-h-[36px]"
              disabled={isUpdating || order.status === status}
              onClick={() => onStatusChange?.(status)}
            >
              {isUpdating && order.status !== status ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                status
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
