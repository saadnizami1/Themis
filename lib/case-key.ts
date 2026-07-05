'use client';

// Client-side storage for demo-case unlock keys. Session-scoped on purpose:
// closing the tab relocks every case.

export function getCaseKey(caseId: string): string | null {
  try {
    return sessionStorage.getItem(`themis-ck:${caseId}`);
  } catch {
    return null;
  }
}

export function setCaseKey(caseId: string, key: string) {
  try {
    sessionStorage.setItem(`themis-ck:${caseId}`, key);
  } catch {
    // Storage unavailable (private mode); the user will be asked again.
  }
}

export function caseKeyHeaders(caseId: string): Record<string, string> {
  const key = getCaseKey(caseId);
  return key ? { 'x-case-key': key } : {};
}

export function caseKeyQuery(caseId: string): string {
  const key = getCaseKey(caseId);
  return key ? `?ck=${encodeURIComponent(key)}` : '';
}
