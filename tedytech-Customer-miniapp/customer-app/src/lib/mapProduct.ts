import type { Phone } from "@/types/phone";

export interface ProductVM {
  id: string;
  title: string;
  priceBirr: number;
  imageUrl: string;
  inStock: boolean;
  condition: string;
  brand: string;
  model: string;
  storageGb?: number | null;
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function splitNameIntoBrandModel(name: string): { brand: string; model: string } {
  const trimmed = normalizeString(name);
  if (!trimmed) return { brand: "", model: "" };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { brand: "", model: trimmed };

  return {
    brand: parts[0],
    model: parts.slice(1).join(" "),
  };
}

export function mapToProductVM(raw: Record<string, unknown>): ProductVM {
  const id =
    normalizeString(raw.id) ||
    normalizeString(raw._id) ||
    normalizeString(raw.phoneId) ||
    "unknown";

  const rawBrand = normalizeString(raw.brand);
  const rawModel =
    normalizeString(raw.model) ||
    normalizeString(raw.name) ||
    normalizeString(raw.title);

  const inferred = splitNameIntoBrandModel(rawModel);
  const brand = rawBrand || inferred.brand || "Phone";
  const model = rawBrand && rawModel ? rawModel : inferred.model || rawModel || "Item";
  const title = normalizeString(`${brand} ${model}`.trim(), "Phone Item");

  const images = Array.isArray(raw.images)
    ? raw.images.filter((img): img is string => typeof img === "string" && !!img)
    : [];
  const imageUrl =
    normalizeString(raw.main_image_url) ||
    normalizeString(raw.image) ||
    (images.length > 0 ? images[0] : "/placeholder.svg");

  const priceFromBirr = normalizeNumber(raw.price_birr, Number.NaN);
  const priceFromGeneric = normalizeNumber(raw.price, Number.NaN);
  const priceBirr = Number.isFinite(priceFromBirr)
    ? priceFromBirr
    : Number.isFinite(priceFromGeneric)
      ? priceFromGeneric
      : 0;

  const conditionRaw = normalizeString(raw.condition, "used");
  const condition = conditionRaw ? titleCase(conditionRaw.replace(/_/g, " ")) : "Used";

  const inStockValue = raw.in_stock ?? raw.inStock ?? raw.available;
  const inStock =
    typeof inStockValue === "boolean"
      ? inStockValue
      : typeof inStockValue === "number"
        ? inStockValue > 0
        : true;

  const storageGb = normalizeNumber(raw.storage_gb, 0) || undefined;

  return {
    id,
    title,
    priceBirr,
    imageUrl,
    inStock,
    condition,
    brand,
    model,
    storageGb: storageGb,
  };
}

export function productVMToPhone(vm: ProductVM): Phone {
  return {
    id: vm.id,
    brand: vm.brand,
    model: vm.model,
    ram: null,
    storage_gb: null,
    price_birr: vm.priceBirr,
    old_price_birr: null,
    condition: vm.condition.toLowerCase().replace(/\s+/g, "_"),
    main_image_url: vm.imageUrl,
    description: null,
    color: null,
    in_stock: vm.inStock,
    stock_count: null,
    is_new_arrival: false,
    is_popular: false,
    is_premium: false,
    is_accessory: false,
    exchange_available: false,
    negotiable: null,
    key_highlights: null,
    key_specs: null,
    created_at: null,
    updated_at: null,
  };
}
