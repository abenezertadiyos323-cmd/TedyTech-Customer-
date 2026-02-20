import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { ConvexStatusBanner } from "./ConvexStatusBanner";

type AppWithConvexStatusProps = {
  children: React.ReactNode;
};

/**
 * Wrapper component that checks Convex connectivity via useQuery.
 * Shows a non-blocking banner while connecting or when Convex is unreachable.
 */
export const AppWithConvexStatus: React.FC<AppWithConvexStatusProps> = ({
  children,
}) => {
  const healthResult = useQuery(api.health.health);
  const isLoading = healthResult === undefined;
  const isOk = healthResult?.status === "ok";

  return (
    <>
      <ConvexStatusBanner isLoading={isLoading} isOk={isOk} />
      {children}
    </>
  );
};
