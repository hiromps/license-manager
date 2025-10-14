import { describe, it, expect, beforeAll } from 'vitest';
import { LicenseSigner } from './license-signer';

describe('LicenseSigner', () => {
  let signer: LicenseSigner;
  let keyPair: any;

  beforeAll(async () => {
    signer = new LicenseSigner();
    await signer.initialize();
    keyPair = await signer.generateKeyPair();
  });

  it('should generate valid Ed25519 keypair', async () => {
    expect(keyPair.publicKey).toBeTruthy();
    expect(keyPair.privateKey).toBeTruthy();
    expect(keyPair.publicKey).not.toBe(keyPair.privateKey);
  });

  it('should sign and verify license', async () => {
    const licenseData = {
      productId: 'prod_123',
      licenseKey: 'TEST-KEY-001',
      licenseType: 'subscription' as const,
      maxActivations: 5,
      features: { basic: true, advanced: false },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      issuedAt: new Date().toISOString(),
    };

    const signed = await signer.signLicense(licenseData, keyPair.privateKey);
    expect(signed.signature).toBeTruthy();

    const isValid = await signer.verifyLicense(signed, keyPair.publicKey);
    expect(isValid).toBe(true);
  });

  it('should reject tampered license', async () => {
    const licenseData = {
      productId: 'prod_123',
      licenseKey: 'TEST-KEY-002',
      licenseType: 'trial' as const,
      maxActivations: 1,
      features: { basic: true },
      issuedAt: new Date().toISOString(),
    };

    const signed = await signer.signLicense(licenseData, keyPair.privateKey);

    // Tamper with data
    signed.data.maxActivations = 999;

    const isValid = await signer.verifyLicense(signed, keyPair.publicKey);
    expect(isValid).toBe(false);
  });

  it('should reject expired license', async () => {
    const licenseData = {
      productId: 'prod_123',
      licenseKey: 'TEST-KEY-003',
      licenseType: 'trial' as const,
      maxActivations: 1,
      features: { basic: true },
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 sec ago
      issuedAt: new Date().toISOString(),
    };

    const signed = await signer.signLicense(licenseData, keyPair.privateKey);
    const isValid = await signer.verifyLicense(signed, keyPair.publicKey);

    expect(isValid).toBe(false);
  });

  it('should create and verify offline certificate', async () => {
    const licenseData = {
      productId: 'prod_123',
      licenseKey: 'TEST-KEY-004',
      licenseType: 'perpetual' as const,
      maxActivations: 10,
      features: { basic: true, advanced: true },
      issuedAt: new Date().toISOString(),
    };

    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const certificate = await signer.createOfflineCertificate(
      licenseData,
      keyPair.privateKey,
      validUntil
    );

    expect(certificate).toBeTruthy();

    const result = await signer.verifyOfflineCertificate(
      certificate,
      keyPair.publicKey
    );

    expect(result.valid).toBe(true);
    expect(result.data?.licenseKey).toBe('TEST-KEY-004');
  });

  it('should generate consistent hardware fingerprint', async () => {
    const components = ['CPU-123', 'MAC-00:11:22', 'DISK-456'];

    const fp1 = await signer.generateFingerprint(components);
    const fp2 = await signer.generateFingerprint(components);

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64); // 32 bytes = 64 hex chars
  });
});
