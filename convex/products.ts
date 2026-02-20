import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";
import { createActivityLog } from "./lib/activityLog";

const productStatusValidator = v.union(
  v.literal("active"),
  v.literal("draft"),
  v.literal("archived"),
);

const normalizeStatus = (status: unknown): "active" | "draft" | "archived" => {
  if (status === "active" || status === "draft" || status === "archived") {
    return status;
  }
  return "draft";
};

const normalizeAdminProduct = (product: any) => ({
  ...product,
  description: product.description ?? "",
  images: Array.isArray(product.images) ? product.images : [],
  category: product.category ?? undefined,
  tags: Array.isArray(product.tags) ? product.tags : [],
  status: normalizeStatus(product.status),
  isFeatured: Boolean(product.isFeatured),
  isNewArrival: Boolean(product.isNewArrival),
  isPopular: Boolean(product.isPopular),
  inStock: product.inStock ?? true,
});

// Public query used by the customer mini app.
export const listAllProducts = query({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Admin query for inventory management.
export const listAdminProducts = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const products = await ctx.db.query("products").order("desc").collect();
    return products.map(normalizeAdminProduct);
  },
});

export const createProductAdmin = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(productStatusValidator),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const name = args.name.trim();
    if (!name) {
      throw new Error("Product name is required.");
    }
    if (args.price < 0) {
      throw new Error("Price must be 0 or greater.");
    }

    const imageUrl = args.imageUrl?.trim();
    const now = Date.now();

    return await ctx.db.insert("products", {
      name,
      description: args.description?.trim() || undefined,
      price: args.price,
      currency: "ETB",
      images: imageUrl ? [imageUrl] : [],
      category: args.category?.trim() || undefined,
      tags: [],
      status: args.status ?? "active",
      isFeatured: false,
      isNewArrival: false,
      isPopular: false,
      inStock: args.inStock ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProductAdmin = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(productStatusValidator),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const trimmedName = args.name.trim();
      if (!trimmedName) {
        throw new Error("Product name is required.");
      }
      updates.name = trimmedName;
    }
    if (args.description !== undefined) {
      updates.description = args.description.trim() || undefined;
    }
    if (args.price !== undefined) {
      if (args.price < 0) {
        throw new Error("Price must be 0 or greater.");
      }
      updates.price = args.price;
    }
    if (args.category !== undefined) {
      updates.category = args.category.trim() || undefined;
    }
    if (args.imageUrl !== undefined) {
      const trimmedImageUrl = args.imageUrl.trim();
      updates.images = trimmedImageUrl ? [trimmedImageUrl] : [];
    }
    if (args.status !== undefined) {
      updates.status = args.status;
    }
    if (args.inStock !== undefined) {
      updates.inStock = args.inStock;
    }

    await ctx.db.patch(args.productId, updates);

    const changedFields = Object.keys(updates).filter(
      (field) => field !== "updatedAt",
    );
    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "product",
      entityId: String(args.productId),
      action: "edit_product",
      summary: `Edited product ${product.name}`,
      metadata: { changedFields },
    });

    return args.productId;
  },
});

export const toggleProductAvailability = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const currentStatus = normalizeStatus(product.status);
    const nextStatus = currentStatus === "active" ? "archived" : "active";

    await ctx.db.patch(args.productId, {
      status: nextStatus,
      updatedAt: Date.now(),
    });

    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "product",
      entityId: String(args.productId),
      action: "toggle_availability",
      summary: `Product availability ${currentStatus} -> ${nextStatus}`,
      metadata: {
        previousStatus: currentStatus,
        nextStatus,
      },
    });

    return nextStatus;
  },
});

export const toggleProductInStock = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    const nextInStock = !(product.inStock ?? true);

    await ctx.db.patch(args.productId, {
      inStock: nextInStock,
      updatedAt: Date.now(),
    });

    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "product",
      entityId: String(args.productId),
      action: "toggle_in_stock",
      summary: `Product inStock ${(product.inStock ?? true) ? "true" : "false"} -> ${nextInStock ? "true" : "false"}`,
      metadata: {
        previousInStock: product.inStock ?? true,
        nextInStock,
      },
    });

    return nextInStock;
  },
});
