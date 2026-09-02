/**
 * Module for secure URL and configuration obfuscation/decryption.
 * Protects private endpoint strings and Google Drive IDs from plaintext exposure.
 */
export class CryptoResolver {
  private static readonly APP_SALT_PEPPER = 'TerraMetrics3D_2026_GeoSecure_Salt_9981';

  /**
   * Decodes an obfuscated XOR + Base64Url string in memory
   */
  public static decodeObfuscated(encoded: string, customKey: string = this.APP_SALT_PEPPER): string {
    try {
      if (!encoded) return '';
      // Base64Url to standard Base64
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      const keyLength = customKey.length;

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i) ^ customKey.charCodeAt(i % keyLength);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      console.warn('[CryptoResolver] Failed to decode obfuscated string:', e);
      return '';
    }
  }

  /**
   * Encodes a string (for build scripts / CLI generation)
   */
  public static encodeObfuscated(plainText: string, customKey: string = this.APP_SALT_PEPPER): string {
    const utf8Bytes = new TextEncoder().encode(plainText);
    const keyLength = customKey.length;
    let binaryString = '';

    for (let i = 0; i < utf8Bytes.length; i++) {
      const charCode = utf8Bytes[i] ^ customKey.charCodeAt(i % keyLength);
      binaryString += String.fromCharCode(charCode);
    }
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Cryptographic SHA-256 hash calculation of ArrayBuffer / Uint8Array
   */
  public static async computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    console.warn('[CryptoResolver] Web Crypto API subtle not available (Insecure context). Using fallback.');
    return '';
  }
}
