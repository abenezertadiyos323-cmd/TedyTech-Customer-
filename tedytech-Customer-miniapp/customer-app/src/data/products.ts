export interface StorageVariant {
  storage: string;
  price: number;
}

export interface Phone {
  id: string;
  name: string;
  brand: string;
  storage: string;
  price: number;
  images: string[];
  colors: string[];
  storageOptions: string[];
  storagePrices: StorageVariant[];
  isNew?: boolean;
  available: boolean;
  exchangeAvailable: boolean;
  condition: 'New' | 'Like New' | 'Used';
  highlights: string[];
  specs: string[];
  isPremium?: boolean;
  isTopDeal?: boolean;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  description: string;
}

export const phones: Phone[] = [
  {
    id: "1",
    name: "iPhone 13 Pro",
    brand: "iPhones",
    storage: "128GB",
    price: 145000,
    images: [
      "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=400&fit=crop",
    ],
    colors: ["Black", "Silver", "Gold"],
    storageOptions: ["128GB", "256GB", "512GB"],
    storagePrices: [
      { storage: "128GB", price: 145000 },
      { storage: "256GB", price: 160000 },
      { storage: "512GB", price: 185000 },
    ],
    isNew: true,
    available: true,
    exchangeAvailable: true,
    condition: 'New',
    isPremium: true,
    highlights: [
      "ProMotion 120Hz display for smooth scrolling",
      "A15 Bionic chip – fastest in its class",
      "Cinematic mode for professional videos",
      "Ceramic Shield front for durability",
      "All-day battery life"
    ],
    specs: [
      "6.1-inch Super Retina XDR display",
      "Triple 12MP camera system",
      "5G capable",
      "Face ID",
      "iOS 17 compatible"
    ]
  },
  {
    id: "2",
    name: "iPhone 12",
    brand: "iPhones",
    storage: "128GB",
    price: 98000,
    images: [
      "https://images.unsplash.com/photo-1611472173362-3f53dbd65d80?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605457212895-83dd7a5d37ff?w=400&h=400&fit=crop",
    ],
    colors: ["Black", "White", "Blue"],
    storageOptions: ["64GB", "128GB", "256GB"],
    storagePrices: [
      { storage: "64GB", price: 85000 },
      { storage: "128GB", price: 98000 },
      { storage: "256GB", price: 115000 },
    ],
    available: true,
    exchangeAvailable: true,
    condition: 'Like New',
    isNew: true,
    isTopDeal: true,
    highlights: [
      "A14 Bionic chip for powerful performance",
      "Super Retina XDR display",
      "Ceramic Shield front cover",
      "Night mode on all cameras",
      "MagSafe compatible"
    ],
    specs: [
      "6.1-inch OLED display",
      "Dual 12MP camera system",
      "5G capable",
      "Face ID",
      "Water resistant IP68"
    ]
  },
  {
    id: "3",
    name: "iPhone 14 Pro",
    brand: "iPhones",
    storage: "256GB",
    price: 235000,
    images: [
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=400&fit=crop",
    ],
    colors: ["Space Black", "Silver", "Deep Purple", "Gold"],
    storageOptions: ["128GB", "256GB", "512GB", "1TB"],
    storagePrices: [
      { storage: "128GB", price: 210000 },
      { storage: "256GB", price: 235000 },
      { storage: "512GB", price: 275000 },
      { storage: "1TB", price: 320000 },
    ],
    isNew: true,
    available: true,
    exchangeAvailable: true,
    condition: 'New',
    isPremium: true,
    highlights: [
      "Dynamic Island – a new way to interact",
      "48MP main camera for incredible detail",
      "Always-On display",
      "A16 Bionic chip",
      "Action mode for smooth videos"
    ],
    specs: [
      "6.1-inch Super Retina XDR display",
      "Pro camera system (48MP, 12MP, 12MP)",
      "5G capable",
      "Crash Detection",
      "Emergency SOS via satellite"
    ]
  },
  {
    id: "4",
    name: "Samsung S23",
    brand: "Samsung",
    storage: "256GB",
    price: 210000,
    images: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    ],
    colors: ["Phantom Black", "Cream", "Green", "Lavender"],
    storageOptions: ["128GB", "256GB", "512GB"],
    storagePrices: [
      { storage: "128GB", price: 185000 },
      { storage: "256GB", price: 210000 },
      { storage: "512GB", price: 245000 },
    ],
    isNew: true,
    available: true,
    exchangeAvailable: true,
    condition: 'New',
    isPremium: true,
    highlights: [
      "Snapdragon 8 Gen 2 for Galaxy",
      "50MP camera with improved night mode",
      "Sleek, premium design",
      "All-day battery with fast charging",
      "One UI 5.1 for smooth experience"
    ],
    specs: [
      "6.1-inch Dynamic AMOLED 2X",
      "Triple camera (50MP + 10MP + 12MP)",
      "5G capable",
      "IP68 water resistant",
      "Wireless PowerShare"
    ]
  },
  {
    id: "5",
    name: "Samsung A54",
    brand: "Samsung",
    storage: "128GB",
    price: 105000,
    images: [
      "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    ],
    colors: ["Awesome Graphite", "Awesome White", "Awesome Violet", "Awesome Lime"],
    storageOptions: ["128GB", "256GB"],
    storagePrices: [
      { storage: "128GB", price: 105000 },
      { storage: "256GB", price: 120000 },
    ],
    available: true,
    exchangeAvailable: false,
    condition: 'New',
    isNew: true,
    isTopDeal: true,
    highlights: [
      "Super AMOLED display with 120Hz",
      "50MP OIS camera for stable shots",
      "5000mAh long-lasting battery",
      "IP67 water resistance",
      "4 years of OS updates"
    ],
    specs: [
      "6.4-inch Super AMOLED",
      "Triple camera (50MP + 12MP + 5MP)",
      "5G capable",
      "Exynos 1380",
      "25W fast charging"
    ]
  },
  {
    id: "6",
    name: "Tecno Camon 20",
    brand: "Tecno",
    storage: "256GB",
    price: 72000,
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    ],
    colors: ["Predawn Black", "Serenity Blue", "Peaceful White"],
    storageOptions: ["128GB", "256GB"],
    storagePrices: [
      { storage: "128GB", price: 62000 },
      { storage: "256GB", price: 72000 },
    ],
    available: true,
    exchangeAvailable: true,
    condition: 'New',
    isNew: true,
    isTopDeal: true,
    highlights: [
      "64MP RGBW camera with OIS",
      "Ultra-thin bezel design",
      "HiOS 13 based on Android 13",
      "5000mAh battery with 33W charging",
      "Excellent value for money"
    ],
    specs: [
      "6.67-inch AMOLED display",
      "MediaTek Helio G85",
      "8GB RAM + 256GB storage",
      "4G LTE",
      "Side-mounted fingerprint"
    ]
  },
  {
    id: "7",
    name: "Infinix Note 30",
    brand: "Infinix",
    storage: "128GB",
    price: 58000,
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    ],
    colors: ["Magic Black", "Variable Gold", "Glacier Blue"],
    storageOptions: ["128GB", "256GB"],
    storagePrices: [
      { storage: "128GB", price: 58000 },
      { storage: "256GB", price: 68000 },
    ],
    available: true,
    exchangeAvailable: true,
    condition: 'Like New',
    isNew: true,
    isTopDeal: true,
    highlights: [
      "68W All-Round FastCharge",
      "108MP ultra-clear camera",
      "JBL stereo speakers",
      "5000mAh battery",
      "120Hz refresh rate"
    ],
    specs: [
      "6.78-inch IPS LCD",
      "MediaTek Helio G99",
      "8GB RAM",
      "4G LTE",
      "Dual stereo speakers"
    ]
  },
  {
    id: "8",
    name: "Xiaomi Redmi Note 12",
    brand: "Xiaomi",
    storage: "128GB",
    price: 64000,
    images: [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    ],
    colors: ["Onyx Gray", "Ice Blue", "Mint Green"],
    storageOptions: ["64GB", "128GB"],
    storagePrices: [
      { storage: "64GB", price: 55000 },
      { storage: "128GB", price: 64000 },
    ],
    available: true,
    exchangeAvailable: true,
    condition: 'New',
    isNew: true,
    highlights: [
      "120Hz AMOLED display",
      "50MP AI Triple Camera",
      "Snapdragon 685 processor",
      "5000mAh with 33W fast charging",
      "MIUI 14 ready"
    ],
    specs: [
      "6.67-inch Super AMOLED",
      "Triple camera (50MP + 8MP + 2MP)",
      "4G LTE",
      "Corning Gorilla Glass 3",
      "Side fingerprint sensor"
    ]
  },
  {
    id: "9",
    name: "Huawei P40",
    brand: "Other Android",
    storage: "128GB",
    price: 92000,
    images: [
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    ],
    colors: ["Black", "Silver Frost", "Deep Sea Blue"],
    storageOptions: ["128GB", "256GB"],
    storagePrices: [
      { storage: "128GB", price: 92000 },
      { storage: "256GB", price: 108000 },
    ],
    available: false,
    exchangeAvailable: false,
    condition: 'Used',
    highlights: [
      "Leica Triple Camera system",
      "Kirin 990 5G processor",
      "Ultra Vision photography",
      "30x zoom capability",
      "Premium glass design"
    ],
    specs: [
      "6.1-inch OLED display",
      "Triple camera (50MP + 16MP + 8MP)",
      "5G capable",
      "AppGallery",
      "IP53 splash resistant"
    ]
  },
  {
    id: "10",
    name: "Android Budget Phone",
    brand: "Other Android",
    storage: "64GB",
    price: 45000,
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    ],
    colors: ["Black", "Blue"],
    storageOptions: ["32GB", "64GB"],
    storagePrices: [
      { storage: "32GB", price: 38000 },
      { storage: "64GB", price: 45000 },
    ],
    available: true,
    exchangeAvailable: true,
    condition: 'Used',
    isTopDeal: true,
    highlights: [
      "Great value for everyday use",
      "Reliable performance",
      "Long-lasting battery",
      "Dual SIM support",
      "Easy to use interface"
    ],
    specs: [
      "6.5-inch HD+ display",
      "Dual camera (13MP + 2MP)",
      "4G LTE",
      "4000mAh battery",
      "Android 12"
    ]
  }
];

