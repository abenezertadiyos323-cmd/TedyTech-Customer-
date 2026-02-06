import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { phones as localPhones } from "@/data/products";
import type { Phone, PhoneDetail } from "@/types/phone";

// Fetch new arrivals for home page
export function useNewArrivals(limit = 10) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const data = products
    .filter((p) => (p.in_stock ?? true) && !(p.is_accessory ?? false))
    .slice(0, limit) as unknown as Phone[];
  return { data, isLoading: convexProducts === undefined };
}

// Fetch popular phones for home page
export function usePopularPhones(limit = 10) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const data = products
    .filter(
      (p) =>
        (p.is_popular ?? p.isTopDeal ?? false) && !(p.is_accessory ?? false),
    )
    .slice(0, limit) as unknown as Phone[];
  return { data, isLoading: convexProducts === undefined };
}

// Fetch premium picks for home page
export function usePremiumPicks(limit = 10) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const data = products
    .filter(
      (p) =>
        (p.is_premium ?? p.isPremium ?? false) && !(p.is_accessory ?? false),
    )
    .slice(0, limit) as unknown as Phone[];
  return { data, isLoading: convexProducts === undefined };
}

// Fetch accessories
export function useAccessories(limit = 20) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const data = products
    .filter((p) => p.is_accessory ?? p.isAccessory ?? false)
    .slice(0, limit) as unknown as Phone[];
  return { data, isLoading: convexProducts === undefined };
}

// Brand mapping: UI brand names to DB brand values
const BRAND_MAPPING: Record<string, { brands: string[]; exclude?: boolean }> = {
  iPhones: { brands: ["Apple"] },
  Samsung: { brands: ["Samsung"] },
  Tecno: { brands: ["Tecno"] },
  Infinix: { brands: ["Infinix"] },
  Xiaomi: { brands: ["Xiaomi", "Redmi", "Poco"] },
  "Other Android": {
    brands: ["Apple", "Samsung", "Tecno", "Infinix", "Xiaomi", "Redmi", "Poco"],
    exclude: true,
  },
};

// Condition mapping: UI condition names to possible DB values
const CONDITION_MAPPING: Record<string, string[]> = {
  New: ["new", "New", "NEW", "brand_new", "Brand New"],
  "Like New": [
    "like_new",
    "Like New",
    "like new",
    "LIKE_NEW",
    "excellent",
    "Excellent",
  ],
  Used: [
    "used",
    "Used",
    "USED",
    "good",
    "Good",
    "fair",
    "Fair",
    "used_a",
    "used_b",
    "used_c",
    "used_d",
  ],
};

// Browse all phones with filters
interface BrowseFilters {
  search?: string;
  brands?: string[]; // UI brand names like "iPhones", "Samsung", etc.
  storage?: number[];
  conditions?: string[]; // UI condition names like "New", "Like New", "Used"
  budget?: { min: number; max: number } | null;
  sort?: "newest" | "price-low" | "price-high";
}

export function useBrowsePhones(filters: BrowseFilters) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];

  // Apply filters in-memory on the server-provided list
  const applyFilters = () => {
    let result = products.filter(
      (p) => (p.in_stock ?? true) && !(p.is_accessory ?? false),
    );

    if (filters.search?.trim()) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter((p) =>
        (p.name + " " + p.brand).toLowerCase().includes(term),
      );
    }

    if (filters.brands?.length) {
      const includesBrands: string[] = [];
      const excludeBrands: string[] = [];
      for (const uiBrand of filters.brands) {
        const mapping = BRAND_MAPPING[uiBrand];
        if (mapping) {
          if (mapping.exclude) excludeBrands.push(...mapping.brands);
          else includesBrands.push(...mapping.brands);
        } else {
          includesBrands.push(uiBrand);
        }
      }
      if (excludeBrands.length > 0 && includesBrands.length === 0) {
        result = result.filter((r) => !excludeBrands.includes(r.brand));
      } else if (includesBrands.length > 0) {
        result = result.filter((r) => includesBrands.includes(r.brand));
      }
    }

    if (filters.storage?.length) {
      result = result.filter((r) =>
        filters.storage!.includes(
          Number((r.storage || "").toString().replace(/[^0-9]/g, "")),
        ),
      );
    }

    if (filters.conditions?.length) {
      const dbConditions: string[] = [];
      for (const uiCondition of filters.conditions) {
        const mapping = CONDITION_MAPPING[uiCondition];
        if (mapping) dbConditions.push(...mapping);
        else dbConditions.push(uiCondition);
      }
      if (dbConditions.length > 0) {
        result = result.filter((r) =>
          dbConditions
            .map((c) => c.toLowerCase())
            .includes(((r.condition || "") as string).toLowerCase()),
        );
      }
    }

    if (filters.budget) {
      result = result.filter(
        (r) => r.price >= filters.budget!.min && r.price <= filters.budget!.max,
      );
    }

    switch (filters.sort) {
      case "price-low":
        result = result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        break;
    }

    return result.slice(0, 100) as unknown as Phone[];
  };

  const data = applyFilters();
  return { data, isLoading: convexProducts === undefined };
}

// Fetch phone detail via RPC
export function usePhoneDetail(phoneId: string | null) {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const found = phoneId ? products.find((p) => p.id === phoneId) || null : null;
  const data = (found
    ? { phone: found, images: [], variants: [] }
    : null) as unknown as PhoneDetail | null;
  return { data, isLoading: convexProducts === undefined };
}

// Fetch filter options from views
export function useFilterBrands() {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const data = Array.from(new Set(products.map((p) => p.brand))).filter(
    Boolean,
  ) as string[];
  return { data, isLoading: convexProducts === undefined };
}

export function useFilterStorage() {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const storage = Array.from(
    new Set(
      products.map((p) =>
        Number((p.storage || "").toString().replace(/[^0-9]/g, "")),
      ),
    ),
  )
    .filter(Boolean)
    .sort((a, b) => a - b);
  return { data: storage as number[], isLoading: convexProducts === undefined };
}

export function useFilterConditions() {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | any[]
    | undefined;
  const products = (convexProducts ?? localPhones) as any[];
  const conds = Array.from(new Set(products.map((p) => p.condition))).filter(
    Boolean,
  ) as string[];
  return { data: conds, isLoading: convexProducts === undefined };
}
