import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex_generated/api";
import { phones as localPhones } from "@/data/products";
import type { Phone, PhoneDetail } from "@/types/phone";
import { mapToProductVM, productVMToPhone } from "@/lib/mapProduct";

type RawProduct = Record<string, unknown>;

function parseStorageGb(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCondition(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "used";
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizePhone(raw: RawProduct): Phone {
  const vm = mapToProductVM(raw);
  const base = productVMToPhone(vm);

  const keySpecs = raw.key_specs;
  const legacySpecs = raw.specs;

  return {
    ...base,
    ram: typeof raw.ram === "string" ? raw.ram : null,
    storage_gb: parseStorageGb(raw.storage_gb ?? raw.storage),
    old_price_birr:
      typeof raw.old_price_birr === "number"
        ? raw.old_price_birr
        : typeof raw.oldPrice === "number"
          ? raw.oldPrice
          : null,
    condition: normalizeCondition(raw.condition ?? vm.condition),
    description: typeof raw.description === "string" ? raw.description : null,
    color: typeof raw.color === "string" ? raw.color : null,
    in_stock:
      typeof raw.in_stock === "boolean"
        ? raw.in_stock
        : typeof raw.inStock === "boolean"
          ? raw.inStock
          : vm.inStock,
    stock_count:
      typeof raw.stock_count === "number"
        ? raw.stock_count
        : typeof raw.stockCount === "number"
          ? raw.stockCount
          : null,
    is_new_arrival:
      typeof raw.is_new_arrival === "boolean"
        ? raw.is_new_arrival
        : typeof raw.isNewArrival === "boolean"
          ? raw.isNewArrival
          : typeof raw.isNew === "boolean"
            ? raw.isNew
            : false,
    is_popular:
      typeof raw.is_popular === "boolean"
        ? raw.is_popular
        : typeof raw.isPopular === "boolean"
          ? raw.isPopular
          : typeof raw.isTopDeal === "boolean"
            ? raw.isTopDeal
            : false,
    is_premium:
      typeof raw.is_premium === "boolean"
        ? raw.is_premium
        : typeof raw.isPremium === "boolean"
          ? raw.isPremium
          : false,
    is_accessory:
      raw.type === "accessory" ||
      raw.is_accessory === true ||
      raw.isAccessory === true,
    exchange_available:
      typeof raw.exchange_available === "boolean"
        ? raw.exchange_available
        : typeof raw.exchangeAvailable === "boolean"
          ? raw.exchangeAvailable
          : false,
    negotiable:
      typeof raw.negotiable === "boolean" ? raw.negotiable : null,
    key_highlights: Array.isArray(raw.key_highlights)
      ? (raw.key_highlights.filter(
          (item): item is string => typeof item === "string" && !!item,
        ) as string[])
      : Array.isArray(raw.highlights)
        ? (raw.highlights.filter(
            (item): item is string => typeof item === "string" && !!item,
          ) as string[])
        : null,
    key_specs:
      keySpecs && typeof keySpecs === "object"
        ? (keySpecs as Record<string, unknown>)
        : Array.isArray(legacySpecs)
          ? Object.fromEntries(
              legacySpecs
                .filter((item): item is string => typeof item === "string")
                .map((item, index) => [`Spec ${index + 1}`, item]),
            )
          : null,
    created_at:
      typeof raw.created_at === "string"
        ? raw.created_at
        : typeof raw.createdAt === "number"
          ? new Date(raw.createdAt).toISOString()
          : null,
    updated_at:
      typeof raw.updated_at === "string"
        ? raw.updated_at
        : typeof raw.updatedAt === "number"
          ? new Date(raw.updatedAt).toISOString()
          : null,
    // Spec fields: read directly from raw Convex data (trim + drop whitespace-only)
    screenSize:
      typeof raw.screenSize === "string" && raw.screenSize.trim()
        ? raw.screenSize.trim()
        : undefined,
    battery:
      typeof raw.battery === "string" && raw.battery.trim()
        ? raw.battery.trim()
        : undefined,
    mainCamera:
      typeof raw.mainCamera === "string" && raw.mainCamera.trim()
        ? raw.mainCamera.trim()
        : undefined,
    selfieCamera:
      typeof raw.selfieCamera === "string" && raw.selfieCamera.trim()
        ? raw.selfieCamera.trim()
        : undefined,
    simType:
      typeof raw.simType === "string" && raw.simType.trim()
        ? raw.simType.trim()
        : undefined,
    operatingSystem:
      typeof raw.operatingSystem === "string" && raw.operatingSystem.trim()
        ? raw.operatingSystem.trim()
        : undefined,
    features:
      typeof raw.features === "string" && raw.features.trim()
        ? raw.features.trim()
        : undefined,
    batteryHealth: typeof raw.batteryHealth === "string" ? raw.batteryHealth : undefined,
    modelOrigin: typeof raw.modelOrigin === "string" ? raw.modelOrigin : undefined,
    network: typeof raw.network === "string" ? raw.network : undefined,
    // Variants array
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    // Images: sanitize, trim, drop empty, cap to 6
    images: Array.isArray(raw.images)
      ? (raw.images as unknown[])
          .filter((u): u is string => typeof u === "string")
          .map((u) => u.trim())
          .filter((u) => u.length > 0)
          .slice(0, 6)
      : undefined,
    phoneType:
      typeof raw.phoneType === "string" && raw.phoneType.trim()
        ? raw.phoneType.trim()
        : undefined,
  };
}

function useNormalizedProducts() {
  const convexProducts = useConvexQuery(api.products.listAllProducts) as
    | RawProduct[]
    | undefined;
  const source = (convexProducts ?? (localPhones as unknown as RawProduct[])).filter(
    Boolean,
  );

  return {
    products: source.map(normalizePhone).filter((p) => !!p.id),
    isLoading: convexProducts === undefined,
  };
}

// Brand keywords: case-insensitive substring match against phoneType/searchNormalized
const BRAND_KEYWORDS: Record<string, { keywords: string[]; exclude?: boolean }> = {
  iPhones: { keywords: ["iphone", "apple"] },
  Samsung: { keywords: ["samsung"] },
  Tecno: { keywords: ["tecno"] },
  Infinix: { keywords: ["infinix"] },
  Xiaomi: { keywords: ["xiaomi", "redmi", "poco"] },
  "Other Android": {
    keywords: ["iphone", "apple", "samsung", "tecno", "infinix", "xiaomi", "redmi", "poco"],
    exclude: true,
  },
};

const CONDITION_MAPPING: Record<string, string[]> = {
  New: ["new", "brand_new"],
  "Like New": ["like_new"],
  Excellent: ["excellent"],
  Good: ["good"],
  Fair: ["fair"],
  Poor: ["poor"],
};

interface BrowseFilters {
  search?: string;
  brands?: string[];
  storage?: number[];
  conditions?: string[];
  budget?: { min: number; max: number } | null;
  sort?: "newest" | "price-low" | "price-high";
}

export function useNewArrivals(limit = 10) {
  const { products, isLoading } = useNormalizedProducts();
  const inStockPhones = products.filter(
    (p) => p.in_stock !== false && p.is_accessory !== true,
  );
  const arrivals = inStockPhones.filter((p) => p.is_new_arrival);
  const data = (arrivals.length > 0 ? arrivals : inStockPhones).slice(0, limit);
  return { data, isLoading };
}

export function usePopularPhones(limit = 10) {
  const { products, isLoading } = useNormalizedProducts();
  const inStockPhones = products.filter(
    (p) => p.in_stock !== false && p.is_accessory !== true,
  );
  const popular = inStockPhones.filter((p) => p.is_popular);
  const data = (popular.length > 0 ? popular : inStockPhones).slice(0, limit);
  return { data, isLoading };
}

export function usePremiumPicks(limit = 10) {
  const { products, isLoading } = useNormalizedProducts();
  const inStockPhones = products.filter(
    (p) => p.in_stock !== false && p.is_accessory !== true,
  );
  const premium = inStockPhones.filter((p) => p.is_premium);
  const data = (premium.length > 0 ? premium : inStockPhones).slice(0, limit);
  return { data, isLoading };
}

export function useAccessories(limit = 20) {
  const { products, isLoading } = useNormalizedProducts();
  const data = products
    .filter((p) => p.is_accessory === true && p.in_stock !== false)
    .slice(0, limit);
  return { data, isLoading };
}

export function useBrowsePhones(filters: BrowseFilters) {
  const { products, isLoading } = useNormalizedProducts();

  let result = products.filter(
    (p) => p.in_stock !== false && p.is_accessory !== true,
  );

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    result = result.filter((p) =>
      `${p.brand} ${p.model} ${p.description ?? ""}`.toLowerCase().includes(term),
    );
  }

  if (filters.brands?.length) {
    result = result.filter((phone) => {
      const searchText = (
        (phone as Phone & { searchNormalized?: string }).searchNormalized ??
        phone.phoneType ??
        `${phone.brand} ${phone.model}`
      ).toLowerCase();

      return filters.brands!.some((uiBrand) => {
        const mapping = BRAND_KEYWORDS[uiBrand];
        if (!mapping) return searchText.includes(uiBrand.toLowerCase());
        const hasKeyword = mapping.keywords.some((kw) => searchText.includes(kw));
        return mapping.exclude ? !hasKeyword : hasKeyword;
      });
    });
  }

  if (filters.storage?.length) {
    result = result.filter(
      (phone) => phone.storage_gb && filters.storage!.includes(phone.storage_gb),
    );
  }

  if (filters.conditions?.length) {
    const allowed = new Set(
      filters.conditions.flatMap((condition) => CONDITION_MAPPING[condition] ?? [condition]),
    );
    result = result.filter((phone) => allowed.has(phone.condition.toLowerCase()));
  }

  if (filters.budget) {
    result = result.filter(
      (phone) =>
        phone.price_birr >= filters.budget!.min &&
        phone.price_birr <= filters.budget!.max,
    );
  }

  switch (filters.sort) {
    case "price-low":
      result = [...result].sort((a, b) => a.price_birr - b.price_birr);
      break;
    case "price-high":
      result = [...result].sort((a, b) => b.price_birr - a.price_birr);
      break;
    case "newest":
    default:
      break;
  }

  return { data: result.slice(0, 100), isLoading };
}

export function usePhoneDetail(phoneId: string | null) {
  const { products, isLoading } = useNormalizedProducts();
  const found = phoneId ? products.find((phone) => phone.id === phoneId) ?? null : null;

  const images =
    found?.images && found.images.length > 0
      ? found.images.map((url, i) => ({
          id: `${found.id}-img-${i}`,
          phone_id: found.id,
          image_url: url,
          sort_order: i,
        }))
      : found?.main_image_url
        ? [
            {
              id: `${found.id}-img-0`,
              phone_id: found.id,
              image_url: found.main_image_url,
              sort_order: 0,
            },
          ]
        : [];

  const data = (found
    ? { phone: found, images, variants: found.variants }
    : null) as PhoneDetail | null;

  return { data, isLoading };
}

export function useProductsByIds(ids: string[]) {
  const { products, isLoading } = useNormalizedProducts();
  const idSet = new Set(ids);
  return {
    data: products.filter((product) => idSet.has(product.id)),
    isLoading,
  };
}

export function useFilterBrands() {
  const { products, isLoading } = useNormalizedProducts();
  const data = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
  return { data, isLoading };
}

export function useFilterStorage() {
  const { products, isLoading } = useNormalizedProducts();
  const data = Array.from(
    new Set(products.map((p) => p.storage_gb).filter((value): value is number => !!value)),
  ).sort((a, b) => a - b);
  return { data, isLoading };
}

export function useFilterConditions() {
  const { products, isLoading } = useNormalizedProducts();
  const data = Array.from(new Set(products.map((p) => p.condition))).filter(Boolean);
  return { data, isLoading };
}
