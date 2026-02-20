import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

interface OrderListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export function OrderList<T extends { _id: string }>({
  items,
  renderItem,
  isLoading = false,
  error = null,
  emptyMessage = "No orders found",
  emptyDescription = "Orders will appear here when customers make requests",
  className,
}: OrderListProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-semibold">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div key={item._id}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
