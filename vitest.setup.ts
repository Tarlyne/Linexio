import { beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import 'fake-indexeddb/auto';

beforeAll(() => {
    // Polyfill window.crypto for tests
    if (typeof window !== 'undefined' && !window.crypto) {
        Object.defineProperty(window, 'crypto', {
            value: webcrypto,
        });
    }
});
