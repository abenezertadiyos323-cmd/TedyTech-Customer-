import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "sonner";
import { KonstaProvider } from "konsta/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initGlobalErrorHandlers } from "@/lib/errorHandler";
import { getConvexHostname, validateEnv } from "@/lib/envValidation";
import {
  ADMIN_QUERY_DEBUG_EVENT,
  type QueryDebugDetail,
} from "@/lib/queryDebug";
import { AppWithConvexStatus } from "@/components/AppWithConvexStatus";
import App from "./App";
import "./index.css";

declare const __ADMIN_BUILD_TIME__: string;

type RenderErrorDetails = {
  message: string;
  stack?: string;
};

type ConvexPingStatus = "pending" | "ok" | "failed";

type StartupDiagnostics = {
  buildTime: string;
  mode: string;
  prod: boolean;
  appEnvironment: string;
  convexUrlExists: boolean;
  convexHostname: string;
  telegramWebAppExists: boolean;
  adminTokenPresent: "true" | "false" | "unknown";
  queryArgsType: "object" | "string" | "unknown";
  querySource: string;
  convexPingStatus: ConvexPingStatus;
  convexPingError: string;
  errors: string[];
};

const APP_LOG_PREFIX = "[AdminApp]";
const DIAGNOSTICS_OVERLAY_ID = "admin-app-startup-diagnostics";

const getBuildTime = (): string => {
  return typeof __ADMIN_BUILD_TIME__ === "string"
    ? __ADMIN_BUILD_TIME__
    : "unknown";
};

const getEnvString = (value: string | undefined): string => (value ?? "").trim();

const diagnostics: StartupDiagnostics = {
  buildTime: getBuildTime(),
  mode: import.meta.env.MODE,
  prod: Boolean(import.meta.env.PROD),
  appEnvironment: getEnvString(import.meta.env.VITE_APP_ENVIRONMENT),
  convexUrlExists: Boolean(getEnvString(import.meta.env.VITE_CONVEX_URL)),
  convexHostname: getConvexHostname(getEnvString(import.meta.env.VITE_CONVEX_URL)),
  telegramWebAppExists: Boolean(window.Telegram?.WebApp),
  adminTokenPresent: "unknown",
  queryArgsType: "unknown",
  querySource: "not reported",
  convexPingStatus: "pending",
  convexPingError: "",
  errors: [],
};

let appRoot: Root | null = null;
const startupErrors = new Set<string>();
let runtimeFallbackShown = false;

const logInfo = (message: string, details?: unknown) => {
  if (details === undefined) {
    console.log(`${APP_LOG_PREFIX} ${message}`);
    return;
  }
  console.log(`${APP_LOG_PREFIX} ${message}`, details);
};

const logError = (message: string, details?: unknown) => {
  if (details === undefined) {
    console.error(`${APP_LOG_PREFIX} ${message}`);
    return;
  }
  console.error(`${APP_LOG_PREFIX} ${message}`, details);
};

