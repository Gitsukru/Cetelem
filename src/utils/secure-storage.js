// Secure LocalStorage with Web Crypto API
// AES-256-GCM encryption for sensitive data

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

// Cache for derived keys to avoid re-deriving on every operation
let cachedKey = null;
let cachedKeyId = null;

/**
 * Get or generate a device-specific identifier for key derivation
 * Uses multiple sources to create a unique device fingerprint
 */
function getDeviceSecret() {
  const DEVICE_SECRET_KEY = 'device_encryption_salt';

  let secret = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!secret) {
    // Generate a cryptographically secure random secret
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    secret = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_SECRET_KEY, secret);
  }

  return secret;
}

/**
 * Derive an encryption key from device secret using PBKDF2
 */
async function deriveKey(salt) {
  const deviceSecret = getDeviceSecret();
  const keyId = deviceSecret + '-' + Array.from(salt).join(',');

  // Return cached key if available
  if (cachedKey && cachedKeyId === keyId) {
    return cachedKey;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(deviceSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  // Cache the key
  cachedKey = key;
  cachedKeyId = keyId;

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @returns {string} - Base64 encoded encrypted data with salt and IV
 */
async function encrypt(data) {
  try {
    if (data === null || data === undefined) return null;

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(salt);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv: iv },
      key,
      dataBuffer
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(encryptedBuffer), SALT_LENGTH + IV_LENGTH);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypt data encrypted with encrypt()
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} - Decrypted data
 */
async function decrypt(encryptedData) {
  try {
    if (!encryptedData) return null;

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encryptedBuffer = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: iv },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Secure Storage API - Drop-in replacement for localStorage with encryption
 */
const SecureStorage = {
  /**
   * Store encrypted data
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  async setItem(key, value) {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      const encrypted = await encrypt(jsonValue);
      if (encrypted) {
        localStorage.setItem(`secure_${key}`, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      return false;
    }
  },

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key not found
   * @returns {any} - Decrypted value (parsed from JSON if applicable)
   */
  async getItem(key, defaultValue = null) {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return defaultValue;

      const decrypted = await decrypt(encrypted);
      if (decrypted === null) return defaultValue;

      // Try to parse as JSON, return raw string if fails
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return defaultValue;
    }
  },

  /**
   * Remove item from secure storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(`secure_${key}`);
  },

  /**
   * Clear all secure storage items
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Check if secure storage is available
   * @returns {boolean}
   */
  isAvailable() {
    return typeof crypto !== 'undefined' &&
           typeof crypto.subtle !== 'undefined' &&
           typeof localStorage !== 'undefined';
  },

  /**
   * Migrate existing unencrypted data to encrypted storage
   * @param {string} oldKey - Original localStorage key
   * @param {string} newKey - New secure storage key (optional, defaults to oldKey)
   * @param {boolean} deleteOld - Whether to delete the old unencrypted data
   */
  async migrate(oldKey, newKey = null, deleteOld = true) {
    try {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue) {
        await this.setItem(newKey || oldKey, oldValue);
        if (deleteOld) {
          localStorage.removeItem(oldKey);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecureStorage, encrypt, decrypt };
}

// Global export
window.SecureStorage = SecureStorage;
