import React from "react";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";

type ConvexStatusBannerProps = {
  isLoading: boolean;
  isOk: boolean;
};

export const ConvexStatusBanner: React.FC<ConvexStatusBannerProps> = ({
  isLoading,
  isOk,
}) => {
  if (isOk) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(to right, #16a34a, #15803d)",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <CheckCircle size={16} />
        Convex OK
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(to right, #d97706, #b45309)",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
        Connecting to Convex...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not loading and not OK — health query returned an unexpected value
  const convexUrl = import.meta.env.VITE_CONVEX_URL || "not set";
  const hostname = convexUrl.replace("https://", "").replace("http://", "");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(to right, #dc2626, #b91c1c)",
        color: "#fff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <AlertTriangle size={20} />
      <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
        <strong>Convex Unreachable</strong>
        <br />
        <span style={{ opacity: 0.85, fontSize: "11px" }}>
          hostname: {hostname || "not set"} — check VITE_CONVEX_URL in Vercel
        </span>
      </div>
    </div>
  );
};
