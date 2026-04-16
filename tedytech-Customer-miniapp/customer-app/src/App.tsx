import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "./contexts/AppContext";
import Index from "./pages/Index";

// DEV-only backend readiness diagnostic
const BackendReadiness = import.meta.env.DEV
  ? lazy(() =>
      import("@/dev/BackendReadiness").then((m) => ({
        default: m.BackendReadiness,
      })),
    )
  : null;

// Lazy-load toast providers — they are never visible on first paint,
// so keeping them out of the main chunk reduces blocking parse time.
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })),
);
const SonnerToaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

const queryClient = new QueryClient();
// Always use HashRouter: works in Telegram WebViews and regular browsers.
const Router = HashRouter;

// Silently normalises any unexpected hash that Telegram may open with
// (e.g. "#/earn", "#/start") to "#/" so the app always starts at Home.
function HashNormalizer() {
  const navigate = useNavigate();
  useEffect(() => {
    const path = window.location.hash.replace(/^#/, "") || "/";
    if (path !== "/") {
      navigate("/", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          {/* Toast providers are lazy — they carry sonner + next-themes which
              are never needed on first paint. Suspense fallback=null is safe
              because they render no visible content until a toast fires. */}
          <Suspense fallback={null}>
            <Toaster />
            <SonnerToaster />
          </Suspense>
          <Router>
            {/* Normalise hash to "/" before any route renders */}
            <HashNormalizer />
            <Routes>
              {/* DEV-only health check page — accessible at /#/__health */}
              {import.meta.env.DEV && BackendReadiness && (
                <Route path="__health" element={<BackendReadiness />} />
              )}
              {/* Single catch-all: any hash Telegram opens with always
                  renders the main app. NotFound is never shown. */}
              <Route path="*" element={<Index />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