const formatError = (error: unknown): RenderErrorDetails => {
  if (error instanceof Error) {
    return {
      message: `${error.name}: ${error.message}`,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
};

const quote = (value: string): string => `"${value}"`;

const getAppRoot = (): Root => {
  const mount = ensureRootElement();
  if (!appRoot) {
    appRoot = createRoot(mount);
  }
  return appRoot;
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

const ensureDiagnosticsOverlay = (): HTMLDivElement => {
  const existing = document.getElementById(
    DIAGNOSTICS_OVERLAY_ID,
  ) as HTMLDivElement | null;
  if (existing) {
    return existing;
  }

  const overlay = document.createElement("div");
  overlay.id = DIAGNOSTICS_OVERLAY_ID;
  overlay.setAttribute("role", "status");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.padding = "6px 8px";
  overlay.style.background = "rgba(17, 24, 39, 0.95)";
  overlay.style.color = "#f3f4f6";
  overlay.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  overlay.style.fontSize = "11px";
  overlay.style.lineHeight = "1.4";
  overlay.style.whiteSpace = "pre-wrap";
  overlay.style.wordBreak = "break-word";
  overlay.style.pointerEvents = "none";
  overlay.style.borderBottom = "1px solid rgba(75, 85, 99, 0.8)";

  document.body.prepend(overlay);
  return overlay;
};

const renderDiagnosticsOverlay = () => {
  diagnostics.telegramWebAppExists = Boolean(window.Telegram?.WebApp);

  const overlay = ensureDiagnosticsOverlay();
  const lines: string[] = [
    `${APP_LOG_PREFIX} startup diagnostics`,
    `build_time: ${quote(diagnostics.buildTime)}`,
    `import.meta.env.MODE: ${quote(diagnostics.mode)}`,
    `import.meta.env.PROD: ${String(diagnostics.prod)}`,
    `VITE_APP_ENVIRONMENT: ${quote(diagnostics.appEnvironment)}`,
    `VITE_CONVEX_URL: ${
      diagnostics.convexUrlExists
        ? `present (hostname=${quote(diagnostics.convexHostname || "invalid")})`
        : "missing"
    }`,
    `window.Telegram?.WebApp: ${diagnostics.telegramWebAppExists ? "present" : "missing"}`,
    `adminToken_present: ${diagnostics.adminTokenPresent}`,
    `query_args_type: ${diagnostics.queryArgsType}`,
    `query_source: ${quote(diagnostics.querySource)}`,
    `convex_ping: ${
      diagnostics.convexPingStatus === "failed"
        ? `failed (${diagnostics.convexPingError})`
        : diagnostics.convexPingStatus
    }`,
  ];

  if (diagnostics.errors.length > 0) {
    lines.push("errors:");
    diagnostics.errors.forEach((error) => lines.push(`- ${error}`));
  }

  overlay.textContent = lines.join("\n");
};

const appendStartupError = (message: string) => {
  const trimmed = message.trim();
  if (!trimmed || startupErrors.has(trimmed)) {
    return;
  }
  startupErrors.add(trimmed);
  diagnostics.errors = Array.from(startupErrors);
  renderDiagnosticsOverlay();
};

const renderStartupMessage = (
  title: string,
  message: string,
  items: string[] = [],
  details?: RenderErrorDetails,
) => {
  getAppRoot().render(
    <React.StrictMode>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "720px",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(15, 23, 42, 0.9)",
            padding: "20px",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: "20px" }}>{title}</h1>
          <p style={{ margin: "0 0 12px", fontSize: "14px", opacity: 0.9 }}>
            {message}
          </p>
          {items.length > 0 ? (
            <ul style={{ margin: "0 0 12px", paddingLeft: "20px", fontSize: "13px" }}>
              {items.map((item) => (
                <li key={item} style={{ marginBottom: "4px" }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {details?.message ? (
            <pre
              style={{
                margin: 0,
                borderRadius: "8px",
                border: "1px solid rgba(248, 113, 113, 0.5)",
                background: "rgba(127, 29, 29, 0.35)",
                padding: "10px",
                fontSize: "12px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {details.stack
                ? `${details.message}\n\n${details.stack}`
                : details.message}
            </pre>
          ) : null}
        </div>
      </div>
    </React.StrictMode>,
  );
};

const renderRuntimeFallback = (
  title: string,
  message: string,
  details: RenderErrorDetails,
) => {
  if (runtimeFallbackShown) {
    return;
  }
  runtimeFallbackShown = true;
  renderStartupMessage(title, message, [], details);
};


const initOverlayErrorHooks = () => {
  window.addEventListener("error", (event) => {
    if (!event.error && !event.message) {
      return;
    }

    const formatted = formatError(event.error ?? event.message);
    appendStartupError(`Uncaught error: ${formatted.message}`);
    renderRuntimeFallback(
      "Runtime Error",
      "The app crashed after initial render.",
      formatted,
    );
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const formatted = formatError(event.reason);
    appendStartupError(`Unhandled rejection: ${formatted.message}`);
    renderRuntimeFallback(
      "Unhandled Promise Error",
      "A background task failed after startup.",
      formatted,
    );
  });
};

const initQueryDebugHooks = () => {
  window.addEventListener(ADMIN_QUERY_DEBUG_EVENT, (event) => {
    const detail = (event as CustomEvent<QueryDebugDetail>).detail;
    if (!detail) {
      return;
    }

    diagnostics.adminTokenPresent = detail.adminTokenPresent ? "true" : "false";
    diagnostics.queryArgsType = detail.queryArgsType;
    diagnostics.querySource = `${detail.hook} -> ${detail.query}`;
    renderDiagnosticsOverlay();
  });
};

const bootstrap = async () => {
  renderDiagnosticsOverlay();
  initOverlayErrorHooks();
  initQueryDebugHooks();
  initGlobalErrorHandlers();

  logInfo("Bootstrap start", {
    buildTime: diagnostics.buildTime,
    mode: diagnostics.mode,
    prod: diagnostics.prod,
    appEnvironment: diagnostics.appEnvironment,
    convexHostname: diagnostics.convexHostname || "missing",
    telegramWebAppExists: diagnostics.telegramWebAppExists,
  });

  const { isValid, config, errors, raw } = validateEnv();
  diagnostics.appEnvironment = config.VITE_APP_ENVIRONMENT;
  diagnostics.convexUrlExists = Boolean(config.VITE_CONVEX_URL);
  diagnostics.convexHostname = getConvexHostname(config.VITE_CONVEX_URL);
  renderDiagnosticsOverlay();

  if (!isValid) {
    errors.forEach((error) => appendStartupError(error));
    logError("Environment validation failed", {
      errors,
      convexHostname: diagnostics.convexHostname || "invalid",
    });

    renderStartupMessage(
      "Configuration Error",
      "Startup stopped because required environment values are invalid.",
      [
        ...errors,
        `VITE_CONVEX_URL raw: ${quote(raw.VITE_CONVEX_URL)}`,
        `VITE_CONVEX_URL trimmed: ${quote(config.VITE_CONVEX_URL)}`,
        `VITE_APP_ENVIRONMENT trimmed: ${quote(config.VITE_APP_ENVIRONMENT)}`,
      ],
    );
    return;
  }

  let convex: ConvexReactClient;
  try {
    convex = new ConvexReactClient(config.VITE_CONVEX_URL);
  } catch (error) {
    const formatted = formatError(error);
    appendStartupError(`Convex client init failed: ${formatted.message}`);
    diagnostics.convexPingStatus = "failed";
    diagnostics.convexPingError = formatted.message;
    renderDiagnosticsOverlay();
    logError("Failed to create Convex client", formatted);
    renderStartupMessage(
      "Convex Client Error",
      "Failed to initialize Convex client during startup.",
      [
        `Convex hostname: ${quote(diagnostics.convexHostname || "invalid")}`,
        `Convex URL value: ${quote(config.VITE_CONVEX_URL)}`,
      ],
      formatted,
    );
    return;
  }

  // Convex connectivity is checked reactively inside the app via useQuery(api.health.health).
  diagnostics.convexPingStatus = "pending";
  renderDiagnosticsOverlay();
  logInfo("Convex client created — connectivity checked reactively in app", {
    convexHostname: diagnostics.convexHostname || "invalid",
  });

  if (!window.Telegram?.WebApp) {
    appendStartupError("window.Telegram.WebApp is missing");
    renderDiagnosticsOverlay();
    logError("Telegram WebApp missing at bootstrap", {
      url: window.location.href,
      appEnvironment: diagnostics.appEnvironment,
      convexHostname: diagnostics.convexHostname || "missing",
    });
    renderStartupMessage(
      "Telegram Context Required",
      "Open this mini app inside Telegram",
      [
        `Current URL: ${quote(window.location.href)}`,
        `VITE_APP_ENVIRONMENT: ${quote(diagnostics.appEnvironment)}`,
        `VITE_CONVEX_URL hostname: ${quote(diagnostics.convexHostname || "missing")}`,
      ],
    );
    convex.close();
    return;
  }

  logInfo("Rendering app", {
    convexPingStatus: diagnostics.convexPingStatus,
  });
  getAppRoot().render(
    <React.StrictMode>
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <AppWithConvexStatus>
            <KonstaProvider theme="ios">
              <AdminProvider>
                <App />
                <Toaster position="top-center" />
              </AdminProvider>
            </KonstaProvider>
          </AppWithConvexStatus>
        </ConvexProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
};

void bootstrap().catch((error) => {
  const formatted = formatError(error);
  appendStartupError(`Fatal bootstrap error: ${formatted.message}`);
  logError("Fatal bootstrap error", error);
  renderStartupMessage(
    "Startup Failed",
    "The app crashed before normal render.",
    [],
    formatted,
  );
});
