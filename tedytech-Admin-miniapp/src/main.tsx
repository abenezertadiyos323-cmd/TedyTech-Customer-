import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "sonner";
import { KonstaProvider } from "konsta/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initGlobalErrorHandlers } from "@/lib/errorHandler";
import { getConvexHostname, validateEnv } from "@/lib/envValidation";
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
  adminChatIdExists: boolean;
  telegramWebAppExists: boolean;
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
  adminChatIdExists: Boolean(getEnvString(import.meta.env.VITE_ADMIN_CHAT_ID)),
  telegramWebAppExists: Boolean(window.Telegram?.WebApp),
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
    `VITE_ADMIN_CHAT_ID: ${diagnostics.adminChatIdExists ? "present" : "missing"}`,
    `window.Telegram?.WebApp: ${diagnostics.telegramWebAppExists ? "present" : "missing"}`,
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

const pingConvex = async (convexUrl: string) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);
  try {
    await fetch(convexUrl.replace(/\/+$/, ""), {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: formatError(error).message };
  } finally {
    window.clearTimeout(timeoutId);
  }
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
  });

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

const bootstrap = async () => {
  renderDiagnosticsOverlay();
  initOverlayErrorHooks();
  initGlobalErrorHandlers();

  logInfo("Bootstrap start", {
    buildTime: diagnostics.buildTime,
    mode: diagnostics.mode,
    prod: diagnostics.prod,
    appEnvironment: diagnostics.appEnvironment,
    convexHostname: diagnostics.convexHostname || "missing",
    adminChatIdExists: diagnostics.adminChatIdExists,
    telegramWebAppExists: diagnostics.telegramWebAppExists,
  });

  const { isValid, config, errors, raw } = validateEnv();
  diagnostics.appEnvironment = config.VITE_APP_ENVIRONMENT;
  diagnostics.convexUrlExists = Boolean(config.VITE_CONVEX_URL);
  diagnostics.convexHostname = getConvexHostname(config.VITE_CONVEX_URL);
  diagnostics.adminChatIdExists = Boolean(config.VITE_ADMIN_CHAT_ID);
  renderDiagnosticsOverlay();

  if (!isValid) {
    errors.forEach((error) => appendStartupError(error));
    logError("Environment validation failed", {
      errors,
      convexHostname: diagnostics.convexHostname || "invalid",
      adminChatIdExists: diagnostics.adminChatIdExists,
    });

    renderStartupMessage(
      "Configuration Error",
      "Startup stopped because required environment values are invalid.",
      [
        ...errors,
        `VITE_CONVEX_URL raw: ${quote(raw.VITE_CONVEX_URL)}`,
        `VITE_CONVEX_URL trimmed: ${quote(config.VITE_CONVEX_URL)}`,
        `VITE_ADMIN_CHAT_ID raw: ${quote(raw.VITE_ADMIN_CHAT_ID)}`,
        `VITE_ADMIN_CHAT_ID trimmed: ${quote(config.VITE_ADMIN_CHAT_ID)}`,
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

  logInfo("Pinging Convex deployment", {
    convexHostname: diagnostics.convexHostname || "invalid",
  });
  const pingResult = await pingConvex(config.VITE_CONVEX_URL);
  if (!pingResult.ok) {
    diagnostics.convexPingStatus = "failed";
    diagnostics.convexPingError = pingResult.error;
    appendStartupError(`Convex ping failed: ${pingResult.error}`);
    renderDiagnosticsOverlay();
    logError("Convex ping failed", {
      convexHostname: diagnostics.convexHostname || "invalid",
      error: pingResult.error,
    });
    renderStartupMessage(
      "Convex Connection Failed",
      "Could not reach Convex during startup.",
      [
        `Convex hostname: ${quote(diagnostics.convexHostname || "invalid")}`,
        `Error: ${quote(pingResult.error)}`,
      ],
      { message: pingResult.error },
    );
    convex.close();
    return;
  }

  diagnostics.convexPingStatus = "ok";
  diagnostics.convexPingError = "";
  renderDiagnosticsOverlay();
  logInfo("Convex ping succeeded", {
    convexHostname: diagnostics.convexHostname || "invalid",
  });

  if (!window.Telegram?.WebApp) {
    appendStartupError("window.Telegram.WebApp is missing");
    renderDiagnosticsOverlay();
    logError("Telegram WebApp missing at bootstrap", {
      url: window.location.href,
      appEnvironment: diagnostics.appEnvironment,
      convexHostname: diagnostics.convexHostname || "missing",
      adminChatIdExists: diagnostics.adminChatIdExists,
    });
    renderStartupMessage(
      "Telegram Context Required",
      "Open this mini app inside Telegram",
      [
        `Current URL: ${quote(window.location.href)}`,
        `VITE_APP_ENVIRONMENT: ${quote(diagnostics.appEnvironment)}`,
        `VITE_CONVEX_URL hostname: ${quote(diagnostics.convexHostname || "missing")}`,
        `VITE_ADMIN_CHAT_ID exists: ${diagnostics.adminChatIdExists ? "true" : "false"}`,
      ],
    );
    convex.close();
    return;
  }

  logInfo("Rendering app");
  getAppRoot().render(
    <React.StrictMode>
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <KonstaProvider theme="ios">
            <AdminProvider>
              <App />
              <Toaster position="top-center" />
            </AdminProvider>
          </KonstaProvider>
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
