import { query } from "./_generated/server";

/**
 * Simple health check query - returns true if Convex is reachable.
 * Used by the admin app to verify connectivity without blocking startup.
 */
export const ping = query({
  handler: async () => {
    return { status: "ok", timestamp: Date.now() };
  },
});

/**
 * Named health query used by useQuery(api.health.health) in the admin app.
 */
export const health = query({
  handler: async () => {
    return { status: "ok" };
  },
});
