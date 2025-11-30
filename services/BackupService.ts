import { db } from '../store/db';
import { DB_KEYS, LAST_BACKUP_TIMESTAMP_KEY } from '../store/keys';
import { encrypt, decrypt, deriveKey, generateSalt, toBase64, fromBase64 } from '../store/crypto';
import { CURRENT_DB_VERSION } from '../store/migration';

const BACKUP_FILE_VERSION = 3; // Version 3: Added appVersion and dbVersion
const BACKUP_FILE_EXTENSION = 'linexb';

interface EncryptedPayloadV2 {
    iv: string;
    salt: string;
    encryptedData: string;
}

interface BackupData {
    version: number;
    appVersion: string;
    dbVersion: number;
    timestamp: number;
    data: { [key: string]: any };
}

export const createBackup = async (password: string, appVersion: string): Promise<void> => {
    if (!password) {
        throw new Error('Für das Backup ist ein Passwort erforderlich.');
    }

    try {
        const backupData: BackupData = {
            version: BACKUP_FILE_VERSION,
            appVersion,
            dbVersion: CURRENT_DB_VERSION,
            timestamp: Date.now(),
            data: {},
        };

        for (const key of DB_KEYS) {
            backupData.data[key] = await db.get(key);
        }

        const jsonString = JSON.stringify(backupData);
        
        const salt = generateSalt();
        const key = await deriveKey(password, salt);
        const { iv, encryptedData } = await encrypt(jsonString, key);
        
        const encryptedPayload: EncryptedPayloadV2 = { 
            iv, 
            encryptedData,
            salt: toBase64(salt)
        };
        
        const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });

        const date = new Date();
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const fileName = `Linexio-Backup-${dateString}.${BACKUP_FILE_EXTENSION}`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        await db.set(LAST_BACKUP_TIMESTAMP_KEY, Date.now());

    } catch (error) {
        console.error("Fehler beim Erstellen des Backups:", error);
        throw new Error("Backup konnte nicht erstellt werden.");
    }
};

type CheckResult = 
    | { status: 'SUCCESS'; data: any }
    | { status: 'MISMATCH_NORMAL'; data: any; backupVersion: string }
    | { status: 'MISMATCH_DANGEROUS'; backupVersion: string }
    | { status: 'ERROR'; message: string };

export const checkBackupFile = async (file: File, password: string): Promise<CheckResult> => {
    try {
        if (!password) {
            return { status: 'ERROR', message: 'Für die Wiederherstellung ist ein Passwort erforderlich.' };
        }
        
        const fileContent = await file.text();
        const payload = JSON.parse(fileContent);

        let decryptedString: string | null;

        // V2/V3 Backup with per-backup password
        if (payload.salt && payload.iv && payload.encryptedData) {
            const salt = fromBase64(payload.salt);
            const key = await deriveKey(password, salt);
            decryptedString = await decrypt(payload.encryptedData, payload.iv, key);
            if (decryptedString === null) {
                return { status: 'ERROR', message: "Das eingegebene Passwort ist falsch." };
            }
        } else {
            // V1 legacy or invalid format
            return { status: 'ERROR', message: "Veraltetes oder ungültiges Backup-Format." };
        }
        
        const backupData: BackupData = JSON.parse(decryptedString);

        if (!backupData.data || !backupData.dbVersion || !backupData.appVersion) {
            return { status: 'ERROR', message: "Die Backup-Datei ist unvollständig oder beschädigt." };
        }

        if (backupData.dbVersion > CURRENT_DB_VERSION) {
            return { status: 'MISMATCH_DANGEROUS', backupVersion: backupData.appVersion };
        }

        if (backupData.dbVersion < CURRENT_DB_VERSION) {
            return { status: 'MISMATCH_NORMAL', data: backupData, backupVersion: backupData.appVersion };
        }

        return { status: 'SUCCESS', data: backupData };

    } catch (error: any) {
        console.error("Fehler bei der Überprüfung der Backup-Datei:", error);
        return { status: 'ERROR', message: "Überprüfung fehlgeschlagen. Die Datei ist möglicherweise beschädigt." };
    }
};


export const applyBackupData = async (backupData: BackupData): Promise<void> => {
    try {
        // Ensure all keys are present before starting the import
        if (!DB_KEYS.every(key => key in backupData.data)) {
            throw new Error("Backup-Daten sind unvollständig.");
        }

        for (const key of DB_KEYS) {
            await db.set(key, backupData.data[key]);
        }
        
        await db.set(LAST_BACKUP_TIMESTAMP_KEY, backupData.timestamp);
    } catch (error) {
        console.error("Fehler beim Anwenden der Backup-Daten:", error);
        throw new Error("Fehler beim Schreiben der wiederhergestellten Daten.");
    }
};