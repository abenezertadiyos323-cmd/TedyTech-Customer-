import { useState } from "react";
import {
  useConvex,
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import { api } from "@/convex_generated/api";
import { storeConfig } from "@/config/storeConfig";
import { toast } from "@/hooks/use-toast";

export type LeadActionType = "inquiry" | "exchange" | "call" | "map";
export type LeadSourceTab =
  | "home"
  | "search"
  | "saved"
  | "product_detail"
  | "about";

interface CreateActionParams {
  actionType: LeadActionType;
  sourceTab: LeadSourceTab;
  sourceProductId?: string | null;
  timestamp?: number;
  showErrorToast?: boolean;
}

export type TelegramStartActionType = "buy" | "ask" | "photo" | "exchange";

interface TelegramStartLinkParams {
  actionType: TelegramStartActionType;
  productId?: string | null;
  productLabel?: string | null;
  exchangeRequestId?: string | null;
}

const toStartSlug = (value: string, maxLength = 48): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength);

const buildLocalStartPayload = ({
  actionType,
  productLabel,
  exchangeRequestId,
}: TelegramStartLinkParams): string => {
  if (exchangeRequestId) return `lead_${exchangeRequestId}`;
  if (productLabel?.trim()) return `${actionType}_${toStartSlug(productLabel)}`;
  if (actionType === "exchange") return "exchange";
  return "start";
};

const buildTelegramBotLink = (payload: string): string =>
  `https://t.me/${storeConfig.botUsername}?start=${payload}`;

export function openTelegramDeepLink(url: string) {
  const tg = (
    window as {
      Telegram?: {
        WebApp?: {
          openTelegramLink?: (value: string) => void;
          openLink?: (value: string) => void;
        };
      };
    }
  ).Telegram?.WebApp;

  if (tg?.openTelegramLink && /^https:\/\/t\.me\//i.test(url)) {
    tg.openTelegramLink(url);
    return;
  }

  if (tg?.openLink) {
    tg.openLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function useCreatePhoneAction(sessionId: string | null) {
  const mutation = useConvexMutation(api.phoneActions.createPhoneActionRequest);
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async ({
      actionType,
      sourceTab,
      sourceProductId,
      timestamp,
      showErrorToast = true,
    }: CreateActionParams) => {
      if (!sessionId) throw new Error("No session");

      setIsPending(true);
      try {
        const id = await mutation({
          sessionId,
          actionType,
          sourceTab,
          sourceProductId: sourceProductId ?? undefined,
          timestamp: timestamp ?? Date.now(),
        });
        return id;
      } catch (e) {
        console.error("Failed to create action:", e);
        if (showErrorToast) {
          toast({
            title: "Error",
            description: "Failed to submit request. Please try again.",
            variant: "destructive",
          });
        }
        throw e;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useTelegramStartLinkBuilder() {
  const convex = useConvex();

  const buildStartLink = async (params: TelegramStartLinkParams) => {
    const fallbackLink = buildTelegramBotLink(buildLocalStartPayload(params));

    try {
      const queryRef = (api.phoneActions as any).getTelegramStartLink;
      if (!queryRef) return fallbackLink;

      const result = await convex.query(queryRef, {
        actionType: params.actionType,
        productId: params.productId ?? undefined,
        exchangeRequestId: params.exchangeRequestId ?? undefined,
      });

      if (result?.deepLink) {
        return String(result.deepLink);
      }
    } catch (error) {
      console.warn(
        "[TedyTech] Failed to build Telegram start link from Convex, using local fallback.",
        error,
      );
    }

    return fallbackLink;
  };

  const openStartLink = async (params: TelegramStartLinkParams) => {
    const url = await buildStartLink(params);
    openTelegramDeepLink(url);
    return url;
  };

  return {
    buildStartLink,
    openStartLink,
  };
}

interface CreateExchangeParams {
  desiredPhoneId: string;
  offeredModel: string;
  offeredStorageGb: number;
  offeredCondition: string;
  offeredNotes: string;
}

export function useCreateExchangeRequest(sessionId: string | null) {
  const mutation = useConvexMutation(
    api.phoneActions.createExchangeRequestMiniapp,
  );
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async (params: CreateExchangeParams) => {
      if (!sessionId) throw new Error("No session");

      setIsPending(true);
      try {
        const id = await mutation({
          sessionId,
          desiredPhoneId: params.desiredPhoneId,
          offeredModel: params.offeredModel,
          offeredStorageGb: params.offeredStorageGb,
          offeredCondition: params.offeredCondition.toLowerCase(),
          offeredNotes: params.offeredNotes,
        });
        toast({
          title: "Exchange Request Submitted!",
          description: "Our team will contact you on Telegram with an offer.",
        });
        return id;
      } catch (e) {
        console.error("Failed to create exchange request:", e);
        toast({
          title: "Error",
          description: "Failed to submit exchange request. Please try again.",
          variant: "destructive",
        });
        throw e;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useExchangeRequests(sessionId: string | null) {
  const data = useConvexQuery(
    api.phoneActions.getExchangeRequestsV2,
    sessionId ? { sessionId } : "skip",
  );
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
}

export function useExchangeDetail(
  requestId: string | null,
  sessionId: string | null,
) {
  const data = useConvexQuery(
    api.phoneActions.getExchangeDetailV2,
    requestId && sessionId ? { requestId, sessionId } : "skip",
  );
  return {
    data: data ?? null,
    isLoading: data === undefined,
    error: null,
  };
}
