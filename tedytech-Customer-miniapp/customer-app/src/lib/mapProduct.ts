import type { Phone } from "@/types/phone";

export interface ProductVM {
  id: string;
  title: string;
  priceBirr: number;
  imageUrl: string;
  mainImageUrl?: string | null;
  images?: string[];
  inStock: boolean;
  condition: string;
  brand: string;
  model: string;
  storageGb?: number | null;
  storageLabel?: string;
  ram?: string;
  color?: string;
  screenSize?: string;
  battery?: string;
  mainCamera?: string;
  selfieCamera?: string;
  simType?: string;
  operatingSystem?: string;
  features?: string;
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

function parseStorageVariants(raw: Record<string, unknown>): string | undefined {
  const parseCapacity = (value: string): number => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return 0;
    if (normalized.includes("TB")) {
      const tbValue = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
      return Number.isFinite(tbValue) ? tbValue * 1024 : 0;
    }
    const gbValue = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
    return Number.isFinite(gbValue) ? gbValue : 0;
  };

  const formatCapacity = (value: string): string => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return "";
    if (normalized.includes("TB")) return normalized.replace(/\s+/g, "");
    const numeric = normalized.replace(/[^\d.]/g, "");
    return numeric ? `${numeric}GB` : normalized;
  };

  let storages: string[] = [];

  // 1. Array of variants directly
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    storages = raw.variants
      .map((v: any) => formatCapacity(String(v?.storage || "")))
      .filter(Boolean);
  }

  // 2. Fallback to storage_gb string parsing
  if (storages.length === 0 && raw.storage_gb) {
    const s = String(raw.storage_gb).toUpperCase().replace(/GB/g, "").trim();
    if (s === "128256") storages = ["128GB", "256GB"];
    else if (s === "256512") storages = ["256GB", "512GB"];
    else if (s === "5121TB") storages = ["512GB", "1TB"];
    else if (s === "64128") storages = ["64GB", "128GB"];
    else if (s === "64128256") storages = ["64GB", "128GB", "256GB"];
    else if (s === "128256512") storages = ["128GB", "256GB", "512GB"];
    else if (/[,\/& ]/.test(s)) {
      storages = s.split(/[,\/& ]+/).filter(Boolean).map(formatCapacity);
    } else {
      storages = [formatCapacity(s)];
    }
  }

  storages = [...new Set(storages)].filter(Boolean);
  if (storages.length === 0) return undefined;

  const sorted = [...storages].sort((a, b) => parseCapacity(a) - parseCapacity(b));
  const lowest = sorted[0];
  if (!lowest) return undefined;
  if (sorted.length === 1) return lowest;
  return `${lowest} +`;
}

export function mapToProductVM(raw: Record<string, unknown>): ProductVM {
  const id =
    normalizeString(raw.id) ||
    normalizeString(raw._id) ||
    normalizeString(raw.phoneId) ||
    "unknown";

  const rawBrand = normalizeString(raw.brand);
  const rawModel =
    normalizeString(raw.phoneType) ||
    normalizeString(raw.model) ||
    normalizeString(raw.name) ||
    normalizeString(raw.title);

  const inferred = splitNameIntoBrandModel(rawModel);
  const brand = rawBrand || inferred.brand || "Phone";
  const model = rawBrand && rawModel ? rawModel : inferred.model || rawModel || "Item";
  const title = normalizeString(rawModel || "Phone Item");

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
  const storageLabel = parseStorageVariants(raw);

  const ram =
    typeof raw.ram === "string" && raw.ram.trim() ? raw.ram.trim() : undefined;
  const color =
    typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : undefined;

  const screenSize =
    typeof raw.screenSize === "string" && raw.screenSize.trim()
      ? raw.screenSize.trim()
      : undefined;
  const battery =
    typeof raw.battery === "string" && raw.battery.trim()
      ? raw.battery.trim()
      : undefined;
  const mainCamera =
    typeof raw.mainCamera === "string" && raw.mainCamera.trim()
      ? raw.mainCamera.trim()
      : undefined;
  const selfieCamera =
    typeof raw.selfieCamera === "string" && raw.selfieCamera.trim()
      ? raw.selfieCamera.trim()
      : undefined;
  const simType =
    typeof raw.simType === "string" && raw.simType.trim()
      ? raw.simType.trim()
      : undefined;
  const operatingSystem =
    typeof raw.operatingSystem === "string" && raw.operatingSystem.trim()
      ? raw.operatingSystem.trim()
      : undefined;
  const features =
    typeof raw.features === "string" && raw.features.trim()
      ? raw.features.trim()
      : undefined;

  return {
    id,
    title,
    priceBirr,
    imageUrl,
    mainImageUrl: imageUrl || null,
    images: images.length > 0 ? images : undefined,
    inStock,
    condition,
    brand,
    model,
    storageGb,
    storageLabel,
    ram,
    color,
    screenSize,
    battery,
    mainCamera,
    selfieCamera,
    simType,
    operatingSystem,
    features,
  };
}

export function productVMToPhone(vm: ProductVM): Phone {
  return {
    id: vm.id,
    brand: vm.brand,
    model: vm.model,
    ram: vm.ram ?? null,
    storage_gb: vm.storageGb ?? null,
    price_birr: vm.priceBirr,
    old_price_birr: null,
    condition: vm.condition.toLowerCase().replace(/\s+/g, "_"),
    main_image_url: vm.imageUrl,
    description: null,
    color: vm.color ?? null,
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
    screenSize: vm.screenSize,
    battery: vm.battery,
    mainCamera: vm.mainCamera,
    selfieCamera: vm.selfieCamera,
    simType: vm.simType,
    operatingSystem: vm.operatingSystem,
    features: vm.features,
    images: vm.images,
    created_at: null,
    updated_at: null,
  };
}
