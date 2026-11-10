import { DeviceType, LinkedDevice } from '../types';

const STORAGE_KEYS = {
  DEVICE_ID: 'nao_device_id',
  DEVICE_NAME: 'nao_device_name',
  LINKED_DEVICES: 'important_dates_linked_devices',
  IS_PRIMARY: 'nao_is_primary_device',
};

/**
 * Detects current device environment (phone, tablet, laptop, desktop), OS, and browser.
 */
export function detectDeviceEnvironment(): { type: DeviceType; name: string; os: string; browser: string } {
  if (typeof navigator === 'undefined') {
    return { type: 'desktop', name: 'Unknown Device', os: 'Unknown OS', browser: 'Browser' };
  }

  const ua = navigator.userAgent;
  let type: DeviceType = 'desktop';
  let os = 'Windows';
  let browser = 'Chrome';

  // Detect Device Category
  if (/iPad|tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
    type = 'tablet';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    type = 'phone';
  } else if (/Macintosh/i.test(ua)) {
    type = 'laptop';
    os = 'macOS';
  } else if (/Windows/i.test(ua)) {
    type = 'desktop';
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    type = 'desktop';
    os = 'Linux';
  }

  // OS Detection
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';

  // Browser Detection
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  const typeLabel = type === 'phone' ? 'Phone' : type === 'tablet' ? 'Tablet' : 'Computer';
  const name = `${os} ${typeLabel} • ${browser}`;

  return { type, name, os, browser };
}

/**
 * Gets or initializes the unique persistent identifier for this specific device.
 */
export function getCurrentDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

/**
 * Gets current device info with current session flag.
 */
export function getCurrentDevice(): LinkedDevice {
  const id = getCurrentDeviceId();
  const detected = detectDeviceEnvironment();
  const customName = localStorage.getItem(STORAGE_KEYS.DEVICE_NAME);
  const isPrimary = localStorage.getItem(STORAGE_KEYS.IS_PRIMARY) === 'true' || detected.type === 'phone';

  return {
    id,
    name: customName || detected.name,
    type: detected.type,
    browser: detected.browser,
    os: detected.os,
    isCurrentDevice: true,
    isPrimary,
    pairedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };
}

/**
 * Retrieves the full list of all linked devices authorized in this vault.
 */
export function getLinkedDevices(): LinkedDevice[] {
  const current = getCurrentDevice();
  const raw = localStorage.getItem(STORAGE_KEYS.LINKED_DEVICES);
  
  let devices: LinkedDevice[] = [];
  if (raw) {
    try {
      devices = JSON.parse(raw);
    } catch {
      devices = [];
    }
  }

  // Ensure current device is included
  const exists = devices.some((d) => d.id === current.id);
  if (!exists) {
    devices = [current, ...devices];
    saveLinkedDevices(devices);
  } else {
    // Update lastSeen for current device
    devices = devices.map((d) =>
      d.id === current.id ? { ...d, lastSeenAt: new Date().toISOString(), isCurrentDevice: true } : { ...d, isCurrentDevice: false }
    );
    saveLinkedDevices(devices);
  }

  return devices;
}

/**
 * Saves the linked devices list into storage.
 */
export function saveLinkedDevices(devices: LinkedDevice[]): void {
  localStorage.setItem(STORAGE_KEYS.LINKED_DEVICES, JSON.stringify(devices));
}

/**
 * Registers a new paired device into the vault.
 */
export function registerNewLinkedDevice(device: Partial<LinkedDevice>): LinkedDevice {
  const devices = getLinkedDevices();
  const newDevice: LinkedDevice = {
    id: device.id || `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: device.name || 'New Linked Device',
    type: device.type || 'desktop',
    browser: device.browser || 'Web Browser',
    os: device.os || 'Desktop OS',
    isCurrentDevice: false,
    isPrimary: false,
    pairedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  const filtered = devices.filter((d) => d.id !== newDevice.id);
  const updated = [...filtered, newDevice];
  saveLinkedDevices(updated);
  return newDevice;
}

/**
 * Unlinks / removes a device from the vault.
 */
export function unlinkDevice(deviceId: string): LinkedDevice[] {
  const devices = getLinkedDevices();
  const updated = devices.filter((d) => d.id !== deviceId);
  saveLinkedDevices(updated);
  return updated;
}

