import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import "./index.css";

// ---------------------------------------------------------------------------
// Environment validation — Vite bakes these at build time.
// If VITE_CONVEX_URL is missing the production build will be broken.
// ---------------------------------------------------------------------------
const _convexUrl = (import.meta.env.VITE_CONVEX_URL ?? "") as string;

/** Show error ONLY when ?debug=1 or VITE_APP_ENVIRONMENT=dev */
const _isDebugMode =
  new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  ).get("debug") === "1" ||
  (import.meta.env.VITE_APP_ENVIRONMENT as string | undefined) === "dev";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeCrashMessage(raw: string) {
  return raw
    .replace(/initData=[^&\s]+/gi, "initData=[redacted]")
    .replace(/\b\d{8,}:[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]")
    .replace(/(token=)[^&\s]+/gi, "$1[redacted]");
}

function toCrashMessage(error: unknown) {
  if (error instanceof Error) return sanitizeCrashMessage(error.message);
  if (typeof error === "string") return sanitizeCrashMessage(error);
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return sanitizeCrashMessage((error as { message: string }).message);
  }
  return "Unknown runtime error";
}

function toCrashDetails(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? "(no stack)"}`;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

/** Render a plain-HTML error before React mounts (e.g. missing env var). */
function renderStaticError(title: string, message: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#0a0a0a;font-family:system-ui,sans-serif">
      <div style="width:100%;max-width:24rem;border:1px solid #333;border-radius:1rem;background:#111;padding:1.5rem;text-align:center;color:#fff">
        <h1 style="font-size:1.1rem;font-weight:600;margin:0 0 .5rem 0">${title}</h1>
        <p style="font-size:.875rem;color:#888;margin:0">${message}</p>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// React components
// ---------------------------------------------------------------------------

function CrashScreen({
  message,
  details,
  onReload,
}: {
  message: string;
  details?: string | null;
  onReload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background px-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">App crashed</h1>
        <p className="mt-2 text-sm text-muted-foreground break-words">
          {message}
        </p>
        {_isDebugMode && details ? (
          <pre className="mt-3 text-left text-xs bg-muted/60 rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
            {details}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={onReload}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  {
    onCrash: (error: unknown) => void;
    children: React.ReactNode;
  },
  { hasError: boolean; message: string; details: string }
> {
  constructor(props: {
    onCrash: (error: unknown) => void;
    children: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false, message: "", details: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: toCrashMessage(error),
      details: toCrashDetails(error),
    };
  }

  componentDidCatch(error: unknown) {
    this.props.onCrash(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <CrashScreen
          message={this.state.message}
          details={this.state.details}
          onReload={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

function RootApp() {
  const [crashInfo, setCrashInfo] = React.useState<{
    message: string;
    details: string;
  } | null>(null);

  const reportCrash = React.useCallback((error: unknown) => {
    const message = toCrashMessage(error);
    const details = toCrashDetails(error);
    setCrashInfo((previous) => previous ?? { message, details });
  }, []);

  React.useEffect(() => {
    const previousOnError = window.onerror;
    const previousOnUnhandledRejection = window.onunhandledrejection;

    window.onerror = (message, source, lineno, colno, error) => {
      reportCrash(error ?? message);
      if (typeof previousOnError === "function") {
        return previousOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    window.onunhandledrejection = (event) => {
      reportCrash(event.reason);
      if (typeof previousOnUnhandledRejection === "function") {
        return previousOnUnhandledRejection.call(window, event);
      }
      return;
    };

    return () => {
      window.onerror = previousOnError ?? null;
      window.onunhandledrejection = previousOnUnhandledRejection ?? null;
    };
  }, [reportCrash]);

  if (crashInfo) {
    return (
      <CrashScreen
        message={crashInfo.message}
        details={crashInfo.details}
        onReload={() => window.location.reload()}
      />
    );
  }

  return (
    <AppErrorBoundary onCrash={(error) => reportCrash(error)}>
      <App />
    </AppErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Bootstrap — validate env, create client, mount React
// ---------------------------------------------------------------------------

function startApp() {
  // Guard: VITE_CONVEX_URL must be a valid https URL baked in at build time.
  if (!_convexUrl || !_convexUrl.startsWith("https://")) {
    renderStaticError(
      "Configuration Error",
      "Missing or invalid VITE_CONVEX_URL in Vercel environment variables. " +
        "Set VITE_CONVEX_URL to your Convex deployment URL (e.g. https://xxx.convex.cloud) and redeploy.",
    );
    return;
  }

  let convex: ConvexReactClient;
  try {
    convex = new ConvexReactClient(_convexUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    renderStaticError("Convex Initialization Error", msg);
    return;
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  createRoot(rootEl).render(
    <ConvexProvider client={convex}>
      <RootApp />
    </ConvexProvider>,
  );
}

startApp();
