import { db } from './db';
import { Lerngruppe, Schueler, Notenkategorie, Leistungsnachweis, EinzelLeistung, EinzelLeistungsNote, KlausuraufgabePunkte, NotenschluesselMap, Checkliste, ChecklistenEintrag, ChecklistenStatusValue, Sitzplan, DEFAULT_NOTENSCHLUESSEL_MAP, ManuelleNote, SchuelerLeistungsnachweisFeedback, Termin } from '../context/types';
import {
    LERGRUPPEN_KEY, SCHUELER_KEY, NOTENKATEGORIEN_KEY, LEISTUNGSNACHWEISE_KEY,
    EINZELLEISTUNGEN_KEY, EINZELLEISTUNGSNOTEN_KEY, KLAUSURAUFGABENPUNKTE_KEY,
    NOTENSCHLUESSEL_MAP_KEY, PICKED_SCHUELER_KEY, CHECKLISTEN_KEY, CHECKLISTEN_EINTRAEGE_KEY,
    CHECKLISTEN_STATI_KEY, SITZPLAENE_KEY, MANUELLE_NOTEN_KEY, SCHUELER_LN_FEEDBACK_KEY, TERMINE_KEY
} from './keys';


export const CURRENT_DB_VERSION = 6;

// A type for the entire database state
type AppData = {
    lerngruppen: Lerngruppe[];
    schueler: Schueler[];
    notenkategorien: Notenkategorie[];
    leistungsnachweise: Leistungsnachweis[];
    einzelLeistungen: EinzelLeistung[];
    einzelLeistungsNoten: EinzelLeistungsNote[];
    klausuraufgabePunkte: KlausuraufgabePunkte[];
    notenschluesselMap: NotenschluesselMap;
    pickedSchuelerIds: { [key: string]: string[] };
    checklisten: Checkliste[];
    checklistenEintraege: ChecklistenEintrag[];
    checklistenStati: { [eintragId: string]: { [schuelerId: string]: ChecklistenStatusValue } };
    sitzplaene: Sitzplan[];
    manuelleNoten: ManuelleNote[];
    schuelerLeistungsnachweisFeedback: SchuelerLeistungsnachweisFeedback[];
    termine: Termin[];
};

// Type for a migration function
type Migration = (data: AppData) => AppData;

// --- MIGRATION SCRIPTS ---
// Each key is the version it migrates TO. So `1` migrates from `0` to `1`.
const migrations: { [version: number]: Migration } = {
    1: (data) => {
        console.log('Running migration to v1: Adding default weights to Lerngruppen.');
        const migratedLerngruppen = data.lerngruppen.map(lg => {
            if (lg.gewichtungHj1 === undefined || lg.gewichtungHj2 === undefined) {
                return { ...lg, gewichtungHj1: lg.gewichtungHj1 ?? 1, gewichtungHj2: lg.gewichtungHj2 ?? 1 };
            }
            return lg;
        });
        return { ...data, lerngruppen: migratedLerngruppen };
    },
    2: (data) => {
        console.log('Running migration to v2: Repairing empty NotenschluesselMap.');
        // This specifically fixes the bug where an empty object was saved instead of the default.
        if (!data.notenschluesselMap || Object.keys(data.notenschluesselMap).length === 0) {
            return { ...data, notenschluesselMap: DEFAULT_NOTENSCHLUESSEL_MAP };
        }
        return data; // If the map exists and is not empty, do nothing.
    },
    3: (data) => {
        console.log('Running migration to v3: Adding manuelleNoten table.');
        // The table is created by the presence of `manuelleNoten` in AppData and init call.
        // We just need to ensure the data structure is correct.
        return { ...data, manuelleNoten: data.manuelleNoten || [] };
    },
    4: (data) => {
        console.log('Running migration to v4: Adding schuelerLeistungsnachweisFeedback table.');
        return { ...data, schuelerLeistungsnachweisFeedback: data.schuelerLeistungsnachweisFeedback || [] };
    },
    5: (data) => {
        console.log('Running migration to v5: Migrating to n-m student-group relationship.');

        // Type assertions for legacy data
        type LegacySchueler = Schueler & { lerngruppeId?: string };
        type LegacyLerngruppe = Lerngruppe & { schuelerIds?: string[] };

        const { schueler: legacySchuelerData, lerngruppen: legacyLerngruppenData } = data;

        // 1. Initialize schuelerIds array on all lerngruppen
        const lerngruppenMap = new Map<string, LegacyLerngruppe>();
        (legacyLerngruppenData as LegacyLerngruppe[]).forEach(lg => {
            const newLg = { ...lg };
            if (!newLg.schuelerIds) {
                newLg.schuelerIds = [];
            }
            lerngruppenMap.set(newLg.id, newLg);
        });

        // 2. Populate schuelerIds from old schueler.lerngruppeId
        (legacySchuelerData as LegacySchueler[]).forEach(s => {
            if (s.lerngruppeId) {
                const lerngruppe = lerngruppenMap.get(s.lerngruppeId);
                if (lerngruppe && lerngruppe.schuelerIds && !lerngruppe.schuelerIds.includes(s.id)) {
                    lerngruppe.schuelerIds.push(s.id);
                }
            }
        });

        const migratedLerngruppen: Lerngruppe[] = Array.from(lerngruppenMap.values());

        // 3. Remove lerngruppeId from schueler
        const migratedSchueler: Schueler[] = (legacySchuelerData as LegacySchueler[]).map(s => {
            const { lerngruppeId, ...rest } = s;
            return rest as Schueler;
        });

        return { 
            ...data, 
            lerngruppen: migratedLerngruppen,
            schueler: migratedSchueler,
        };
    },
    6: (data) => {
        console.log('Running migration to v6: Adding termine table.');
        return { ...data, termine: data.termine || [] };
    }
};

