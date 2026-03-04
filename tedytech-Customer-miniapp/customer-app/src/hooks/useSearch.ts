import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
} from "convex/react";
import { api } from "@/convex_generated/api";

interface SearchPanelData {
  hot_searches: { term: string; label: string }[];
  top_searches: { term: string; count: number }[];
  trending_searches: { term: string; count: number }[];
}

export function useSearchPanelData() {
  const data = useConvexQuery(api.search.getSearchPanelData, {
    limit: 8,
    topDays: 30,
    trendingHours: 48,
  } as any);
  return {
    data: (data ?? undefined) as SearchPanelData | undefined,
    isLoading: data === undefined,
    error: null,
  };
}

export function useLogSearch(sessionId: string | null) {
  const mutation = useConvexMutation(api.search.logSearch);

  return {
    mutate: async (term: string) => {
      if (!sessionId || !term.trim()) return;

      try {
        await mutation({ userId: sessionId, term: term.trim() });
      } catch (e) {
        console.error("Failed to log search", e);
      }
    },
  };
}

export interface SearchProductResult {
  _id: string;
  phoneType?: string | null;
  brand?: string | null;
  model?: string | null;
  storage?: number | null;
  condition?: string | null;
  price: number;
  images?: string[];
  mainImageUrl?: string | null;
  exchange_available?: boolean | null;
}

export function useSearchProducts(
  term: string | null,
  opts?: { limit?: number },
) {
  const args = {
    term: term ?? undefined,
    limit: opts?.limit ?? 8,
  } as any;

  const data = useConvexQuery(api.search.searchProducts, args);
  return {
    data: (data ?? undefined) as SearchProductResult[] | undefined,
    isLoading: data === undefined,
    error: null,
  };
}
