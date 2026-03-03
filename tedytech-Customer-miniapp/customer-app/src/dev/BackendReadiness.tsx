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
  required?: boolean;
}

export function BackendReadiness() {
  const { telegramUser } = useApp();
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: "products:listAllProducts", status: "pending", required: true },
    { name: "products:listProducts", status: "pending", required: true },
    { name: "search:getSearchPanelData", status: "pending", required: true },
    { name: "favorites:getFavorites", status: "pending", required: true },
    { name: "affiliates:getUserReferralStats", status: "pending", required: false },
    { name: "sessions:createSession", status: "pending", required: true },
    { name: "threads:listThreads", status: "pending", required: false },
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

  // Helper to determine if a check is required
  const isCheckRequired = (checkName: string): boolean => {
    return !["threads:listThreads", "affiliates:getUserReferralStats"].includes(
      checkName,
    );
  };

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
          results.push({
            name: "products:listAllProducts",
            status: "pass",
            required: isCheckRequired("products:listAllProducts"),
          });
        } else {
          results.push({
            name: "products:listAllProducts",
            status: "fail",
            error: `HTTP ${response.status}`,
            required: isCheckRequired("products:listAllProducts"),
          });
        }
      } catch (e) {
        results.push({
          name: "products:listAllProducts",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
          required: isCheckRequired("products:listAllProducts"),
        });
      }

      // 2. products:listProducts - primary customer UI query
      try {
        const response = await fetch(`${convexUrl}/api/query?name=products:listProducts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: "", tab: "all" }),
        });
        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 0;
          results.push({
            name: "products:listProducts",
            status: "pass",
            error: `returned ${count} item${count !== 1 ? "s" : ""}`,
            required: isCheckRequired("products:listProducts"),
          });
        } else {
          results.push({
            name: "products:listProducts",
            status: "fail",
            error: `HTTP ${response.status}`,
            required: isCheckRequired("products:listProducts"),
          });
        }
      } catch (e) {
        results.push({
          name: "products:listProducts",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
          required: isCheckRequired("products:listProducts"),
        });
      }

      // 4. search:getSearchPanelData
      try {
        const response = await fetch(`${convexUrl}/api/query?name=search:getSearchPanelData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          results.push({
            name: "search:getSearchPanelData",
            status: "pass",
            required: isCheckRequired("search:getSearchPanelData"),
          });
        } else {
          results.push({
            name: "search:getSearchPanelData",
            status: "fail",
            error: `HTTP ${response.status}`,
            required: isCheckRequired("search:getSearchPanelData"),
          });
        }
      } catch (e) {
        results.push({
          name: "search:getSearchPanelData",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
          required: isCheckRequired("search:getSearchPanelData"),
        });
      }

      // 5. favorites:getFavorites (only if telegramUser exists)
      if (telegramUser?.id) {
        try {
          const response = await fetch(`${convexUrl}/api/query?name=favorites:getFavorites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: String(telegramUser.id) }),
          });
          if (response.ok) {
            results.push({
              name: "favorites:getFavorites",
              status: "pass",
              required: isCheckRequired("favorites:getFavorites"),
            });
          } else {
            results.push({
              name: "favorites:getFavorites",
              status: "fail",
              error: `HTTP ${response.status}`,
              required: isCheckRequired("favorites:getFavorites"),
            });
          }
        } catch (e) {
          results.push({
            name: "favorites:getFavorites",
            status: "fail",
            error: e instanceof Error ? e.message : String(e),
            required: isCheckRequired("favorites:getFavorites"),
          });
        }
      } else {
        results.push({
          name: "favorites:getFavorites",
          status: "pending",
          error: "No telegramUser (skipped)",
          required: isCheckRequired("favorites:getFavorites"),
        });
      }

      // 6. affiliates:getUserReferralStats (only if telegramUser.id exists)
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
              required: isCheckRequired("affiliates:getUserReferralStats"),
            });
          } else {
            results.push({
              name: "affiliates:getUserReferralStats",
              status: "fail",
              error: `HTTP ${response.status}`,
              required: isCheckRequired("affiliates:getUserReferralStats"),
            });
          }
        } catch (e) {
          results.push({
            name: "affiliates:getUserReferralStats",
            status: "fail",
            error: e instanceof Error ? e.message : String(e),
            required: isCheckRequired("affiliates:getUserReferralStats"),
          });
        }
      } else {
        results.push({
          name: "affiliates:getUserReferralStats",
          status: "pending",
          error: "No telegramUser (skipped)",
          required: isCheckRequired("affiliates:getUserReferralStats"),
        });
      }

      // 7. sessions:createSession - use mutation
      try {
        await createSessionMutation();
        results.push({
          name: "sessions:createSession",
          status: "pass",
          required: isCheckRequired("sessions:createSession"),
        });
      } catch (e) {
        results.push({
          name: "sessions:createSession",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
          required: isCheckRequired("sessions:createSession"),
        });
      }

      // 8. threads:listThreads
      try {
        const response = await fetch(`${convexUrl}/api/query?name=threads:listThreads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          results.push({
            name: "threads:listThreads",
            status: "pass",
            required: isCheckRequired("threads:listThreads"),
          });
        } else {
          results.push({
            name: "threads:listThreads",
            status: "fail",
            error: `HTTP ${response.status}`,
            required: isCheckRequired("threads:listThreads"),
          });
        }
      } catch (e) {
        results.push({
          name: "threads:listThreads",
          status: "fail",
          error: e instanceof Error ? e.message : String(e),
          required: isCheckRequired("threads:listThreads"),
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

  const handleCopyReport = () => {
    const timestamp = new Date().toISOString();
    const commitSha = import.meta.env.VITE_GIT_COMMIT || "unknown";
    const requiredChecks = checks.filter((c) => c.required);
    const optionalChecks = checks.filter((c) => !c.required);

    const formatChecklist = (items: CheckResult[]) =>
      items
        .map((c) => {
          const status = c.status === "pending" ? "SKIP" : c.status.toUpperCase();
          const error = c.error ? ` — ${c.error.substring(0, 80)}` : "";
          return `  ${status.padEnd(4)} ${c.name}${error}`;
        })
        .join("\n");

    const report = `Backend Readiness Report
Time: ${timestamp}
Convex: ${convexHost}
Commit: ${commitSha}

Required Checks:
${formatChecklist(requiredChecks)}${
      optionalChecks.length > 0
        ? `\n\nOptional Checks:\n${formatChecklist(optionalChecks)}`
        : ""
    }`;

    navigator.clipboard.writeText(report).then(() => {
      alert("Report copied to clipboard!");
    });
  };

  // Calculate required and optional counts separately
  const requiredChecks = checks.filter((c) => c.required !== false);
  const optionalChecks = checks.filter((c) => c.required === false);
  const requiredPass = requiredChecks.filter((c) => c.status === "pass").length;
  const requiredFail = requiredChecks.filter((c) => c.status === "fail").length;
  const optionalPass = optionalChecks.filter((c) => c.status === "pass").length;
  const optionalFail = optionalChecks.filter((c) => c.status === "fail").length;

  // READY when all required checks that were executed passed
  const isReady =
    requiredFail === 0 &&
    requiredPass > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Backend Readiness (DEV)</h1>
        <p className="text-gray-400 mb-6">
          Convex host: <code className="text-yellow-400">{convexHost}</code>
        </p>

        {/* Status Banner */}
        {requiredPass > 0 && (
          <div
            className={`rounded-lg p-4 mb-6 font-semibold text-lg ${
              isReady
                ? "bg-green-900 bg-opacity-50 border-l-4 border-green-500 text-green-300"
                : "bg-red-900 bg-opacity-50 border-l-4 border-red-500 text-red-300"
            }`}
          >
            {isReady ? "✓ READY" : "✗ NOT READY"} (Required checks)
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Required Checks</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-900 bg-opacity-50 p-3 rounded">
                <div className="text-xl font-bold text-green-400">{requiredPass}</div>
                <div className="text-xs text-green-300">Passed</div>
              </div>
              <div className="bg-red-900 bg-opacity-50 p-3 rounded">
                <div className="text-xl font-bold text-red-400">{requiredFail}</div>
                <div className="text-xs text-red-300">Failed</div>
              </div>
            </div>
          </div>
          {optionalChecks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Optional Checks</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-green-900 bg-opacity-50 p-3 rounded">
                  <div className="text-xl font-bold text-green-400">{optionalPass}</div>
                  <div className="text-xs text-green-300">Passed</div>
                </div>
                <div className="bg-red-900 bg-opacity-50 p-3 rounded">
                  <div className="text-xl font-bold text-red-400">{optionalFail}</div>
                  <div className="text-xs text-red-300">Failed</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Required Checks */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                Required
              </h4>
              <div className="space-y-2">
                {requiredChecks.map((check) => (
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

            {/* Optional Checks */}
            {optionalChecks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Optional
                </h4>
                <div className="space-y-2">
                  {optionalChecks.map((check) => (
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
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRunAgain}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Run Again
          </button>
          <button
            onClick={handleCopyReport}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Copy Report
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          This page is only visible in development mode. It will not appear in
          production builds.
        </div>
      </div>
    </div>
  );
}
