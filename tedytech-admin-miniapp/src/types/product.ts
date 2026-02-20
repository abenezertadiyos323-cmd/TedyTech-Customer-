/**
 * Product type matching Convex schema
 */
export interface Product {
  _id: string;
  _creationTime: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images?: string[];
  category?: string;
  tags?: string[];
  status: "active" | "draft" | "archived";
  inStock?: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isPopular: boolean;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Product with additional stats (for admin views)
 */
export interface ProductWithStats extends Product {
  viewCount?: number;
  actionCount?: number;
  lastActionAt?: number;
}

/**
 * Product status type
 */
export type ProductStatus = "active" | "draft" | "archived";
