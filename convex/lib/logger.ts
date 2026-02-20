const env = (globalThis as any)?.process?.env as
  | Record<string, string | undefined>
  | undefined;

const isDev =
  (env?.CONVEX_DEPLOYMENT ?? "").startsWith("dev:") ||
  env?.NODE_ENV === "development";

export function log(...args: unknown[]) {
  if (isDev) {
    console.log(...args);
  }
}
