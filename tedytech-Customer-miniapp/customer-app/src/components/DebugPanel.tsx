import { useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex_generated/api";

function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  const env = (import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.MODE ?? "").toLowerCase();
  if (env === "production") return false;
  if (window.location.hostname.includes("localhost")) return true;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

const CONVEX_URL = (import.meta.env.VITE_CONVEX_URL ?? "") as string;

type QState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string; stackLines: string[]; requestId: string | null; };

function extractRequestId(text: string): string | null {
  const m = text.match(/\[Request ID:\s*([a-f0-9]+)\]/i);
  return m ? m[1] : null;
}

function firstNLines(s: string, n: number): string[] {
  return s.split("\n").slice(0, n).filter(Boolean);
}

async function callConvexQuery(args: Record<string, unknown>): Promise<QState> {
  if (!CONVEX_URL) return { status: "error", message: "VITE_CONVEX_URL not set", stackLines: [], requestId: null };
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "affiliates:getAffiliateByCustomerId", args, format: "json" }),
    });
    const json = await res.json();
    if (json.status === "success") return { status: "success", data: json.value ?? null };
    const msg = String(json.errorMessage ?? "Unknown Convex error");
    const requestId = extractRequestId(msg);
    const rawStack = json.errorData?.stack ?? "";
    const stackLines = rawStack ? firstNLines(rawStack, 5) : firstNLines(msg, 5);
    return { status: "error", message: msg, stackLines, requestId };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { status: "error", message: err.message, stackLines: firstNLines(err.stack ?? "", 5), requestId: extractRequestId(err.message) };
  }
}

export function DebugPanel() {
  const [open, setOpen] = useState(true);
  const [stateA, setStateA] = useState<QState>({ status: "idle" });
  const [stateB, setStateB] = useState<QState>({ status: "idle" });
  const products = useConvexQuery(api.products.listAllProducts) as unknown[] | undefined;

  if (!isDebugMode()) return null;

  const tgAvailable = Boolean((window as any).Telegram?.WebApp);
  const productsCount = products === undefined ? "loading" : Array.isArray(products) ? String(products.length) : "n/a";

  async function runA() { setStateA({ status: "loading" }); setStateA(await callConvexQuery({})); }
  async function runB() { setStateB({ status: "loading" }); setStateB(await callConvexQuery({ customerId: "test-user-123" })); }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ position: "fixed", bottom: 80, right: 12, zIndex: 9999, background: "#1a1a2e", color: "#00d4ff", border: "1px solid #00d4ff", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}>DEBUG</button>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", overflowY: "auto", padding: "16px 12px 80px", fontFamily: "monospace", fontSize: 12, color: "#e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#00d4ff", fontWeight: 700, fontSize: 13 }}>⚙ CONVEX DEBUG PANEL</span>
        <button onClick={() => setOpen(false)} style={miniBtnStyle}>minimize</button>
      </div>
      <Row label="window.location.href" value={window.location.href} />
      <Row label="Telegram WebApp" value={String(tgAvailable)} highlight={tgAvailable ? "ok" : "warn"} />
      <Row label="VITE_CONVEX_URL" value={CONVEX_URL} highlight={CONVEX_URL ? "ok" : "error"} />
      <Row label="products count" value={productsCount} highlight={productsCount === "loading" ? undefined : "ok"} />
      <Divider />
      <SectionLabel>AFFILIATE QUERY TESTS</SectionLabel>
      <TestBlock label='A) getAffiliateByCustomerId( {} )' state={stateA} onRun={runA} />
      <TestBlock label='B) getAffiliateByCustomerId( { customerId: "test-user-123" } )' state={stateB} onRun={runB} />
      <Divider />
      <div style={{ color: "#475569", fontSize: 10 }}>Remove ?debug=1 from URL to hide this panel.</div>
    </div>
  );
}

function TestBlock({ label, state, onRun }: any) {
  const busy = state.status === "loading";
  return (
    <div style={{ marginBottom: 12, background: "#0f172a", borderRadius: 6, padding: 10 }}>
      <div style={{ color: "#64748b", marginBottom: 6, fontSize: 11 }}>{label}</div>
      {state.status === "success" && <div style={{ color: "#4ade80", marginBottom: 6, wordBreak: "break-all" }}>result: {state.data === null ? "null ✅" : JSON.stringify(state.data)}</div>}
      {state.status === "error" && <div style={{ color: "#f87171", marginBottom: 4 }}>❌ error: {state.message}</div>}
      <button onClick={onRun} disabled={busy} style={btnStyle(busy)}>{busy ? "running…" : "Run"}</button>
    </div>
  );
}

function Row({ label, value, highlight }: any) {
  const color = highlight === "ok" ? "#4ade80" : highlight === "warn" ? "#fbbf24" : highlight === "error" ? "#f87171" : "#e2e8f0";
  return <div style={{ marginBottom: 8 }}><span style={{ color: "#64748b" }}>{label}: </span><span style={{ color, wordBreak: "break-all" }}>{value}</span></div>;
}

function Divider() { return <hr style={{ border: "none", borderTop: "1px solid #333", margin: "12px 0" }} />; }
function SectionLabel({ children }: any) { return <div style={{ color: "#94a3b8", marginBottom: 8, fontSize: 11 }}>{children}</div>; }
const miniBtnStyle: any = { background: "none", border: "1px solid #555", color: "#aaa", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 };
function btnStyle(disabled: boolean): any { return { background: disabled ? "#1e293b" : "#0ea5e9", color: "#fff", border: "none", borderRadius: 4, padding: "5px 12px", fontSize: 11, cursor: disabled ? "default" : "pointer" }; }
