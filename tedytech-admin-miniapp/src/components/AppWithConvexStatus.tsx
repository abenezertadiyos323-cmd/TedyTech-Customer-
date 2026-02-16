import React, { useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexStatusBanner } from "./ConvexStatusBanner";
import { api } from "convex_generated/api";

type AppWithConvexStatusProps = {
  convexClient: ConvexReactClient;
  initialPingFailed: boolean;
  initialError: string;
  children: React.ReactNode;
};

/**
 * Wrapper component that manages Convex connectivity status.
 * Shows a non-blocking banner when Convex is unreachable and provides retry functionality.
 */
export const AppWithConvexStatus: React.FC<AppWithConvexStatusProps> = ({
  convexClient,
  initialPingFailed,
  initialError,
  children,
}) => {
  const [showBanner, setShowBanner] = useState(initialPingFailed);
  const [error, setError] = useState(initialError);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await convexClient.query(api.health.ping, {});
      if (result && result.status === "ok") {
        setShowBanner(false);
        setError("");
        console.log("[AdminApp] Convex health check succeeded after retry");
      } else {
        setError("Health check returned invalid response");
        console.error("[AdminApp] Convex health check failed after retry: invalid response");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("[AdminApp] Convex health check failed after retry:", errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <>
      {showBanner && (
        <ConvexStatusBanner
          error={error}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      )}
      {children}
    </>
  );
};
