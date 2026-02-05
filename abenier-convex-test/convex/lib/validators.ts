import { v } from "convex/values";

/**
 * Reusable validators for Convex schema and functions
 */

export const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const productAttributeValidator = v.object({
  key: v.string(),
  value: v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.null()
  ),
  displayValue: v.optional(v.string()),
});

export const productAttributeArrayValidator = v.array(productAttributeValidator);
