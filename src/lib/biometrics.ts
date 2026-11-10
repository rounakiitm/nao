/**
 * WebAuthn Biometric & Platform Authenticator Helper
 * Supports Android Fingerprint / Face Unlock, iOS TouchID / FaceID, and Windows Hello.
 */

const BIOMETRIC_CREDENTIAL_KEY = 'nao_biometric_credential_id';

/**
 * Checks if platform biometrics (fingerprint/face) are available on this device and browser.
 */
export async function isBiometricsSupported(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Helper to convert ArrayBuffer to Base64 string
 */
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper to convert Base64 string to ArrayBuffer
 */
function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register the user's biometric (fingerprint/face) credential on this device.
 */
export async function registerBiometrics(
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Biometric hardware (fingerprint/face recognition) is not available or enabled on this device.',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'nao Vault',
        },
        user: {
          id: userId,
          name: userEmail || 'user@nao.local',
          displayName: userName || 'nao User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256 (standard on Android/iOS)
          { alg: -257, type: 'public-key' }, // RS256 (Windows Hello)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const b64Id = bufferToBase64(credential.rawId);
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, b64Id);
      return { success: true };
    }
    return { success: false, error: 'Could not complete biometric registration.' };
  } catch (err: any) {
    console.error('Biometric registration error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric prompt was cancelled or timed out.' };
    }
    return { success: false, error: err.message || 'Failed to register biometrics.' };
  }
}

/**
 * Prompt the user for their fingerprint / face recognition to unlock.
 */
export async function authenticateWithBiometrics(): Promise<{ success: boolean; error?: string }> {
  try {
    const supported = await isBiometricsSupported();
    if (!supported) {
      return { success: false, error: 'Biometrics are not supported on this browser/device.' };
    }

    const b64Id = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: 'required',
      timeout: 60000,
    };

    if (b64Id) {
      publicKeyOptions.allowCredentials = [
        {
          id: base64ToBuffer(b64Id),
          type: 'public-key',
          transports: ['internal'],
        },
      ];
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric verification unsuccessful.' };
  } catch (err: any) {
    console.error('Biometric auth error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric verification was cancelled.' };
    }
    return { success: false, error: err.message || 'Biometric verification failed.' };
  }
}

/**
 * Check if biometrics has been successfully registered on this browser.
 */
export function hasBiometricCredential(): boolean {
  return typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY));
}

/**
 * Clear stored biometric credential.
 */
export function removeBiometricCredential(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
  }
}

