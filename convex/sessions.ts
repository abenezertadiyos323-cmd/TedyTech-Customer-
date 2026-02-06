import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSession = mutation({
  handler: async (ctx) => {
    const id = await ctx.db.insert("sessions", {
      createdAt: Date.now(),
    });
    return id;
  },
});
