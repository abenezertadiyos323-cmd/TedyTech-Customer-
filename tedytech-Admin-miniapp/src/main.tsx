import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "sonner";
import { KonstaProvider } from "konsta/react";
import App from "./App";
import "./index.css";

type RenderErrorDetails = {
  message: string;
  stack?: string;
};

const ensureRootElement = () => {
  let root = document.getElementById("root");
  if (!root) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  }
  return root;
};

const renderStartupMessage = (
  title: string,
  message: string,
  details?: RenderErrorDetails,
) => {
  const mount = ensureRootElement();
  createRoot(mount).render(
    <React.StrictMode>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 space-y-3 text-center shadow-sm">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          {details?.message ? (
            <pre className="text-xs text-left bg-muted/40 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
              {details.stack ? `${details.message}\n\n${details.stack}` : details.message}
            </pre>
          ) : null}
        </div>
      </div>
    </React.StrictMode>,
  );
};

const formatError = (error: unknown): RenderErrorDetails => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
};

console.log("DEBUG: Convex URL is", import.meta.env.VITE_CONVEX_URL);
console.log("[AdminApp] Bootstrap start", {
  timestamp: new Date().toISOString(),
  mode: import.meta.env.MODE,
});
console.log(
  "[AdminApp] Telegram WebApp available at bootstrap:",
  Boolean((window as any).Telegram?.WebApp),
);

const bootstrap = () => {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    console.error("[AdminApp] Missing VITE_CONVEX_URL. App cannot connect to Convex.");
    renderStartupMessage(
      "Configuration Missing",
      "VITE_CONVEX_URL is not configured. Add it to your environment variables and rebuild the app.",
    );
    return;
  }

  console.log("[AdminApp] VITE_CONVEX_URL detected. Creating Convex client.", {
    convexUrl,
  });

  const convex = new ConvexReactClient(convexUrl);

  createRoot(ensureRootElement()).render(
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <KonstaProvider theme="ios">
          <AdminProvider>
            <App />
            <Toaster position="top-center" />
          </AdminProvider>
        </KonstaProvider>
      </ConvexProvider>
    </React.StrictMode>,
  );
};

try {
  bootstrap();
} catch (error) {
  console.error("[AdminApp] Fatal bootstrap error", error);
  renderStartupMessage(
    "Startup Failed",
    "The app crashed before first render. See details below.",
    formatError(error),
  );
}