export const accessories: Accessory[] = [
  {
    id: "acc-1",
    name: "Wireless Earbuds Pro",
    price: 9500,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop"],
    category: "Audio",
    description: "Premium wireless earbuds with active noise cancellation, crystal-clear sound quality, and up to 24 hours of battery life with the charging case."
  },
  {
    id: "acc-2",
    name: "Fast Charger (Type-C)",
    price: 2500,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop"],
    category: "Charger",
    description: "25W fast charger compatible with most smartphones. Charges your phone from 0 to 50% in just 30 minutes."
  },
  {
    id: "acc-3",
    name: "Premium Phone Case",
    price: 1800,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
    images: ["https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop"],
    category: "Protection",
    description: "Military-grade drop protection with a slim profile. Available for most popular phone models."
  },
  {
    id: "acc-4",
    name: "Screen Protector",
    price: 600,
    image: "https://images.unsplash.com/photo-1600003263720-95b45a4035d5?w=400&h=400&fit=crop",
    images: ["https://images.unsplash.com/photo-1600003263720-95b45a4035d5?w=400&h=400&fit=crop"],
    category: "Protection",
    description: "9H hardness tempered glass screen protector. Crystal clear with 99.9% touch accuracy and oleophobic coating."
  }
];

export const brands = ["iPhones", "Samsung", "Tecno", "Infinix", "Xiaomi", "Other Android"];

export const budgetRanges = [
  { label: "Up to 15k", min: 0, max: 15000 },
  { label: "15k – 50k", min: 15000, max: 50000 },
  { label: "50k – 100k", min: 50000, max: 100000 },
  { label: "100k – 150k", min: 100000, max: 150000 },
  { label: "150k+", min: 150000, max: Infinity },
];

export const storageOptions = ["64GB", "128GB", "256GB", "512GB"];

export const conditionOptions = ["New", "Like New", "Used"] as const;

export type SortOption = 'newest' | 'price-low' | 'price-high';

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
];

// Placeholder data for search suggestions
export const hotSearches = ["iPhone 14 Pro", "Samsung S23", "iPhone 13"];
export const topSearches = ["Tecno Camon 20", "Infinix Note 30", "Samsung A54"];
export const trendingSearches = ["iPhone 12", "Xiaomi Redmi Note 12", "Budget Android"];

export function formatPrice(price: number): string {
  return `${price.toLocaleString()} Birr`;
}
