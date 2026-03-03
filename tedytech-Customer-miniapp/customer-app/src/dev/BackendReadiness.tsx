// src/dev/BackendReadiness.tsx
// DEV-ONLY: Backend readiness diagnostic page
// Shows PASS/FAIL for all required Convex endpoints

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex_generated/api";
import { useApp } from "@/contexts/AppContext";

interface CheckResult {
  name: string;
  status: "pending" | "pass" | "fail";
  error?: string;
}

export function BackendReadiness() {
  const { telegramUser } = useApp();
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: "products:listAllProducts", status: "pending" },
    { name: "search:getSearchPanelData", status: "pending" },
    { name: "favorites:getFavorites", status: "pending" },
    { name: "affiliates:getUserReferralStats", status: "pending" },
    { name: "sessions:createSession", status: "pending" },
    { name: "threads:listThreads", status: "pending" },
  ]);

  const convexUrl = import.meta.env.VITE_CONVEX_URL || "unknown";
  const convexHost = (() => {
    try {
      return new URL(convexUrl).hostname;
    } catch {
      return "unknown";
    }
  })();

  // Get mutation reference for sessions
  const createSessionMutation = useMutation(api.sessions.createSession);

  // Run checks on mount
  useEffect(() => {
    // Log Convex host once
    console.log("[Health] Convex host:", convexHost);

    const runChecks = async () => {
      const results: CheckResult[] = [];

      // 1. products:listAllProducts - simple check via Convex fetch
      try {
        const response = await fetch(`${convexUrl}/api/query?name=products:listAllProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 1 }),
        });
        if (response.ok) {
          results.push({ name: "products:listAllProducts", status: "pass" });
        } else {
          results.push({
            name: "products:listAllProducts",
            status: "fail",
            error: `HTTP ${response.status}`,
          });
        }
      } catch (e) {
        results.push({
          name: "products:listAllProducts",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // 2. search:getSearchPanelData
      try {
        const response = await fetch(`${convexUrl}/api/query?name=search:getSearchPanelData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          results.push({ name: "search:getSearchPanelData", status: "pass" });
        } else {
          results.push({
            name: "search:getSearchPanelData",
            status: "fail",
            error: `HTTP ${response.status}`,
          });
        }
      } catch (e) {
        results.push({
          name: "search:getSearchPanelData",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // 3. favorites:getFavorites (only if telegramUser exists)
      if (telegramUser?.id) {
        try {
          const response = await fetch(`${convexUrl}/api/query?name=favorites:getFavorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: String(telegramUser.id) }),
          });
          if (response.ok) {
            results.push({ name: "favorites:getFavorites", status: "pass" });
          } else {
            results.push({
              name: "favorites:getFavorites",
              status: "fail",
              error: `HTTP ${response.status}`,
            });
          }
        } catch (e) {
          results.push({
            name: "favorites:getFavorites",
            status: "fail",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        results.push({
          name: "favorites:getFavorites",
          status: "pending",
          error: "No telegramUser (skipped)",
        });
      }

      // 4. affiliates:getUserReferralStats (only if telegramUser.id exists)
      if (telegramUser?.id) {
        try {
          const response = await fetch(
            `${convexUrl}/api/query?name=affiliates:getUserReferralStats`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegramId: telegramUser.id }),
            }
          );
          if (response.ok) {
            results.push({
              name: "affiliates:getUserReferralStats",
              status: "pass",
            });
          } else {
            results.push({
              name: "affiliates:getUserReferralStats",
              status: "fail",
              error: `HTTP ${response.status}`,
            });
          }
        } catch (e) {
          results.push({
            name: "affiliates:getUserReferralStats",
            status: "fail",
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        results.push({
          name: "affiliates:getUserReferralStats",
          status: "pending",
          error: "No telegramUser (skipped)",
        });
      }

      // 5. sessions:createSession - use mutation
      try {
        await createSessionMutation();
        results.push({ name: "sessions:createSession", status: "pass" });
      } catch (e) {
        results.push({
          name: "sessions:createSession",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // 6. threads:listThreads
      try {
        const response = await fetch(`${convexUrl}/api/query?name=threads:listThreads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          results.push({ name: "threads:listThreads", status: "pass" });
        } else {
          results.push({
            name: "threads:listThreads",
            status: "fail",
            error: `HTTP ${response.status}`,
          });
        }
      } catch (e) {
        results.push({
          name: "threads:listThreads",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
        });
      }

      setChecks(results);
    };

    runChecks().catch((e) => {
      console.error("[Health] Unexpected error during checks:", e);
      // Don't let errors bubble up - just log them
    });
  }, [telegramUser, convexUrl, createSessionMutation]);

  const handleRunAgain = () => {
    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: "pending" as const }))
    );
    window.location.reload();
  };

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Backend Readiness (DEV)</h1>
        <p className="text-gray-400 mb-6">
          Convex host: <code className="text-yellow-400">{convexHost}</code>
        </p>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-900 bg-opacity-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-400">{passCount}</div>
              <div className="text-sm text-green-300">Passed</div>
            </div>
            <div className="bg-red-900 bg-opacity-50 p-4 rounded">
              <div className="text-2xl font-bold text-red-400">{failCount}</div>
              <div className="text-sm text-red-300">Failed</div>
            </div>
          </div>

          <div className="space-y-4">
            {checks.map((check) => (
              <div
                key={check.name}
                className="border-l-4 pl-4 py-2"
                style={{
                  borderColor:
                    check.status === "pass"
                      ? "#22c55e"
                      : check.status === "fail"
                        ? "#ef4444"
                        : "#6b7280",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      check.status === "pass"
                        ? "bg-green-500"
                        : check.status === "fail"
                          ? "bg-red-500"
                          : "bg-gray-500"
                    }`}
                  />
                  <code className="font-mono text-sm">{check.name}</code>
                  <span
                    className={`ml-auto text-sm font-semibold ${
                      check.status === "pass"
                        ? "text-green-400"
                        : check.status === "fail"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {check.status.toUpperCase()}
                  </span>
                </div>
                {check.error && (
                  <div className="mt-2 text-xs text-gray-400 ml-6">
                    {check.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleRunAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Run Again
        </button>

        <div className="mt-6 text-xs text-gray-500">
          This page is only visible in development mode. It will not appear in
          production builds.
        </div>
      </div>
    </div>
  );
}
