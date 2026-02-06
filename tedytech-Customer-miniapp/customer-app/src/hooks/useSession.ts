import { useState, useEffect } from "react";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const SESSION_KEY = "tedytech_session_id";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mutation = useConvexMutation(api.sessions.createSession);

  useEffect(() => {
    async function initSession() {
      // Check localStorage first
      let storedSessionId = localStorage.getItem(SESSION_KEY);

      if (storedSessionId) {
        setSessionId(storedSessionId);
        setIsLoading(false);
        return;
      }

      // Create new session via Convex mutation
      try {
        const id = await mutation.mutate();
        storedSessionId = id as string;
        localStorage.setItem(SESSION_KEY, storedSessionId);
        setSessionId(storedSessionId);
      } catch (err) {
        console.error("Session creation error:", err);
        // Fallback
        storedSessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, storedSessionId);
        setSessionId(storedSessionId);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  return { sessionId, isLoading };
}
