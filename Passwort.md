# Linexio Security Core: Passwort-Logik & Verschlüsselung

Dieses Dokument beschreibt das kryptografische System von Linexio. Wenn dieses System in einem anderen Projekt implementiert wird, müssen diese Dateien exakt so zusammenarbeiten.

## 1. Die drei goldenen Regeln (Warum es oft scheitert)

1.  **Der Salt-Fehler:** Beim ersten Setzen des Passworts wird ein zufälliger `Salt` generiert und gespeichert. Beim späteren Login **darf kein neuer Salt** generiert werden. Es muss zwingend der gespeicherte Salt aus der Datenbank geladen werden, um den identischen Schlüssel abzuleiten.
2.  **Buffer vs. String:** Die Web Crypto API arbeitet mit `Uint8Array`. Localforage oder LocalStorage können damit oft nicht sauber umgehen. Die Konvertierung nach **Base64** ist der einzig sichere Weg für die Speicherung.
3.  **Die Check-Variable:** Um zu prüfen, ob ein Passwort korrekt ist, verschlüsseln wir beim Setup einen festen String (z.B. "JSON_VERIFY"). Beim Login versuchen wir diesen zu entschlüsseln. Schlägt die Entschlüsselung fehl oder kommt ein falscher String raus, war das Passwort falsch.

---

## 2. Core-Modul: `crypto.ts`
Diese Datei enthält die mathematischen Funktionen. Sie ist zuständig für die Ableitung des Schlüssels (PBKDF2) und die AES-GCM Verschlüsselung.

```typescript
// Hilfsfunktionen für Base64 (da Buffer im Browser nicht existiert)
export function toBase64(arr: Uint8Array | ArrayBuffer): string {
    const bytes = new Uint8Array(arr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function fromBase64(str: string): Uint8Array {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const ITERATIONS = 200000;

// Leitet einen CryptoKey aus dem Passwort und dem Salt ab
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string, key: CryptoKey): Promise<{ iv: string; encryptedData: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );
  return { iv: toBase64(iv), encryptedData: toBase64(encryptedData) };
}

export async function decrypt(encryptedData: string, iv: string, key: CryptoKey): Promise<string | null> {
  try {
    const dec = new TextDecoder();
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      key,
      fromBase64(encryptedData)
    );
    return dec.decode(decryptedData);
  } catch (e) {
    return null; // Passwort falsch oder Daten korrupt
  }
}
```

---

## 3. Daten-Store: `securityStore.ts`
Hier wird der Zustand verwaltet. Wichtig: Der `masterKey` existiert nur im RAM, niemals in der DB!

```typescript
let masterKey: CryptoKey | null = null;

// Passwort initial setzen (beim ersten App-Start)
async function setPassword(password: string) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    
    // Salt für später speichern
    await db.set('master_key_salt', toBase64(salt));

    // Prüf-Wert verschlüsseln und speichern
    const { iv, encryptedData } = await encrypt('VERIFY', key);
    await db.set('encryption_check', { iv, encryptedData });
    
    masterKey = key;
}

// Passwort prüfen (beim Login)
async function verifyPassword(password: string): Promise<boolean> {
    const saltString = await db.get<string>('master_key_salt');
    const checkData = await db.get<{ iv: string, encryptedData: string }>('encryption_check');
    
    if (!saltString || !checkData) return false;

    const salt = fromBase64(saltString);
    const key = await deriveKey(password, salt);
    
    // Versuchen, den Prüf-Wert zu entschlüsseln
    const decrypted = await decrypt(checkData.encryptedData, checkData.iv, key);

    if (decrypted === 'VERIFY') {
        masterKey = key; // Schlüssel für die Sitzung im RAM halten
        return true;
    }
    return false;
}
```

---

## 4. State Machine: `SecurityContext.tsx`
Der Context steuert, was der Nutzer sieht.

1.  **INITIALIZING:** Schaut in die DB, ob `master_key_salt` existiert.
2.  **SETTING_PASSWORD:** Wenn kein Salt da ist -> Zeige Formular für neues PW (2 Felder).
3.  **LOCKED:** Wenn Salt da ist -> Zeige Login (1 Feld).
4.  **UNLOCKED:** Wenn `verifyPassword` true ergibt.

**Pro-Tipp für das andere Projekt:** 
Prüfen Sie mit den Browser-DevTools (Application -> IndexedDB), ob nach dem Setup `master_key_salt` und `encryption_check` wirklich befüllt sind. Wenn ja, liegt der Fehler meist in der `deriveKey`-Funktion (z.B. unterschiedliche Iterations-Zahlen in Setup und Login).
