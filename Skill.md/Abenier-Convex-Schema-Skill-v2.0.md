# Abenier Convex Schema Skill v2.0

## Purpose

Authoritative Convex schema reference for the Abenier multi-tenant Telegram commerce system. This skill ensures all backend work conforms to production-ready patterns optimized for 100+ sellers, flexible business types, and Ethiopian market requirements.

**Use this skill when:**

- Designing or modifying Convex tables
- Writing mutations or queries
- Adding new business types
- Reviewing schema compliance
- Building AI-powered features

---

## Quick Reference

| Table           | Purpose                    | Primary Index                  |
| --------------- | -------------------------- | ------------------------------ |
| `sellers`       | Business accounts          | `by_telegramId`                |
| `products`      | Product catalog            | `by_sellerId_status`           |
| `customers`     | Buyer records (per seller) | `by_sellerId_telegramId`       |
| `orders`        | Order lifecycle            | `by_sellerId_status_createdAt` |
| `conversations` | AI chat history            | `by_telegramChatId`            |
| `categories`    | Seller-defined categories  | `by_sellerId_slug`             |
| `subscriptions` | Plan & usage tracking      | `by_sellerId`                  |
| `eventLogs`     | Error & event tracking     | `by_sellerId_type`             |

---

## Architecture Principles

### Multi-Tenancy Rules

- Every table (except `sellers`) has `sellerId` foreign key
- Every query filters by `sellerId` FIRST
- Every mutation verifies ownership before modification
- Zero tolerance for cross-seller data leakage

### Flexible Attributes Pattern

- Product attributes stored as structured array with typed validators
- Business type defined at seller level (`businessType` field)
- UI renders dynamically based on business type configuration
- AI reads structured attributes for accurate responses

### Performance Requirements

- Composite indexes for common query patterns
- Cursor-based pagination (never `.collect()` on large datasets)
- Denormalized stats for dashboard queries
- Search indexes for product discovery

### Naming Conventions

- Tables: lowercase plural (`sellers`, `products`, `orders`)
- Fields: camelCase (`sellerId`, `createdAt`, `businessType`)
- Indexes: `by_[field]` or `by_[field1]_[field2]`
- Status enums: lowercase snake_case (`pending`, `confirmed`, `out_of_stock`)

---

## Complete Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================
// SHARED VALIDATORS
// ============================================

const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

const addressValidator = v.object({
  city: v.string(),
  subcity: v.optional(v.string()),
  woreda: v.optional(v.string()),
  specificLocation: v.optional(v.string()),
  landmark: v.optional(v.string()),
  phone: v.string(),
  recipientName: v.optional(v.string()),
});

const productAttributeValidator = v.object({
  key: v.string(),
  value: v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.null(),
  ),
  displayValue: v.optional(v.string()),
  displayValueAmharic: v.optional(v.string()),
});

const statusHistoryValidator = v.object({
  status: v.string(),
  timestamp: v.number(),
  note: v.optional(v.string()),
  updatedBy: v.optional(v.string()),
});

const messageValidator = v.object({
  id: v.optional(v.string()),
  role: v.string(),
  content: v.string(),
  timestamp: v.number(),
  metadata: v.optional(
    v.object({
      intent: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      orderId: v.optional(v.id("orders")),
      confidence: v.optional(v.number()),
    }),
  ),
});

const faqValidator = v.object({
  question: v.string(),
  answer: v.string(),
});

const orderItemValidator = v.object({
  productId: v.id("products"),
  productName: v.string(),
  productImage: v.optional(v.string()),
  price: v.number(),
  quantity: v.number(),
  attributes: v.optional(v.array(productAttributeValidator)),
  subtotal: v.number(),
});

const usageValidator = v.object({
  productsCount: v.number(),
  productsLimit: v.number(),
  ordersThisMonth: v.number(),
  ordersLimit: v.number(),
  aiMessagesThisMonth: v.number(),
  aiMessagesLimit: v.number(),
  storageUsedMB: v.number(),
  storageLimitMB: v.number(),
});

const discountValidator = v.object({
  type: v.string(),
  value: v.number(),
  reason: v.string(),
  code: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
});

const sellerStatsValidator = v.object({
  totalProducts: v.number(),
  activeProducts: v.number(),
  totalOrders: v.number(),
  pendingOrders: v.number(),
  totalCustomers: v.number(),
  totalRevenue: v.number(),
  lastOrderAt: v.optional(v.number()),
});

