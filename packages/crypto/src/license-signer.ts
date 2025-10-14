import _sodium from 'libsodium-wrappers';

export interface KeyPair {
  publicKey: string;  // Base64 encoded
  privateKey: string; // Base64 encoded (KEEP SECRET!)
}

export interface LicenseData {
  productId: string;
  licenseKey: string;
  licenseType: 'perpetual' | 'subscription' | 'trial';
  maxActivations: number;
  features: Record<string, boolean>;
  expiresAt?: string; // ISO 8601
  issuedAt: string;   // ISO 8601
}

export interface SignedLicense {
  data: LicenseData;
  signature: string; // Base64 encoded
}

export class LicenseSigner {
  private sodium: typeof _sodium | null = null;

  /**
   * Initialize libsodium (async operation)
   */
  async initialize(): Promise<void> {
    if (!this.sodium) {
      await _sodium.ready;
      this.sodium = _sodium;
    }
  }

  /**
   * Generate Ed25519 keypair
   * WARNING: Store privateKey securely! Never expose to clients.
   */
  async generateKeyPair(): Promise<KeyPair> {
    await this.initialize();

    const keyPair = this.sodium!.crypto_sign_keypair();

    return {
      publicKey: this.sodium!.to_base64(keyPair.publicKey),
      privateKey: this.sodium!.to_base64(keyPair.privateKey),
    };
  }

  /**
   * Sign license data with private key
   * This should ONLY be done on the server
   */
  async signLicense(
    licenseData: LicenseData,
    privateKeyBase64: string
  ): Promise<SignedLicense> {
    await this.initialize();

    const privateKey = this.sodium!.from_base64(privateKeyBase64);
    const message = JSON.stringify(licenseData);
    const messageBytes = this.sodium!.from_string(message);

    // Create detached signature
    const signature = this.sodium!.crypto_sign_detached(messageBytes, privateKey);

    return {
      data: licenseData,
      signature: this.sodium!.to_base64(signature),
    };
  }

  /**
   * Verify license signature with public key
   * This can be done offline by the client
   */
  async verifyLicense(
    signedLicense: SignedLicense,
    publicKeyBase64: string
  ): Promise<boolean> {
    await this.initialize();

    try {
      const publicKey = this.sodium!.from_base64(publicKeyBase64);
      const signature = this.sodium!.from_base64(signedLicense.signature);
      const message = JSON.stringify(signedLicense.data);
      const messageBytes = this.sodium!.from_string(message);

      // Verify signature
      const isValid = this.sodium!.crypto_sign_verify_detached(
        signature,
        messageBytes,
        publicKey
      );

      // Additional validation: check expiration
      if (isValid && signedLicense.data.expiresAt) {
        const expirationDate = new Date(signedLicense.data.expiresAt);
        if (expirationDate < new Date()) {
          return false; // Expired
        }
      }

      return isValid;
    } catch (error) {
      console.error('License verification failed:', error);
      return false;
    }
  }

  /**
   * Create offline license certificate
   * This allows offline validation for a specific time period
   */
  async createOfflineCertificate(
    licenseData: LicenseData,
    privateKeyBase64: string,
    validUntil: Date
  ): Promise<string> {
    const certificateData = {
      ...licenseData,
      certificateValidUntil: validUntil.toISOString(),
      certificateIssuedAt: new Date().toISOString(),
    };

    const signed = await this.signLicense(certificateData, privateKeyBase64);

    // Return as compact base64 certificate
    return Buffer.from(JSON.stringify(signed)).toString('base64');
  }

  /**
   * Verify offline certificate
   */
  async verifyOfflineCertificate(
    certificateBase64: string,
    publicKeyBase64: string
  ): Promise<{ valid: boolean; data?: LicenseData }> {
    try {
      const signed: SignedLicense = JSON.parse(
        Buffer.from(certificateBase64, 'base64').toString('utf-8')
      );

      const isValid = await this.verifyLicense(signed, publicKeyBase64);

      // Check certificate validity period
      if (isValid && (signed.data as any).certificateValidUntil) {
        const certExpiry = new Date((signed.data as any).certificateValidUntil);
        if (certExpiry < new Date()) {
          return { valid: false }; // Certificate expired
        }
      }

      return {
        valid: isValid,
        data: isValid ? signed.data : undefined,
      };
    } catch (error) {
      console.error('Certificate verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Generate hardware fingerprint (for device binding)
   */
  async generateFingerprint(components: string[]): Promise<string> {
    await this.initialize();

    const data = components.filter(Boolean).join('|');
    const hash = this.sodium!.crypto_generichash(32, this.sodium!.from_string(data));

    return this.sodium!.to_hex(hash);
  }
}

// Export singleton instance
export const licenseSigner = new LicenseSigner();
