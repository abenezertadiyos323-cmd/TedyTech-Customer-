/**
 * Admin user type
 */
export interface AdminUser {
  id: string;
  name: string;
  role: "admin" | "super_admin";
  telegramUserId?: number;
}

/**
 * Activity type for inbox/activity feed
 */
export interface Activity {
  id: string;
  type:
    | "product"
    | "order"
    | "exchange"
    | "hotLead"
    | "search"
    | "phone_action"
    | "exchange_request";
  description: string;
  timestamp: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  phoneActionsToday: number;
  exchangeRequestsToday: number;
  totalPhoneActions: number;
  totalExchangeRequests: number;
  recentActivities: Activity[];
}

/**
 * Filter configuration for inventory/orders
 */
export interface Filters {
  search?: string;
  category?: string;
  status?: "active" | "draft" | "archived";
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Tab type for navigation
 */
export type TabType =
  | "dashboard"
  | "inventory"
  | "orders"
  | "inbox"
  | "activity";
