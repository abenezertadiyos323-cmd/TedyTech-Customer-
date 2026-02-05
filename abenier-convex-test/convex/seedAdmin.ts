import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed initial admin seller account
 *
 * Usage:
 * npx convex run seedAdmin:seedInitialAdmin '{"telegramId":"YOUR_ID","username":"YOUR_USERNAME","firstName":"YOUR_NAME"}'
 */
export const seedInitialAdmin = mutation({
  args: {
    telegramId: v.string(),
    username: v.string(),
    firstName: v.string(),
  },
  handler: async (ctx, args) => {
    const { telegramId, username, firstName } = args;

    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("sellers")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", telegramId))
      .first();

    if (existingAdmin) {
      throw new Error(
        `Admin with Telegram ID ${telegramId} already exists (ID: ${existingAdmin._id})`
      );
    }

    // Create the admin seller
    const now = Date.now();
    const adminId = await ctx.db.insert("sellers", {
      // Identity
      telegramId,
      username,
      firstName,

      // Business Profile
      businessName: `${firstName}'s Business`,
      businessType: "general",

      // Settings
      currency: "ETB",
      language: "en",
      isActive: true,

      // Role & Verification
      role: "admin",
      isVerified: true,

      // Timestamps
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      adminId,
      message: `Admin seller created successfully for ${firstName} (${username})`,
    };
  },
});
