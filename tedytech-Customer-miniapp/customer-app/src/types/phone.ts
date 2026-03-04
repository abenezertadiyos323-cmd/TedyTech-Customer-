// Phone types

export interface PhoneVariant {
  id: string;
  phone_id: string;
  storage_gb: number;
  color: string;
  price_birr: number | null;
  in_stock: boolean | null;
  is_default: boolean | null;
  stock_count: number | null;
}

export interface PhoneImage {
  id: string;
  phone_id: string;
  image_url: string;
  sort_order: number | null;
}

export interface Phone {
  id: string;
  brand: string;
  model: string;
  ram: string | null;
  storage_gb: number | null;
  price_birr: number;
  old_price_birr: number | null;
  condition: string;
  main_image_url: string;
  description: string | null;
  color: string | null;
  in_stock: boolean | null;
  stock_count: number | null;
  is_new_arrival: boolean | null;
  is_popular: boolean | null;
  is_premium: boolean | null;
  is_accessory: boolean | null;
  exchange_available: boolean | null;
  negotiable: boolean | null;
  key_highlights: string[] | null;
  key_specs: Record<string, unknown> | null;
  // Optional spec fields — added 2026-03-04, backward compatible
  screenSize?: string;
  battery?: string;
  mainCamera?: string;
  selfieCamera?: string;
  simType?: string;
  operatingSystem?: string;
  features?: string;
  phoneType?: string;
  images?: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PhoneDetail {
  phone: Phone;
  images: PhoneImage[];
  variants: PhoneVariant[];
}

export interface Favorite {
  id: string;
  phone_id: string;
  session_id: string;
  created_at: string | null;
}

// Helper functions
export function formatPrice(price: number): string {
  return `${price.toLocaleString()} Birr`;
}

export function getPhoneDisplayName(phone: Phone): string {
  return `${phone.brand} ${phone.model}`;
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    used: "Used",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
  };
  return labels[condition.toLowerCase()] || condition;
}

// Sort options
export type SortOption = "newest" | "price-low" | "price-high";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
];