const aiContextValidator = v.object({
  summary: v.string(),
  summaryAmharic: v.string(),
  highlights: v.array(v.string()),
  highlightsAmharic: v.array(v.string()),
  intents: v.array(v.string()),
  relatedProducts: v.optional(v.array(v.id("products"))),
  generatedAt: v.number(),
});

const conversationContextValidator = v.object({
  currentIntent: v.optional(v.string()),
  viewedProducts: v.optional(v.array(v.id("products"))),
  cartItems: v.optional(
    v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
  ),
  pendingQuestion: v.optional(v.string()),
});

// ============================================
// SCHEMA DEFINITION
// ============================================

export default defineSchema({
  // ------------------------------------------
  // SELLERS TABLE
  // ------------------------------------------
  sellers: defineTable({
    // Identity
    telegramId: v.string(),
    username: v.optional(v.string()),

    // Business Profile
    businessName: v.string(),
    businessType: v.string(),
    businessDescription: v.optional(v.string()),

    // Contact
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    location: v.optional(v.string()),

    // Branding
    logoUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),

    // Settings
    currency: v.string(),
    language: v.string(),
    isActive: v.boolean(),

    // Chapa Integration
    chapaSecretKey: v.optional(v.string()),
    chapaPublicKey: v.optional(v.string()),
    chapaSubaccountId: v.optional(v.string()),

    // Subscription Reference
    plan: v.string(),
    planExpiresAt: v.optional(v.number()),

    // Denormalized Stats
    _stats: v.optional(sellerStatsValidator),

    // Timestamps
    ...timestampFields,
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_businessType", ["businessType"])
    .index("by_isActive", ["isActive"])
    .index("by_plan", ["plan"]),

  // ------------------------------------------
  // PRODUCTS TABLE
  // ------------------------------------------
  products: defineTable({
    // Ownership
    sellerId: v.id("sellers"),

    // Core Fields
    name: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),

    // Pricing
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    currency: v.string(),

    // Media
    images: v.array(v.string()),
    videoUrl: v.optional(v.string()),

    // Inventory
    stock: v.number(),
    sku: v.optional(v.string()),
    trackInventory: v.boolean(),

    // Status
    status: v.string(),

    // Categorization
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Structured Attributes
    attributes: v.optional(v.array(productAttributeValidator)),

    // AI Fields
    aiDescription: v.optional(v.string()),
    aiContext: v.optional(aiContextValidator),
    faqs: v.optional(v.array(faqValidator)),

    // Visibility
    isFeatured: v.boolean(),
    sortOrder: v.optional(v.number()),

    // Timestamps
    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_status", ["sellerId", "status"])
    .index("by_sellerId_category", ["sellerId", "category"])
    .index("by_sellerId_isFeatured", ["sellerId", "isFeatured"])
    .index("by_sellerId_status_createdAt", ["sellerId", "status", "createdAt"])
    .index("by_sellerId_category_status", ["sellerId", "category", "status"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["sellerId", "status", "category"],
    })
    .searchIndex("search_products_description", {
      searchField: "description",
      filterFields: ["sellerId", "status"],
    }),

  // ------------------------------------------
  // CUSTOMERS TABLE
  // ------------------------------------------
  customers: defineTable({
    // Identity
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Seller Relationship
    sellerId: v.id("sellers"),

    // Contact
    phone: v.optional(v.string()),
    email: v.optional(v.string()),

    // Delivery
    defaultAddress: v.optional(addressValidator),
    savedAddresses: v.optional(v.array(addressValidator)),

    // Analytics
    totalOrders: v.number(),
    totalSpent: v.number(),
    lastOrderAt: v.optional(v.number()),
    averageOrderValue: v.optional(v.number()),

    // Status
    isBlocked: v.boolean(),
    blockReason: v.optional(v.string()),

    // Engagement
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastMessageAt: v.optional(v.number()),

    // Timestamps
    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_telegramId", ["sellerId", "telegramId"])
    .index("by_telegramId", ["telegramId"])
    .index("by_sellerId_lastOrderAt", ["sellerId", "lastOrderAt"])
    .index("by_sellerId_totalSpent", ["sellerId", "totalSpent"]),

  // ------------------------------------------
  // ORDERS TABLE
  // ------------------------------------------
  orders: defineTable({
    // Ownership
    sellerId: v.id("sellers"),
    customerId: v.id("customers"),

    // Identity
    orderNumber: v.string(),

    // Items
    items: v.array(orderItemValidator),

    // Pricing
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    discountCode: v.optional(v.string()),
    total: v.number(),
    currency: v.string(),

    // Delivery
    deliveryAddress: addressValidator,
    deliveryMethod: v.string(),
    deliveryNotes: v.optional(v.string()),
    estimatedDeliveryAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),

    // Status
    status: v.string(),
    statusHistory: v.array(statusHistoryValidator),

    // Payment
    paymentStatus: v.string(),
    paymentMethod: v.optional(v.string()),
    chapaTransactionRef: v.optional(v.string()),
    chapaCheckoutUrl: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    paidAmount: v.optional(v.number()),

    // Communication
    customerNote: v.optional(v.string()),
    adminNote: v.optional(v.string()),

    // Source Tracking
    source: v.string(),
    conversationId: v.optional(v.id("conversations")),

    // Timestamps
    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_status", ["sellerId", "status"])
    .index("by_sellerId_paymentStatus", ["sellerId", "paymentStatus"])
    .index("by_sellerId_createdAt", ["sellerId", "createdAt"])
    .index("by_sellerId_status_createdAt", ["sellerId", "status", "createdAt"])
    .index("by_sellerId_paymentStatus_createdAt", [
      "sellerId",
      "paymentStatus",
      "createdAt",
    ])
    .index("by_customerId", ["customerId"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_chapaTransactionRef", ["chapaTransactionRef"]),

  // ------------------------------------------
  // CONVERSATIONS TABLE
  // ------------------------------------------
  conversations: defineTable({
    // Ownership
    sellerId: v.id("sellers"),
    customerId: v.id("customers"),

    // Telegram Context
    telegramChatId: v.string(),

    // Messages
    messages: v.array(messageValidator),

    // AI State
    context: v.optional(conversationContextValidator),
    lastIntent: v.optional(v.string()),

    // Handoff
    isHandedOff: v.boolean(),
    handoffReason: v.optional(v.string()),
    handoffAt: v.optional(v.number()),
    handoffResolvedAt: v.optional(v.number()),
    handoffResolvedBy: v.optional(v.string()),

    // Status
    status: v.string(),

    // Metrics
    startedAt: v.number(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    aiResponseCount: v.optional(v.number()),
    averageResponseTime: v.optional(v.number()),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_customerId", ["customerId"])
    .index("by_sellerId_status", ["sellerId", "status"])
    .index("by_sellerId_isHandedOff", ["sellerId", "isHandedOff"])
    .index("by_telegramChatId", ["telegramChatId"])
    .index("by_sellerId_lastMessageAt", ["sellerId", "lastMessageAt"]),

  // ------------------------------------------
  // CATEGORIES TABLE
  // ------------------------------------------
  categories: defineTable({
    sellerId: v.id("sellers"),

    name: v.string(),
    nameAmharic: v.optional(v.string()),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),

    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),

    productCount: v.optional(v.number()),

    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_slug", ["sellerId", "slug"])
    .index("by_sellerId_isActive", ["sellerId", "isActive"])
    .index("by_parentId", ["parentId"]),

  // ------------------------------------------
  // SUBSCRIPTIONS TABLE
  // ------------------------------------------
  subscriptions: defineTable({
    sellerId: v.id("sellers"),

    // Plan
    plan: v.string(),
    billingCycle: v.string(),

    // Pricing
    pricePerMonth: v.number(),
    currency: v.string(),

    // Status
    status: v.string(),

    // Dates
    startedAt: v.number(),
    trialEndsAt: v.optional(v.number()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),

    // Usage
    usage: usageValidator,
    usageResetAt: v.number(),

    // Discount
    discount: v.optional(discountValidator),

    // Payment
    chapaCustomerId: v.optional(v.string()),
    lastPaymentAt: v.optional(v.number()),
    lastPaymentAmount: v.optional(v.number()),
    failedPaymentCount: v.number(),

    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_currentPeriodEnd", ["currentPeriodEnd"])
    .index("by_plan", ["plan"]),

  // ------------------------------------------
  // EVENT LOGS TABLE
  // ------------------------------------------
  eventLogs: defineTable({
    // Context
    sellerId: v.optional(v.id("sellers")),
    customerId: v.optional(v.id("customers")),
    orderId: v.optional(v.id("orders")),
    conversationId: v.optional(v.id("conversations")),

    // Classification
    category: v.string(),
    type: v.string(),
    event: v.string(),

    // Details
    message: v.string(),
    messageAmharic: v.optional(v.string()),
    data: v.optional(v.any()),

    // Error Specifics
    errorCode: v.optional(v.string()),
    errorStack: v.optional(v.string()),

    // Resolution
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    resolution: v.optional(v.string()),

    // Source
    source: v.string(),
    requestId: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_category", ["sellerId", "category"])
    .index("by_sellerId_type", ["sellerId", "type"])
    .index("by_sellerId_category_type", ["sellerId", "category", "type"])
    .index("by_orderId", ["orderId"])
    .index("by_resolved", ["resolved"])
    .index("by_createdAt", ["createdAt"])
    .index("by_event", ["event"]),
});
```

---

## Business Type System

### Type Definitions

```typescript
// lib/businessTypes/types.ts

export interface AttributeField {
  key: string;
  label: string;
  labelAmharic: string;
  type: "text" | "number" | "select" | "multiselect" | "boolean";
  required: boolean;
  options?: { value: string; label: string; labelAmharic: string }[];
  placeholder?: string;
  placeholderAmharic?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  helpText?: string;
  helpTextAmharic?: string;
}

export interface CategoryDefinition {
  name: string;
  nameAmharic: string;
  slug: string;
}

export interface BusinessTypeDefinition {
  id: string;
  name: string;
  nameAmharic: string;
  icon: string;
  description: string;
  descriptionAmharic: string;
  attributes: AttributeField[];
  defaultCategories: CategoryDefinition[];
  ai: {
    context: string;
    personality?: string;
    commonIntents: string[];
    escalationKeywords?: string[];
  };
  validation?: {
    minPrice?: number;
    maxPrice?: number;
    requiredImages?: number;
    maxImages?: number;
  };
  features: {
    enableVariants: boolean;
    enableBulkPricing: boolean;
    enablePreorders: boolean;
    enableDigitalProducts: boolean;
    enableRentals: boolean;
  };
  ui?: {
    primaryColor?: string;
    productCardLayout?: "grid" | "list" | "compact";
    showComparePrice?: boolean;
    showStock?: boolean;
  };
}
```

### Registry Implementation

```typescript
// lib/businessTypes/registry.ts

class BusinessTypeRegistry {
  private types = new Map<string, BusinessTypeDefinition>();

  register(definition: BusinessTypeDefinition): void {
    this.types.set(definition.id, definition);
  }

  get(id: string): BusinessTypeDefinition | undefined {
    return this.types.get(id);
  }

  getOrDefault(id: string): BusinessTypeDefinition {
    return this.types.get(id) || this.types.get("general")!;
  }

  list(): BusinessTypeDefinition[] {
    return Array.from(this.types.values());
  }

  getAttributeConfig(
    businessType: string,
    attributeKey: string,
  ): AttributeField | undefined {
    const def = this.getOrDefault(businessType);
    return def.attributes.find((a) => a.key === attributeKey);
  }

  validateAttributes(
    businessType: string,
    attributes: Record<string, unknown>,
  ): { valid: boolean; errors: string[] } {
    const def = this.getOrDefault(businessType);
    const errors: string[] = [];

    for (const field of def.attributes) {
      const value = attributes[field.key];

      if (
        field.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${field.label} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (
          field.validation?.min !== undefined &&
          typeof value === "number" &&
          value < field.validation.min
        ) {
          errors.push(
            `${field.label} must be at least ${field.validation.min}`,
          );
        }
        if (
          field.validation?.max !== undefined &&
          typeof value === "number" &&
          value > field.validation.max
        ) {
          errors.push(`${field.label} must be at most ${field.validation.max}`);
        }
        if (
          field.validation?.pattern &&
          typeof value === "string" &&
          !new RegExp(field.validation.pattern).test(value)
        ) {
          errors.push(
            field.validation.message || `${field.label} format is invalid`,
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getAIContext(businessType: string): string {
    const def = this.getOrDefault(businessType);
    return def.ai.context;
  }

  getAttributeLabel(
    businessType: string,
    attributeKey: string,
    language: "en" | "am" = "am",
  ): string {
    const field = this.getAttributeConfig(businessType, attributeKey);
    if (!field) return attributeKey;
    return language === "am" ? field.labelAmharic : field.label;
  }
}

export const businessTypeRegistry = new BusinessTypeRegistry();
```

### Phone Seller Definition

```typescript
// lib/businessTypes/definitions/phoneSeller.ts

export const phoneSellerDefinition: BusinessTypeDefinition = {
  id: "phone_seller",
  name: "Phone Seller",
  nameAmharic: "ስልክ ሻጭ",
  icon: "📱",
  description: "Mobile phones, tablets, and accessories",
  descriptionAmharic: "ሞባይል ስልኮች፣ ታብሌቶች እና አክሰሰሪዎች",

  attributes: [
    {
      key: "brand",
      label: "Brand",
      labelAmharic: "ብራንድ",
      type: "select",
      required: true,
      options: [
        { value: "samsung", label: "Samsung", labelAmharic: "ሳምሰንግ" },
        { value: "iphone", label: "iPhone", labelAmharic: "አይፎን" },
        { value: "tecno", label: "Tecno", labelAmharic: "ቴክኖ" },
        { value: "infinix", label: "Infinix", labelAmharic: "ኢንፊኒክስ" },
        { value: "xiaomi", label: "Xiaomi", labelAmharic: "ሻኦሚ" },
        { value: "oppo", label: "Oppo", labelAmharic: "ኦፖ" },
        { value: "realme", label: "Realme", labelAmharic: "ሪልሚ" },
        { value: "huawei", label: "Huawei", labelAmharic: "ሁዋዌ" },
        { value: "vivo", label: "Vivo", labelAmharic: "ቪቮ" },
        { value: "nokia", label: "Nokia", labelAmharic: "ኖኪያ" },
        { value: "other", label: "Other", labelAmharic: "ሌላ" },
      ],
    },
    {
      key: "model",
      label: "Model",
      labelAmharic: "ሞዴል",
      type: "text",
      required: true,
      placeholder: "e.g., Galaxy A54, iPhone 15 Pro",
      placeholderAmharic: "ለምሳሌ: Galaxy A54, iPhone 15 Pro",
    },
    {
      key: "storage",
      label: "Storage",
      labelAmharic: "ማከማቻ",
      type: "select",
      required: true,
      options: [
        { value: "16GB", label: "16GB", labelAmharic: "16ጂቢ" },
        { value: "32GB", label: "32GB", labelAmharic: "32ጂቢ" },
        { value: "64GB", label: "64GB", labelAmharic: "64ጂቢ" },
        { value: "128GB", label: "128GB", labelAmharic: "128ጂቢ" },
        { value: "256GB", label: "256GB", labelAmharic: "256ጂቢ" },
        { value: "512GB", label: "512GB", labelAmharic: "512ጂቢ" },
        { value: "1TB", label: "1TB", labelAmharic: "1ቲቢ" },
      ],
    },
    {
      key: "ram",
      label: "RAM",
      labelAmharic: "ራም",
      type: "select",
      required: false,
      options: [
        { value: "2GB", label: "2GB", labelAmharic: "2ጂቢ" },
        { value: "3GB", label: "3GB", labelAmharic: "3ጂቢ" },
        { value: "4GB", label: "4GB", labelAmharic: "4ጂቢ" },
        { value: "6GB", label: "6GB", labelAmharic: "6ጂቢ" },
        { value: "8GB", label: "8GB", labelAmharic: "8ጂቢ" },
        { value: "12GB", label: "12GB", labelAmharic: "12ጂቢ" },
        { value: "16GB", label: "16GB", labelAmharic: "16ጂቢ" },
      ],
    },
    {
      key: "condition",
      label: "Condition",
      labelAmharic: "ሁኔታ",
      type: "select",
      required: true,
      options: [
        {
          value: "new",
          label: "Brand New (Sealed)",
          labelAmharic: "አዲስ (የታሸገ)",
        },
        {
          value: "new_open",
          label: "New (Open Box)",
          labelAmharic: "አዲስ (የተከፈተ)",
        },
        { value: "like_new", label: "Like New", labelAmharic: "እንደ አዲስ" },
        {
          value: "used_excellent",
          label: "Used - Excellent",
          labelAmharic: "ጥቅም ላይ የዋለ - እጅግ ጥሩ",
        },
        {
          value: "used_good",
          label: "Used - Good",
          labelAmharic: "ጥቅም ላይ የዋለ - ጥሩ",
        },
        {
          value: "used_fair",
          label: "Used - Fair",
          labelAmharic: "ጥቅም ላይ የዋለ - መካከለኛ",
        },
      ],
    },
    {
      key: "color",
      label: "Color",
      labelAmharic: "ቀለም",
      type: "text",
      required: false,
      placeholder: "e.g., Black, Midnight Blue",
    },
    {
      key: "warranty",
      label: "Warranty",
      labelAmharic: "ዋስትና",
      type: "select",
      required: true,
      options: [
        { value: "none", label: "No Warranty", labelAmharic: "ዋስትና የለም" },
        {
          value: "shop_1m",
          label: "1 Month Shop Warranty",
          labelAmharic: "1 ወር የሱቅ ዋስትና",
        },
        {
          value: "shop_3m",
          label: "3 Months Shop Warranty",
          labelAmharic: "3 ወር የሱቅ ዋስትና",
        },
        {
          value: "shop_6m",
          label: "6 Months Shop Warranty",
          labelAmharic: "6 ወር የሱቅ ዋስትና",
        },
        {
          value: "shop_1y",
          label: "1 Year Shop Warranty",
          labelAmharic: "1 ዓመት የሱቅ ዋስትና",
        },
        {
          value: "official_1y",
          label: "1 Year Official Warranty",
          labelAmharic: "1 ዓመት ኦፊሴላዊ ዋስትና",
        },
        {
          value: "official_2y",
          label: "2 Year Official Warranty",
          labelAmharic: "2 ዓመት ኦፊሴላዊ ዋስትና",
        },
      ],
    },
    {
      key: "network",
      label: "Network",
      labelAmharic: "ኔትወርክ",
      type: "select",
      required: false,
      options: [
        { value: "unlocked", label: "Unlocked", labelAmharic: "ያልተቆለፈ" },
        {
          value: "ethio_telecom",
          label: "Ethio Telecom",
          labelAmharic: "ኢትዮ ቴሌኮም",
        },
        {
          value: "safaricom",
          label: "Safaricom Ethiopia",
          labelAmharic: "ሳፋሪኮም ኢትዮጵያ",
        },
      ],
    },
    {
      key: "includes",
      label: "Includes",
      labelAmharic: "የሚካተቱ",
      type: "multiselect",
      required: false,
      options: [
        { value: "charger", label: "Charger", labelAmharic: "ቻርጀር" },
        { value: "cable", label: "Cable", labelAmharic: "ገመድ" },
        { value: "earphones", label: "Earphones", labelAmharic: "ጆሮ ማዳመጫ" },
        { value: "case", label: "Case", labelAmharic: "ኬዝ" },
        {
          value: "screen_protector",
          label: "Screen Protector",
          labelAmharic: "ስክሪን ፕሮቴክተር",
        },
        { value: "box", label: "Original Box", labelAmharic: "ኦሪጅናል ሳጥን" },
      ],
    },
  ],

  defaultCategories: [
    { name: "Smartphones", nameAmharic: "ስማርትፎኖች", slug: "smartphones" },
    { name: "Feature Phones", nameAmharic: "ቀላል ስልኮች", slug: "feature-phones" },
    { name: "Tablets", nameAmharic: "ታብሌቶች", slug: "tablets" },
    { name: "Accessories", nameAmharic: "አክሰሰሪዎች", slug: "accessories" },
    {
      name: "Chargers & Cables",
      nameAmharic: "ቻርጀሮች እና ገመዶች",
      slug: "chargers",
    },
    { name: "Cases & Covers", nameAmharic: "ኬዞች", slug: "cases" },
    {
      name: "Screen Protectors",
      nameAmharic: "ስክሪን ፕሮቴክተሮች",
      slug: "screen-protectors",
    },
    { name: "Earphones & Headphones", nameAmharic: "ጆሮ ማዳመጫዎች", slug: "audio" },
    { name: "Power Banks", nameAmharic: "ፓወር ባንኮች", slug: "power-banks" },
    { name: "Smartwatches", nameAmharic: "ስማርት ሰዓቶች", slug: "smartwatches" },
  ],

  ai: {
    context: `You are a helpful sales assistant for a phone shop in Ethiopia.

EXPERTISE:
- Mobile phone specifications (storage, RAM, camera, processor)
- Brand comparisons (Samsung vs iPhone vs Tecno vs Infinix)
- Price ranges for different conditions (new, used)
- Warranty policies and what they cover
- Network compatibility (Ethio Telecom, Safaricom)

COMMON QUESTIONS:
- "ዋጋው ስንት ነው?" (What's the price?)
- "ዋስትና አለው?" (Does it have warranty?)
- "አዲስ ነው ወይስ ጥቅም ላይ የዋለ?" (Is it new or used?)
- "ማከማቻው ስንት ነው?" (What's the storage?)
- "ካሜራው ጥሩ ነው?" (Is the camera good?)

RESPONSE STYLE:
- Primary language: Amharic
- Use English for technical terms
- Be honest about product conditions
- Guide ready-to-buy customers to place orders`,
    personality: "Friendly, knowledgeable, honest",
    commonIntents: [
      "price_inquiry",
      "specs_inquiry",
      "availability_check",
      "warranty_inquiry",
      "condition_inquiry",
      "comparison_request",
      "payment_options",
      "delivery_inquiry",
    ],
    escalationKeywords: [
      "complaint",
      "refund",
      "broken",
      "fake",
      "scam",
      "manager",
      "problem",
    ],
  },

  validation: {
    minPrice: 500,
    maxPrice: 500000,
    requiredImages: 1,
    maxImages: 10,
  },

  features: {
    enableVariants: true,
    enableBulkPricing: false,
    enablePreorders: true,
    enableDigitalProducts: false,
    enableRentals: false,
  },

  ui: {
    primaryColor: "#1a73e8",
    productCardLayout: "grid",
    showComparePrice: true,
    showStock: true,
  },
};

businessTypeRegistry.register(phoneSellerDefinition);
```

### General Fallback Definition

```typescript
// lib/businessTypes/definitions/general.ts

export const generalDefinition: BusinessTypeDefinition = {
  id: "general",
  name: "General Store",
  nameAmharic: "አጠቃላይ ሱቅ",
  icon: "🏪",
  description: "Various products and services",
  descriptionAmharic: "የተለያዩ ምርቶች እና አገልግሎቶች",

  attributes: [
    {
      key: "custom1",
      label: "Custom Field 1",
      labelAmharic: "ብጁ መስክ 1",
      type: "text",
      required: false,
    },
    {
      key: "custom2",
      label: "Custom Field 2",
      labelAmharic: "ብጁ መስክ 2",
      type: "text",
      required: false,
    },
    {
      key: "custom3",
      label: "Custom Field 3",
      labelAmharic: "ብጁ መስክ 3",
      type: "text",
      required: false,
    },
  ],

  defaultCategories: [
    { name: "Products", nameAmharic: "ምርቶች", slug: "products" },
    { name: "Services", nameAmharic: "አገልግሎቶች", slug: "services" },
  ],

  ai: {
    context: `You are a helpful assistant for a general store in Ethiopia.
Respond in Amharic primarily. Be helpful about products and services.`,
    commonIntents: ["price_inquiry", "availability_check", "delivery_inquiry"],
    escalationKeywords: ["complaint", "refund", "problem"],
  },

  validation: {
    minPrice: 1,
    requiredImages: 0,
  },

  features: {
    enableVariants: false,
    enableBulkPricing: false,
    enablePreorders: false,
    enableDigitalProducts: false,
    enableRentals: false,
  },
};

businessTypeRegistry.register(generalDefinition);
```

---

## Subscription Plans

```typescript
// lib/subscriptions/plans.ts

export const planConfigs = {
  trial: {
    id: "trial",
    name: "Trial",
    nameAmharic: "ሙከራ",
    priceMonthly: 0,
    priceYearly: 0,
    durationDays: 14,
    limits: {
      products: 10,
      ordersPerMonth: 50,
      aiMessagesPerMonth: 100,
      storageMB: 100,
    },
    features: ["basic_catalog", "ai_assistant", "order_management"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    nameAmharic: "ጀማሪ",
    priceMonthly: 500,
    priceYearly: 5000,
    limits: {
      products: 50,
      ordersPerMonth: 200,
      aiMessagesPerMonth: 500,
      storageMB: 500,
    },
    features: [
      "basic_catalog",
      "ai_assistant",
      "order_management",
      "basic_analytics",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    nameAmharic: "እድገት",
    priceMonthly: 1500,
    priceYearly: 15000,
    limits: {
      products: 200,
      ordersPerMonth: 1000,
      aiMessagesPerMonth: 2000,
      storageMB: 2000,
    },
    features: [
      "basic_catalog",
      "ai_assistant",
      "order_management",
      "advanced_analytics",
      "priority_support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    nameAmharic: "ፕሮ",
    priceMonthly: 3000,
    priceYearly: 30000,
    limits: {
      products: -1,
      ordersPerMonth: -1,
      aiMessagesPerMonth: 10000,
      storageMB: 10000,
    },
    features: ["all"],
  },
} as const;

export type PlanId = keyof typeof planConfigs;
```

---

## Mutation Patterns

### Ownership Verification

```typescript
async function verifyOwnership<T extends { sellerId: Id<"sellers"> }>(
  ctx: QueryCtx | MutationCtx,
  tableName: string,
  documentId: Id<unknown>,
  sellerId: Id<"sellers">,
): Promise<T> {
  const doc = await ctx.db.get(documentId);
  if (!doc) throw new Error(`${tableName} not found`);
  if ((doc as T).sellerId !== sellerId) {
    throw new Error(`Unauthorized: ${tableName} belongs to different seller`);
  }
  return doc as T;
}
```

### Standard Create Pattern

```typescript
export const createProduct = mutation({
  args: { sellerId: v.id("sellers") /* ... */ },
  handler: async (ctx, args) => {
    // 1. Verify seller
    const seller = await ctx.db.get(args.sellerId);
    if (!seller?.isActive) throw new Error("Invalid seller");

    // 2. Check subscription limits
    // 3. Validate attributes
    // 4. Create with timestamps
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

### Paginated Query Pattern

```typescript
export const getProductsPaginated = query({
  args: {
    sellerId: v.id("sellers"),
    cursor: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(args.limit || 20, 100);
    let query = ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId));

    if (args.cursor) {
      const cursorDoc = await ctx.db.get(args.cursor);
      if (cursorDoc) {
        query = query.filter((q) =>
          q.lt(q.field("_creationTime"), cursorDoc._creationTime),
        );
      }
    }

    const items = await query.order("desc").take(pageSize + 1);
    const hasMore = items.length > pageSize;

    return {
      items: hasMore ? items.slice(0, -1) : items,
      nextCursor: hasMore ? items[pageSize - 1]._id : null,
      hasMore,
    };
  },
});
```

---

## Security Checklist

- [ ] All mutations verify `sellerId` ownership
- [ ] All queries filter by `sellerId` first
- [ ] No `.collect()` without pagination on large tables
- [ ] All timestamps use `Date.now()`
- [ ] Price snapshots stored in order items
- [ ] Status changes logged in `statusHistory`
- [ ] Subscription limits checked before resource creation
- [ ] Errors logged to `eventLogs`

---

## Anti-Patterns

```typescript
// ❌ WRONG: Query without sellerId
const products = await ctx.db.query("products").collect();

// ❌ WRONG: No ownership verification
await ctx.db.patch(productId, { price: 100 });

// ❌ WRONG: Hardcoded business type logic in mutations
if (seller.businessType === "phone_seller") {
  /* ... */
}

// ❌ WRONG: collect() on large table
const orders = await ctx.db.query("orders").collect();

// ✅ CORRECT: Always filter by sellerId with index
const products = await ctx.db
  .query("products")
  .withIndex("by_sellerId", (q) => q.eq("sellerId", sellerId))
  .take(20);
```

---

## Event Log Categories

| Category       | Events                                                                          |
| -------------- | ------------------------------------------------------------------------------- |
| `order`        | order_created, order_confirmed, order_shipped, order_delivered, order_cancelled |
| `payment`      | payment_initiated, payment_success, payment_failed, refund_issued               |
| `ai`           | ai_response, ai_handoff, ai_escalation                                          |
| `system`       | product_created, product_updated, seller_activated                              |
| `auth`         | login_success, login_failed                                                     |
| `subscription` | plan_upgraded, plan_downgraded, usage_limit_reached                             |

---

## Index Reference

| Table         | Index                        | Use Case        |
| ------------- | ---------------------------- | --------------- |
| sellers       | by_telegramId                | Auth lookup     |
| products      | by_sellerId_status           | Active products |
| products      | by_sellerId_category_status  | Category filter |
| products      | search_products              | Product search  |
| customers     | by_sellerId_telegramId       | Customer auth   |
| orders        | by_sellerId_status_createdAt | Order dashboard |
| orders        | by_chapaTransactionRef       | Payment webhook |
| conversations | by_telegramChatId            | Chat lookup     |
| eventLogs     | by_sellerId_type             | Error dashboard |
