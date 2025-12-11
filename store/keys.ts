// store/keys.ts

/**
 * ARCHITEKTONISCHES MEMORANDUM: Zentrale DB-Schlüsselverwaltung
 *
 * Zweck:
 * Diese Datei dient als "Single Source of Truth" für alle Schlüssel, die in der
 * IndexedDB (via localforage) verwendet werden.
 *
 * Problem, das gelöst wird:
 * Vorher waren die Schlüsselnamen als String-Literale dezentral in den jeweiligen
 * `store`-Dateien verteilt. Dies war fehleranfällig und erschwerte die Wartung.
 * Insbesondere für globale Funktionen wie Backup/Restore, die alle Daten kennen müssen,
 * war das manuelle Sammeln der Schlüsselnamen nicht nachhaltig.
 *
 * Implementierung:
 * Ein einfaches Array von Strings (`DB_KEYS`) wird exportiert. Jeder Store importiert
 * dieses Array bzw. die einzelnen Schlüsselkonstanten und verwendet sie für DB-Operationen.
 * Der `BackupService` importiert das gesamte `DB_KEYS`-Array, um sicherzustellen,
 * dass alle relevanten Daten in die Sicherung einfließen.
 *
 * Wartung:
 * Wenn ein neuer Datentyp (und damit ein neuer Store) hinzugefügt wird, MUSS der
 * entsprechende DB-Schlüssel hier registriert werden, um seine Berücksichtigung
 * im Backup-Prozess zu garantieren.
 */

export const LERGRUPPEN_KEY = 'lerngruppen';
export const SCHUELER_KEY = 'schueler';
export const NOTENKATEGORIEN_KEY = 'notenkategorien';
export const LEISTUNGSNACHWEISE_KEY = 'leistungsnachweise';
export const EINZELLEISTUNGEN_KEY = 'einzelLeistungen';
export const EINZELLEISTUNGSNOTEN_KEY = 'einzelLeistungsNoten';
export const KLAUSURAUFGABENPUNKTE_KEY = 'klausuraufgabePunkte';
export const NOTENSCHLUESSEL_MAP_KEY = 'notenschluesselMap';
export const MANUELLE_NOTEN_KEY = 'manuelleNoten';
export const SCHUELER_LN_FEEDBACK_KEY = 'schuelerLeistungsnachweisFeedback';
export const PICKED_SCHUELER_KEY = 'pickedSchueler';
export const CHECKLISTEN_KEY = 'checklisten';
export const CHECKLISTEN_EINTRAEGE_KEY = 'checklistenEintraege';
export const CHECKLISTEN_STATI_KEY = 'checklistenStati';
export const SITZPLAENE_KEY = 'sitzplaene';
export const GRUPPEN_EINTEILUNGEN_KEY = 'gruppenEinteilungen'; // NEU
export const NOTIZEN_KEY = 'notizen';
export const NOTIZ_KATEGORIEN_KEY = 'notizKategorien';
export const TERMINE_KEY = 'termine';
export const LAST_BACKUP_TIMESTAMP_KEY = 'last_backup_timestamp';
export const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
export const LICENSE_STATUS_KEY = 'license_status';
export const LICENSE_OWNER_KEY = 'license_owner';


// Array aller Schlüssel für Backup/Restore
export const DB_KEYS = [
    LERGRUPPEN_KEY,
    SCHUELER_KEY,
    NOTENKATEGORIEN_KEY,
    LEISTUNGSNACHWEISE_KEY,
    EINZELLEISTUNGEN_KEY,
    EINZELLEISTUNGSNOTEN_KEY,
    KLAUSURAUFGABENPUNKTE_KEY,
    NOTENSCHLUESSEL_MAP_KEY,
    MANUELLE_NOTEN_KEY,
    SCHUELER_LN_FEEDBACK_KEY,
    PICKED_SCHUELER_KEY,
    CHECKLISTEN_KEY,
    CHECKLISTEN_EINTRAEGE_KEY,
    CHECKLISTEN_STATI_KEY,
    SITZPLAENE_KEY,
    GRUPPEN_EINTEILUNGEN_KEY, // NEU
    NOTIZEN_KEY,
    NOTIZ_KATEGORIEN_KEY,
    TERMINE_KEY,
    BIOMETRICS_ENABLED_KEY,
    LAST_BACKUP_TIMESTAMP_KEY,
    LICENSE_STATUS_KEY,
    LICENSE_OWNER_KEY,
];