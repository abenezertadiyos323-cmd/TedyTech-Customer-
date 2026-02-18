import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
} from "convex/react";
import { api } from "@/convex_generated/api";
import type { Phone } from "@/types/phone";
import { toast } from "@/hooks/use-toast";
import { phones as localPhones } from "@/data/products";
import { useEffect, useState } from "react";

// Simple in-memory coordination for optimistic updates between hooks
const favoritesSubscribers = new Map<
  string,
  React.Dispatch<React.SetStateAction<any[]>>
>();
const latestFavorites = new Map<string, any[]>();

export function useFavorites(sessionId: string | null) {
  const convexData = useConvexQuery(
    api.favorites.getFavorites,
    sessionId ? { userId: sessionId } : "skip",
  );

  const data = (convexData ?? []) as Array<{
    phoneId: string;
    userId: string;
    createdAt: number;
  }>;

  // Local state to support optimistic updates
  const [localFavorites, setLocalFavorites] = useState<any[]>([]);

  // Map incoming convex data -> legacy favorite shape
  const mapped = data.map((f) => {
    const local = localPhones.find((p) => p.id === f.phoneId);
    if (local) {
      return {
        phone_id: local.id,
        brand: local.brand,
        model: local.name,
        storage_gb: parseInt(local.storage, 10) || null,
        price_birr: local.price,
        condition: (local.condition || "").toLowerCase() || null,
        main_image_url: local.images?.[0] || null,
        exchange_available: !!local.exchangeAvailable,
        created_at: new Date(f.createdAt).toISOString(),
      };
    }
    return {
      phone_id: f.phoneId,
      brand: null,
      model: null,
      storage_gb: null,
      price_birr: null,
      condition: null,
      main_image_url: null,
      exchange_available: false,
      created_at: new Date(f.createdAt).toISOString(),
    };
  });

  // Keep a synchronized local copy; convex data wins when it changes.
  useEffect(() => {
    setLocalFavorites(mapped);
    if (sessionId) latestFavorites.set(sessionId, mapped);
  }, [sessionId, JSON.stringify(mapped)]);

  // Register subscriber so add/remove hooks can update optimistically
  useEffect(() => {
    if (!sessionId) return;
    favoritesSubscribers.set(sessionId, setLocalFavorites);
    return () => {
      favoritesSubscribers.delete(sessionId);
      latestFavorites.delete(sessionId);
    };
  }, [sessionId]);

  // Expose compatible shape
  return {
    data: localFavorites,
    isLoading: !!sessionId && convexData === undefined,
    error: null,
  };
}

export function useAddFavorite(sessionId: string | null) {
  const mutation = useConvexMutation(api.favorites.addFavorite);

  return {
    mutate: async (phoneId: string) => {
      if (!sessionId) throw new Error("No session");

      const setter = favoritesSubscribers.get(sessionId);
      const prev = latestFavorites.get(sessionId) ?? [];

      // Construct optimistic favorite entry (minimal)
      const nowIso = new Date().toISOString();
      const optimistic = {
        phone_id: phoneId,
        brand: null,
        model: null,
        storage_gb: null,
        price_birr: null,
        condition: null,
        main_image_url: null,
        exchange_available: false,
        created_at: nowIso,
      };

      try {
        // apply optimistic update
        if (setter) {
          setter((s) => {
            const existing = s.find((f: any) => f.phone_id === phoneId);
            if (existing) return s;
            const next = [optimistic, ...s];
            latestFavorites.set(sessionId, next);
            return next;
          });
        }

        await mutation.mutate({ userId: sessionId, phoneId });
      } catch (e) {
        // revert on error
        if (setter) {
          setter(() => prev);
          latestFavorites.set(sessionId, prev);
        }
        console.error("Failed to add favorite:", e);
        toast({
          title: "Error",
          description: "Failed to save phone",
          variant: "destructive",
        });
        throw e;
      }
    },
  };
}

export function useRemoveFavorite(sessionId: string | null) {
  const mutation = useConvexMutation(api.favorites.removeFavorite);

  return {
    mutate: async (phoneId: string) => {
      if (!sessionId) throw new Error("No session");

      const setter = favoritesSubscribers.get(sessionId);
      const prev = latestFavorites.get(sessionId) ?? [];

      try {
        // optimistic remove
        if (setter) {
          setter((s) => {
            const next = s.filter((f: any) => f.phone_id !== phoneId);
            latestFavorites.set(sessionId, next);
            return next;
          });
        }

        await mutation.mutate({ userId: sessionId, phoneId });
      } catch (e) {
        // revert
        if (setter) {
          setter(() => prev);
          latestFavorites.set(sessionId, prev);
        }
        console.error("Failed to remove favorite:", e);
        toast({
          title: "Error",
          description: "Failed to remove phone from saved",
          variant: "destructive",
        });
        throw e;
      }
    },
  };
}

// Convert favorite data to Phone type for compatibility
export function favoriteToPhone(fav: {
  phone_id: string;
  brand: string;
  model: string;
  storage_gb: number;
  price_birr: number;
  condition: string;
  main_image_url: string;
  exchange_available: boolean;
  created_at: string;
}): Phone {
  return {
    id: fav.phone_id,
    brand: fav.brand,
    model: fav.model,
    storage_gb: fav.storage_gb,
    price_birr: fav.price_birr,
    old_price_birr: null,
    condition: fav.condition,
    main_image_url: fav.main_image_url,
    description: null,
    color: null,
    in_stock: true,
    stock_count: null,
    is_new_arrival: false,
    is_popular: false,
    is_premium: false,
    is_accessory: false,
    exchange_available: fav.exchange_available,
    negotiable: null,
    key_highlights: null,
    key_specs: null,
    created_at: fav.created_at,
    updated_at: null,
  };
}
