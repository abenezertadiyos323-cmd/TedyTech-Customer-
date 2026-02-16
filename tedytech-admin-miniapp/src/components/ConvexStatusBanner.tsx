import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ConvexStatusBannerProps = {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
};

export const ConvexStatusBanner: React.FC<ConvexStatusBannerProps> = ({
  error,
  onRetry,
  isRetrying,
}) => {
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
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
        <AlertTriangle size={20} />
        <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
          <strong>Convex Unreachable</strong>
          <br />
          <span style={{ opacity: 0.9, fontSize: "12px" }}>{error}</span>
        </div>
      </div>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: isRetrying ? "not-allowed" : "pointer",
          opacity: isRetrying ? 0.6 : 1,
          transition: "all 0.2s",
        }}
      >
        <RefreshCw size={14} style={{ animation: isRetrying ? "spin 1s linear infinite" : "none" }} />
        {isRetrying ? "Retrying..." : "Retry"}
      </button>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
