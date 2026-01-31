// store/crypto.test.ts

import { describe, it, expect } from 'vitest';
import {
  toBase64,
  fromBase64,
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  generateMnemonic,
  mnemonicToHash,
} from './crypto';
import { GERMAN_WORD_LIST } from '../data/bip39_wordlist_german';

describe('Crypto Utilities', () => {

  // Test 1: Base64 encoding/decoding
  it('sollte Daten korrekt nach Base64 kodieren und wieder dekodieren', () => {
    const originalString = 'Hallo Welt! Dies ist ein Test.';
    const encoder = new TextEncoder();
    const data = encoder.encode(originalString);

    const base64 = toBase64(data);
    const decodedData = fromBase64(base64);
    const decodedString = new TextDecoder().decode(decodedData);

    expect(base64).not.toBe(originalString);
    expect(decodedString).toBe(originalString);
    expect(decodedData).toEqual(data);
  });

  // Test 2: Key Derivation
  it('sollte einen gültigen CryptoKey aus einem Passwort ableiten', async () => {
    const password = 'mein-sicheres-passwort';
    const salt = generateSalt();
    const key = await deriveKey(password, salt);

    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm.name).toBe('AES-GCM');
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
  });

  // Test 3: Encrypt/Decrypt Symmetric Test
  it('sollte Daten korrekt ver- und entschlüsseln', async () => {
    const password = 'mein-sicheres-passwort';
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    const secretMessage = 'Dies ist eine geheime Nachricht!';

    const { iv, encryptedData } = await encrypt(secretMessage, key);

    // Decrypt with correct key
    const decryptedMessage = await decrypt(encryptedData, iv, key);
    expect(decryptedMessage).toBe(secretMessage);
  });

  // Test 4: Decrypt with wrong key
  it('sollte null zurückgeben, wenn mit einem falschen Schlüssel entschlüsselt wird', async () => {
    const correctPassword = 'richtiges-passwort';
    const wrongPassword = 'falsches-passwort';
    const salt = generateSalt();

    const correctKey = await deriveKey(correctPassword, salt);
    const wrongKey = await deriveKey(wrongPassword, salt);
    
    const secretMessage = 'Noch eine geheime Nachricht.';
    const { iv, encryptedData } = await encrypt(secretMessage, correctKey);

    // Attempt to decrypt with the wrong key
    const decryptedMessage = await decrypt(encryptedData, iv, wrongKey);
    expect(decryptedMessage).toBeNull();
  });
  
  // Test 5: Mnemonic Generation
  it('sollte eine 12-Wörter-Mnemonik aus der deutschen Wortliste generieren', () => {
    const mnemonic = generateMnemonic();
    expect(mnemonic).toBeInstanceOf(Array);
    expect(mnemonic.length).toBe(12);
    // Check if all generated words are in the official list
    mnemonic.forEach(word => {
      expect(GERMAN_WORD_LIST).toContain(word);
    });
  });

  // Test 6: Mnemonic Hashing
  it('sollte eine Mnemonik konsistent hashen', async () => {
    const mnemonic1 = ['apfel', 'birne', 'kirsche', 'banane', 'orange', 'zitrone', 'melone', 'traube', 'ananas', 'mango', 'pfirsich', 'pflaume'];
    const mnemonic2 = ['haus', 'boot', 'auto', 'fahrrad', 'bus', 'zug', 'flugzeug', 'rakete', 'schiff', 'motorrad', 'roller', 'zeppelin'];
    
    const hash1_a = await mnemonicToHash(mnemonic1);
    const hash1_b = await mnemonicToHash(mnemonic1); // Same mnemonic again
    const hash2 = await mnemonicToHash(mnemonic2);

    expect(hash1_a).toBe(hash1_b); // Same input must produce same hash
    expect(hash1_a).not.toBe(hash2); // Different inputs must produce different hashes
    expect(hash1_a.length).toBeGreaterThan(20); // Should be a valid base64 hash
  });
});
