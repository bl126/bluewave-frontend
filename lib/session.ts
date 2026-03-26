// [CODE: FRONTEND_SESSION_SINGLETON]
// lib/session.ts
"use client";

let sessionExpired = false;
let listeners: Set<(expired: boolean) => void> = new Set();

/**
 * Check if the current session is marked as expired.
 * Used by API helpers to prevent unnecessary network calls.
 */
export const isSessionExpired = () => sessionExpired;

/**
 * Mark the session as expired. 
 * This triggers the error UI and halts all future API requests.
 */
export const setSessionExpired = () => {
    if (!sessionExpired) {
        sessionExpired = true;
        console.warn("🛡️ SECURITY: Session marked as expired. Halting all API requests.");
        listeners.forEach((cb) => cb(true));
    }
};

/**
 * Subscribe to session expiry events.
 * Used by UI components to show the error screen.
 */
export const subscribeToSessionExpiry = (cb: (expired: boolean) => void) => {
    listeners.add(cb);
    // Immediate check in case it already expired
    if (sessionExpired) cb(true);

    return () => {
        listeners.delete(cb);
    };
};
