import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSearchPanelData = query({
  args: {
    limit: v.optional(v.number()),
    topDays: v.optional(v.number()),
    trendingHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 8;
    const topDays = args.topDays ?? 30;
    const trendingHours = args.trendingHours ?? 48;

    const now = Date.now();
    const topSince = now - topDays * 24 * 60 * 60 * 1000;
    const trendingSince = now - trendingHours * 60 * 60 * 1000;

    const all = await ctx.db.query("searches").collect();

    // Aggregate counts per term
    const counts: Record<
      string,
      { term: string; count: number; lastSeen: number }
    > = {};
    for (const s of all) {
      const term = (s.term || "").trim().toLowerCase();
      if (!term) continue;
      const created = s.createdAt || 0;
      const existing = counts[term];
      if (!existing) counts[term] = { term, count: 1, lastSeen: created };
      else {
        existing.count += 1;
        if (created > existing.lastSeen) existing.lastSeen = created;
      }
    }

    const terms = Object.values(counts);

    // top_searches within topSince
    const top_searches = terms
      .filter((t) => t.lastSeen >= topSince)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((t) => ({ term: t.term, count: t.count }));

    // trending_searches within trendingSince (sorted by lastSeen then count)
    const trending_searches = terms
      .filter((t) => t.lastSeen >= trendingSince)
      .sort((a, b) => b.lastSeen - a.lastSeen || b.count - a.count)
      .slice(0, limit)
      .map((t) => ({ term: t.term, count: t.count }));

    // hot_searches: top short list with labels (use term title-cased)
    const hot_searches = top_searches.slice(0, limit).map((t) => ({
      term: t.term,
      label: t.term
        .split(" ")
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" "),
    }));

    return { hot_searches, top_searches, trending_searches };
  },
});

export const logSearch = mutation({
  args: {
    userId: v.optional(v.string()),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.term.trim();
    if (!trimmed) return { success: false };
    await ctx.db.insert("searches", {
      userId: args.userId ?? null,
      term: trimmed.toLowerCase(),
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const searchProducts = query({
  args: {
    term: v.optional(v.string()),
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const term = (args.term || "").trim();
    const limit = args.limit ?? 24;

    // Use Convex Search Index for ranking and relevance
    const q = ctx.db
      .query("products")
      .withSearchIndex("search_products", (s) => {
        if (term) s.search("name", term);
        if (args.category) s.eq("category", args.category);
        if (args.status) s.eq("status", args.status);
        else s.eq("status", "active");
        return s;
      });

    const results = await q.limit(limit).collect();

    return results.map((p: any) => ({
      id: p._id,
      name: p.name,
      description: p.description ?? null,
      price: p.price,
      currency: p.currency,
      images: p.images ?? [],
      category: p.category ?? null,
      tags: p.tags ?? [],
      status: p.status,
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      isPopular: !!p.isPopular,
      createdAt: p.createdAt,
    }));
  },
});
