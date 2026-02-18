import React from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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

function CrashScreen({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background px-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">App crashed</h1>
        <p className="mt-2 text-sm text-muted-foreground break-words">
          {message}
        </p>
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
    onCrash: (message: string) => void;
    children: React.ReactNode;
  },
  { hasError: boolean; message: string }
> {
  constructor(props: { onCrash: (message: string) => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: toCrashMessage(error) };
  }

  componentDidCatch(error: unknown) {
    this.props.onCrash(toCrashMessage(error));
  }

  render() {
    if (this.state.hasError) {
      return (
        <CrashScreen
          message={this.state.message}
          onReload={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

function RootApp() {
  const [crashMessage, setCrashMessage] = React.useState<string | null>(null);

  const reportCrash = React.useCallback((error: unknown) => {
    const message = toCrashMessage(error);
    setCrashMessage((previous) => previous ?? message);
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

  if (crashMessage) {
    return (
      <CrashScreen
        message={crashMessage}
        onReload={() => window.location.reload()}
      />
    );
  }

  return (
    <AppErrorBoundary onCrash={(message) => reportCrash(message)}>
      <App />
    </AppErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <RootApp />
  </ConvexProvider>,
);