// --- MIGRATION ENGINE ---

export const runMigrations = async (): Promise<void> => {
    const storedVersion = await db.get<number>('db_version') || 0;

    if (storedVersion >= CURRENT_DB_VERSION) {
        console.log(`Database is up to date (v${storedVersion}). No migration needed.`);
        return;
    }

    console.log(`Database version is ${storedVersion}. Migrating to ${CURRENT_DB_VERSION}...`);

    // 1. Load all data from DB
    let currentData: AppData = {
        lerngruppen: await db.get(LERGRUPPEN_KEY) || [],
        schueler: await db.get(SCHUELER_KEY) || [],
        notenkategorien: await db.get(NOTENKATEGORIEN_KEY) || [],
        leistungsnachweise: await db.get(LEISTUNGSNACHWEISE_KEY) || [],
        einzelLeistungen: await db.get(EINZELLEISTUNGEN_KEY) || [],
        einzelLeistungsNoten: await db.get(EINZELLEISTUNGSNOTEN_KEY) || [],
        klausuraufgabePunkte: await db.get(KLAUSURAUFGABENPUNKTE_KEY) || [],
        notenschluesselMap: await db.get(NOTENSCHLUESSEL_MAP_KEY) || DEFAULT_NOTENSCHLUESSEL_MAP,
        pickedSchuelerIds: await db.get(PICKED_SCHUELER_KEY) || {},
        checklisten: await db.get(CHECKLISTEN_KEY) || [],
        checklistenEintraege: await db.get(CHECKLISTEN_EINTRAEGE_KEY) || [],
        checklistenStati: await db.get(CHECKLISTEN_STATI_KEY) || {},
        sitzplaene: await db.get(SITZPLAENE_KEY) || [],
        manuelleNoten: await db.get(MANUELLE_NOTEN_KEY) || [],
        schuelerLeistungsnachweisFeedback: await db.get(SCHUELER_LN_FEEDBACK_KEY) || [],
        termine: await db.get(TERMINE_KEY) || [],
    };

    // 2. Run migrations sequentially
    for (let v = storedVersion + 1; v <= CURRENT_DB_VERSION; v++) {
        if (migrations[v]) {
            console.log(`Applying migration v${v}...`);
            currentData = migrations[v](currentData);
        }
    }

    // 3. Persist all migrated data back to DB
    console.log('Persisting migrated data...');
    await db.set(LERGRUPPEN_KEY, currentData.lerngruppen);
    await db.set(SCHUELER_KEY, currentData.schueler);
    await db.set(NOTENKATEGORIEN_KEY, currentData.notenkategorien);
    await db.set(LEISTUNGSNACHWEISE_KEY, currentData.leistungsnachweise);
    await db.set(EINZELLEISTUNGEN_KEY, currentData.einzelLeistungen);
    await db.set(EINZELLEISTUNGSNOTEN_KEY, currentData.einzelLeistungsNoten);
    await db.set(KLAUSURAUFGABENPUNKTE_KEY, currentData.klausuraufgabePunkte);
    await db.set(NOTENSCHLUESSEL_MAP_KEY, currentData.notenschluesselMap);
    await db.set(PICKED_SCHUELER_KEY, currentData.pickedSchuelerIds);
    await db.set(CHECKLISTEN_KEY, currentData.checklisten);
    await db.set(CHECKLISTEN_EINTRAEGE_KEY, currentData.checklistenEintraege);
    await db.set(CHECKLISTEN_STATI_KEY, currentData.checklistenStati);
    await db.set(SITZPLAENE_KEY, currentData.sitzplaene);
    await db.set(MANUELLE_NOTEN_KEY, currentData.manuelleNoten);
    await db.set(SCHUELER_LN_FEEDBACK_KEY, currentData.schuelerLeistungsnachweisFeedback);
    await db.set(TERMINE_KEY, currentData.termine);


    // 4. Update DB version
    await db.set('db_version', CURRENT_DB_VERSION);

    console.log(`Migration complete. Database is now at v${CURRENT_DB_VERSION}.`);
};
