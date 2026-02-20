import { Badge } from "@/components/ui/badge";
import { cn, getStatusVariant, getStatusLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "order" | "exchange" | "product";
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, variant = "order", showDot = true, className }: StatusBadgeProps) {
  const badgeVariant = getStatusVariant(status);
  const label = getStatusLabel(status);

  // Get status dot color class based on status
  const getDotClass = () => {
    const statusLower = status.toLowerCase();
    if (statusLower === "new") return "status-dot-new";
    if (statusLower === "pending") return "status-dot-pending";
    if (
      statusLower === "completed" ||
      statusLower === "active" ||
      statusLower === "confirmed" ||
      statusLower === "delivered"
    ) {
      return "status-dot-completed";
    }
    if (statusLower === "rejected" || statusLower === "archived" || statusLower === "cancelled") {
      return "status-dot-rejected";
    }
    return "status-dot-new";
  };

  return (
    <Badge variant={badgeVariant} className={cn("gap-1", className)}>
      {showDot && <span className={getDotClass()} />}
      {label}
    </Badge>
  );
}
