// services/BackupService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// FIX: `restoreBackup` is not exported. The functionality is now split into `checkBackupFile` and `applyBackupData`.
import { createBackup, checkBackupFile, applyBackupData } from './BackupService';
import { db } from '../store/db';
import { DB_KEYS, LAST_BACKUP_TIMESTAMP_KEY, SCHUELER_KEY, LERGRUPPEN_KEY } from '../store/keys';
import { securityStore } from '../store/securityStore';
import { deriveKey, encrypt, toBase64, fromBase64 } from '../store/crypto';

// Mock the db module
vi.mock('../store/db', () => ({
  db: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock the securityStore
vi.mock('../store/securityStore', () => ({
  securityStore: {
    getMasterKey: vi.fn(),
  },
}));

describe('BackupService', () => {
  let inMemoryDb: Map<string, any>;
  let linkClickSpy: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Setup in-memory DB
    inMemoryDb = new Map();
    DB_KEYS.forEach(key => {
        inMemoryDb.set(key, { data: `value_for_${key}` });
    });

    // Mock db.get to read from in-memory DB
    (db.get as any).mockImplementation((key: string) => {
      return Promise.resolve(inMemoryDb.get(key));
    });

    // Mock db.set to write to in-memory DB
    (db.set as any).mockImplementation((key: string, value: any) => {
      inMemoryDb.set(key, value);
      return Promise.resolve(value);
    });
    
    // Mock the download link creation
    const link = {
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' }
    };
    linkClickSpy = vi.spyOn(link, 'click');
    vi.spyOn(document, 'createElement').mockReturnValue(link as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // Tests for createBackup
  describe('createBackup', () => {
    it('sollte einen Fehler werfen, wenn kein Passwort angegeben wird', async () => {
        // FIX: The createBackup function now requires an appVersion parameter.
        await expect(createBackup('', '1.0.0')).rejects.toThrow('Für das Backup ist ein Passwort erforderlich.');
    });

    it('sollte ein Backup erstellen und den Download auslösen', async () => {
        // FIX: The createBackup function now requires an appVersion parameter.
        await createBackup('test-password', '1.0.0');
        
        // Check if download was triggered
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(linkClickSpy).toHaveBeenCalled();
        
        // Check if timestamp was set
        expect(db.set).toHaveBeenCalledWith(LAST_BACKUP_TIMESTAMP_KEY, expect.any(Number));
    });

    it('sollte eine korrekte, verschlüsselte Backup-Datei erstellen', async () => {
        let createdBlob: Blob | null = null;
        (window.URL.createObjectURL as any).mockImplementation((blob: Blob) => {
            createdBlob = blob;
            return 'blob:mock-url';
        });

        // FIX: The createBackup function now requires an appVersion parameter.
        await createBackup('test-password', '1.0.0');
        
        expect(createdBlob).not.toBeNull();
        const blobContent = await createdBlob!.text();
        const payload = JSON.parse(blobContent);

        // Check payload structure for V2
        expect(payload).toHaveProperty('iv');
        expect(payload).toHaveProperty('encryptedData');
        expect(payload).toHaveProperty('salt');
    });
  });
  
  // FIX: The `restoreBackup` function was removed and its logic split into `checkBackupFile` and `applyBackupData`.
  // The tests are updated to reflect this new process.
  describe('Backup Restore Process (checkBackupFile & applyBackupData)', () => {
    const password = 'correct-password';
    let backupFile: File;

    beforeEach(async () => {
        // Create a valid backup file for testing
        let createdBlob: Blob | null = null;
        (window.URL.createObjectURL as any).mockImplementation((blob: Blob) => {
            createdBlob = blob;
            return 'blob:mock-url';
        });
        // FIX: The createBackup function now requires an appVersion parameter.
        await createBackup(password, '1.0.0');
        backupFile = new File([await createdBlob!.text()], 'test-backup.linexb', { type: 'application/json' });
    });
    
    it('sollte ein V2-Backup mit korrektem Passwort erfolgreich wiederherstellen', async () => {
        // Clear a value to ensure it gets restored
        inMemoryDb.set(LERGRUPPEN_KEY, null);
        
        // FIX: The restoration process is now two steps: check, then apply.
        const checkResult = await checkBackupFile(backupFile, password);
        expect(checkResult.status).toBe('SUCCESS');

        if (checkResult.status === 'SUCCESS') {
            await applyBackupData(checkResult.data);
        }
        
        expect(inMemoryDb.get(LERGRUPPEN_KEY)).toEqual({ data: `value_for_${LERGRUPPEN_KEY}` });
        expect(inMemoryDb.has(LAST_BACKUP_TIMESTAMP_KEY)).toBe(true);
    });

    it('sollte bei einem falschen Passwort für ein V2-Backup fehlschlagen', async () => {
        // FIX: Use `checkBackupFile` and adapt assertions for the new return type.
        const result = await checkBackupFile(backupFile, 'wrong-password');
        
        expect(result.status).toBe('ERROR');
        if (result.status === 'ERROR') {
            expect(result.message).toBe('Das eingegebene Passwort ist falsch.');
        }
    });

    it('sollte bei einer beschädigten Datei fehlschlagen', async () => {
        const corruptedFile = new File(['{"invalid": "json"'], 'corrupted.linexb', { type: 'application/json' });
        // FIX: Use `checkBackupFile` and adapt assertions. The password argument is now required.
        const result = await checkBackupFile(corruptedFile, password);

        expect(result.status).toBe('ERROR');
        if (result.status === 'ERROR') {
            expect(result.message).toContain('Überprüfung fehlgeschlagen. Die Datei ist möglicherweise beschädigt.');
        }
    });

    it('sollte bei einem unvollständigen Backup fehlschlagen', async () => {
        // Mock db.get to provide incomplete data for the backup creation
        (db.get as any).mockImplementation((key: string) => {
            if (key === LERGRUPPEN_KEY) return Promise.resolve(undefined); // Simulate missing key
            return Promise.resolve({ data: `value_for_${key}` });
        });
        
        let createdBlob: Blob | null = null;
        (window.URL.createObjectURL as any).mockImplementation((blob: Blob) => { createdBlob = blob; return 'blob:mock-url'; });
        
        // FIX: The createBackup function now requires an appVersion parameter.
        await createBackup(password, '1.0.0');
        const incompleteBackupFile = new File([await createdBlob!.text()], 'incomplete.linexb', { type: 'application/json' });

        // FIX: The logic is split. checkBackupFile will succeed, but applyBackupData should fail.
        const checkResult = await checkBackupFile(incompleteBackupFile, password);
        expect(checkResult.status).toBe('SUCCESS'); // checkBackupFile doesn't validate content completeness.
        
        if (checkResult.status === 'SUCCESS') {
            await expect(applyBackupData(checkResult.data)).rejects.toThrow('Backup-Daten sind unvollständig.');
        }
    });
    
    it('sollte ein V1-Backup als veraltet erkennen und ablehnen', async () => {
        // FIX: This test now validates the current behavior, which is to reject old V1 backups.
        vi.spyOn(securityStore, 'getMasterKey').mockReturnValue(null); // Master key is irrelevant for this check.

        // Create a V1 style backup (no salt in payload)
        const v1Payload = { iv: 'dummy', encryptedData: 'dummy' };
        const v1File = new File([JSON.stringify(v1Payload)], 'v1_backup.linexb', { type: 'application/json' });
        
        // FIX: Use `checkBackupFile`. The password can be anything as it will fail on format check.
        const result = await checkBackupFile(v1File, '');
        
        expect(result.status).toBe('ERROR');
        if (result.status === 'ERROR') {
            expect(result.message).toContain('Veraltetes oder ungültiges Backup-Format.');
        }
    });
  });
});
