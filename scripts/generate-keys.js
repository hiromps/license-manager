#!/usr/bin/env node

/**
 * Generate Ed25519 key pair for license signing
 * Usage: node scripts/generate-keys.js
 */

const path = require('path');

// Try to load libsodium-wrappers from packages/crypto
let sodium;
try {
  sodium = require('libsodium-wrappers');
} catch (err) {
  console.error('❌ Error: libsodium-wrappers not found.');
  console.error('\n📦 Please install dependencies first:');
  console.error('   pnpm install\n');
  process.exit(1);
}

(async () => {
  try {
    await sodium.ready;

    console.log('🔐 Generating Ed25519 Key Pair for License Signing...\n');

    const keys = sodium.crypto_sign_keypair();

    const publicKey = sodium.to_base64(keys.publicKey);
    const privateKey = sodium.to_base64(keys.privateKey);

    console.log('✅ Keys generated successfully!\n');
    console.log('📋 Copy these to your .env file or Vercel Environment Variables:\n');
    console.log('LICENSE_PUBLIC_KEY=' + publicKey);
    console.log('LICENSE_PRIVATE_KEY=' + privateKey);
    console.log('\n⚠️  IMPORTANT: Keep the private key secret and secure!');
    console.log('   Never commit private keys to version control.\n');

  } catch (error) {
    console.error('❌ Error generating keys:', error);
    process.exit(1);
  }
})();
