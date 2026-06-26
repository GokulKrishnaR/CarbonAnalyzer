/** Cookie max-age: 1 year in seconds */
export const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export const COOKIE_KEYS = {
  USER_INPUTS: "carbon_analyzer_user_inputs",
  ECO_STREAK: "carbon_analyzer_eco_streak",
  ECO_LAST_LOGGED: "carbon_analyzer_eco_last_logged",
  HF_TOKEN: "carbon_analyzer_hf_token",
} as const;

export function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS): void {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearAppCookies(): void {
  Object.values(COOKIE_KEYS).forEach(deleteCookie);
}
