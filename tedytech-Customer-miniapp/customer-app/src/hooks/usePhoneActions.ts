import {
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import { api } from "convex_generated/api";
import { toast } from "@/hooks/use-toast";

interface CreateActionParams {
  phoneId: string;
  variantId?: string | null;
  actionType: "reserve" | "ask";
}

export function useCreatePhoneAction(sessionId: string | null) {
  const mutation = useConvexMutation(api.phoneActions.createPhoneActionRequest);

  return {
    mutate: async ({ phoneId, variantId, actionType }: CreateActionParams) => {
      if (!sessionId) throw new Error("No session");

      try {
        const id = await mutation.mutate({
          sessionId,
          phoneId,
          variantId: variantId ?? null,
          actionType,
        });
        const message =
          actionType === "reserve"
            ? "Deposit request submitted! Our team will contact you on Telegram."
            : "Question sent! Our team will respond on Telegram.";
        toast({ title: "Request Sent!", description: message });
        return id;
      } catch (e) {
        console.error("Failed to create action:", e);
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again.",
          variant: "destructive",
        });
        throw e;
      }
    },
  };
}

interface CreateExchangeParams {
  desiredPhoneId: string;
  offeredModel: string;
  offeredStorageGb: number;
  offeredCondition: string; // Will be stored lowercase
  offeredNotes: string;
}

export function useCreateExchangeRequest(sessionId: string | null) {
  const mutation = useConvexMutation(
    api.phoneActions.createExchangeRequestMiniapp,
  );

  return {
    mutate: async (params: CreateExchangeParams) => {
      if (!sessionId) throw new Error("No session");

      try {
        const id = await mutation.mutate({
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
      }
    },
  };
}

// Fetch exchange requests for session
export function useExchangeRequests(sessionId: string | null) {
  const data = useConvexQuery(
    api.phoneActions.getExchangeRequestsV2,
    sessionId ? { sessionId } : (undefined as any),
  );
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
}

// Fetch single exchange detail (secure with session ownership)
export function useExchangeDetail(
  requestId: string | null,
  sessionId: string | null,
) {
  const data = useConvexQuery(
    api.phoneActions.getExchangeDetailV2,
    requestId && sessionId ? { requestId, sessionId } : (undefined as any),
  );
  return {
    data: data ?? null,
    isLoading: data === undefined,
    error: null,
  };
}
