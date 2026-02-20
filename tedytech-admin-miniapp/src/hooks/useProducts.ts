import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { Product } from "@/types/product";

/**
 * Fetch all products for admin view
 */
export function useProducts() {
  const { adminToken, isAuthorized } = useAdmin();
  const convexProducts = useQuery(
    api.products.listAdminProducts,
    adminToken ? { token: adminToken } : "skip",
  );

  const products = (convexProducts ?? []) as Product[];
  const isLoading = Boolean(adminToken) && convexProducts === undefined;
  const error =
    isAuthorized === false
      ? "Unauthorized access."
      : !adminToken && isAuthorized === true
        ? "Admin session unavailable. Reopen the mini app."
        : null;

  return {
    data: products,
    isLoading,
    error,
  };
}

/**
 * Fetch products with filtering
 */
export function useFilteredProducts(filters: {
  search?: string;
  category?: string;
  status?: "active" | "draft" | "archived";
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const { data: allProducts, isLoading, error } = useProducts();

  // Apply filters
  let filtered = [...allProducts];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((p) => p.status === filters.status);
  }

  // Sort
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      if (filters.sortBy === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (filters.sortBy === "price") {
        aVal = a.price;
        bVal = b.price;
      } else if (filters.sortBy === "createdAt") {
        aVal = a.createdAt;
        bVal = b.createdAt;
      }

      if (filters.sortOrder === "desc") {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }

  return {
    data: filtered,
    isLoading,
    error,
  };
}

/**
 * Get product statistics for dashboard
 */
export function useProductStats() {
  const { data: products, isLoading, error } = useProducts();

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    draftProducts: products.filter((p) => p.status === "draft").length,
    archivedProducts: products.filter((p) => p.status === "archived").length,
    featuredProducts: products.filter((p) => p.isFeatured).length,
    newArrivals: products.filter((p) => p.isNewArrival).length,
  };

  return {
    data: stats,
    isLoading,
    error,
  };
}
