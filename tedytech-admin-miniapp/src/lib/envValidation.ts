export interface EnvConfig {
  VITE_CONVEX_URL: string;
  VITE_APP_ENVIRONMENT: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  config: EnvConfig;
  errors: string[];
  raw: {
    VITE_CONVEX_URL: string;
    VITE_APP_ENVIRONMENT: string;
  };
}

const trimEnv = (value: string | undefined): string => (value ?? "").trim();

export const getConvexHostname = (value: string): string => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

const isValidConvexCloudUrl = (value: string): boolean => {
  const hostname = getConvexHostname(value);
  if (hostname.endsWith(".convex.cloud")) {
    return true;
  }
  return value.includes("convex.cloud");
};

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];

  const raw = {
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL ?? "",
    VITE_APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT ?? "",
  };

  const config: EnvConfig = {
    VITE_CONVEX_URL: trimEnv(raw.VITE_CONVEX_URL),
    VITE_APP_ENVIRONMENT: trimEnv(raw.VITE_APP_ENVIRONMENT),
  };

  if (!config.VITE_CONVEX_URL) {
    errors.push(`VITE_CONVEX_URL is missing: "${config.VITE_CONVEX_URL}"`);
  } else {
    if (!config.VITE_CONVEX_URL.startsWith("https://")) {
      errors.push(
        `VITE_CONVEX_URL must start with "https://": "${config.VITE_CONVEX_URL}"`,
      );
    }
    if (!isValidConvexCloudUrl(config.VITE_CONVEX_URL)) {
      errors.push(
        `VITE_CONVEX_URL must use a convex.cloud host: "${config.VITE_CONVEX_URL}"`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    config,
    errors,
    raw,
  };
}
