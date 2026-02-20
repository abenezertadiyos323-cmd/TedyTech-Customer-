import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price in ETB
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

/**
 * Format timestamp to absolute date/time
 */
export function formatDateTime(timestamp: number): string {
  return format(timestamp, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format date only
 */
export function formatDate(timestamp: number): string {
  return format(timestamp, "MMM d, yyyy");
}

/**
 * Get status badge variant based on status string
 */
export function getStatusVariant(
  status: string
): "default" | "success" | "warning" | "destructive" {
  const statusLower = status.toLowerCase();

  if (
    statusLower === "active" ||
    statusLower === "completed" ||
    statusLower === "confirmed" ||
    statusLower === "delivered"
  ) {
    return "success";
  }
  if (statusLower === "pending") {
    return "warning";
  }
  if (
    statusLower === "rejected" ||
    statusLower === "archived" ||
    statusLower === "cancelled"
  ) {
    return "destructive";
  }
  return "default";
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Format wait time for hot leads (e.g., "Waiting 8m", "Waiting 3h")
 */
export function formatWaitTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `Waiting ${diffMin}m`;
  if (diffHours < 24) return `Waiting ${diffHours}h`;
  return `Waiting ${diffDays}d`;
}

/**
 * Get lead priority icon based on score
 */
export function getLeadPriorityIcon(score: number): '🔥🔥🔥' | '🔥🔥' | '🔥' | '' {
  if (score === 3) return '🔥🔥🔥';
  if (score === 2) return '🔥🔥';
  if (score === 1) return '🔥';
  return '';
}
