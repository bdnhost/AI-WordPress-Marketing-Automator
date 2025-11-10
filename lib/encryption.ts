import CryptoJS from 'crypto-js';

// Get encryption key from environment or use default (CHANGE IN PRODUCTION!)
const ENCRYPTION_KEY =
  typeof process !== 'undefined' && process.env.VITE_ENCRYPTION_KEY
    ? process.env.VITE_ENCRYPTION_KEY
    : 'default-key-change-in-production-use-env-var';

/**
 * Encrypts a string using AES-256 encryption
 * @param data - The string to encrypt
 * @returns Encrypted string
 */
export function encrypt(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts an AES-256 encrypted string
 * @param ciphertext - The encrypted string
 * @returns Decrypted string
 */
export function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts an object by converting it to JSON first
 * @param obj - The object to encrypt
 * @returns Encrypted string
 */
export function encryptObject<T>(obj: T): string {
  try {
    const json = JSON.stringify(obj);
    return encrypt(json);
  } catch (error) {
    console.error('Object encryption failed:', error);
    throw new Error('Failed to encrypt object');
  }
}

/**
 * Decrypts a string and parses it as JSON
 * @param ciphertext - The encrypted string
 * @returns Decrypted and parsed object
 */
export function decryptObject<T>(ciphertext: string): T {
  try {
    const decrypted = decrypt(ciphertext);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Object decryption failed:', error);
    throw new Error('Failed to decrypt object');
  }
}

/**
 * Creates a hash of a string using SHA-256
 * @param data - The string to hash
 * @returns Hashed string
 */
export function hash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Validates if a string can be decrypted successfully
 * @param ciphertext - The encrypted string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncrypted(ciphertext: string): boolean {
  try {
    decrypt(ciphertext);
    return true;
  } catch {
    return false;
  }
}
