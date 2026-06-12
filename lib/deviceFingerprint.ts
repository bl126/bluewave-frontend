export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Robust fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    // 1. Get or create a persistent UUID
    let deviceUuid = localStorage.getItem('bluewave_device_uuid');
    if (!deviceUuid) {
      deviceUuid = generateUUID();
      localStorage.setItem('bluewave_device_uuid', deviceUuid);
    }
    
    // 2. Capture basic browser fingerprint features
    const screenSpec = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgent = navigator.userAgent || '';
    const language = navigator.language || '';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    
    // Return combined fingerprint string
    return `${deviceUuid}|${screenSpec}|${language}|${timeZone}|${userAgent}`;
  } catch (e) {
    console.error("Failed to generate device fingerprint:", e);
    return 'UNKNOWN_DEVICE';
  }
}
