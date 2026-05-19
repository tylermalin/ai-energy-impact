/**
 * Tiny helper used by the Phase 3 admin pages. The first visit to
 * /admin/pending?key=XXX or /admin/ingestion?key=XXX stashes XXX in
 * sessionStorage; subsequent navigation within the same tab keeps it
 * without re-pasting the URL. main.tsx's tRPC fetch injects it as
 * x-admin-key on every request.
 */

const STORAGE_KEY = "aipower:admin-key";

export function captureAdminKeyFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("key");
  if (fromUrl) {
    window.sessionStorage.setItem(STORAGE_KEY, fromUrl);
    return fromUrl;
  }
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function clearAdminKey(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
