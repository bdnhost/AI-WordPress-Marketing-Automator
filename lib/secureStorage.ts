import { encrypt, decrypt } from './encryption';

/**
 * Secure storage wrapper that encrypts data before storing in localStorage
 */
export const secureStorage = {
  /**
   * Stores an encrypted value in localStorage
   * @param key - Storage key
   * @param value - Value to store (will be encrypted)
   */
  setItem<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      const encrypted = encrypt(json);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Failed to set item "${key}":`, error);
      throw new Error(`Secure storage setItem failed for key: ${key}`);
    }
  },

  /**
   * Retrieves and decrypts a value from localStorage
   * @param key - Storage key
   * @returns Decrypted value or null if not found/invalid
   */
  getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        return null;
      }

      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error(`Failed to get item "${key}":`, error);
      // Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Removes an item from localStorage
   * @param key - Storage key
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item "${key}":`, error);
    }
  },

  /**
   * Clears all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },

  /**
   * Checks if a key exists in localStorage
   * @param key - Storage key
   * @returns true if key exists
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Gets all keys from localStorage
   * @returns Array of storage keys
   */
  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  },

  /**
   * Migrates unencrypted data to encrypted storage
   * @param key - Storage key
   * @returns true if migration successful
   */
  migrateToEncrypted<T>(key: string): boolean {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return false;
      }

      // Try to parse as JSON (unencrypted)
      try {
        const data = JSON.parse(raw) as T;
        // If successful, re-save as encrypted
        this.setItem(key, data);
        return true;
      } catch {
        // Already encrypted or invalid, leave as is
        return false;
      }
    } catch (error) {
      console.error(`Migration failed for "${key}":`, error);
      return false;
    }
  },
};

// Export a regular storage wrapper (non-encrypted) for comparison
export const regularStorage = {
  setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};
