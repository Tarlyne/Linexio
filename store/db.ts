import localforage from 'localforage';
import { seedDemoData } from './demoData';
import { LERGRUPPEN_KEY, SCHUELER_KEY, NOTENKATEGORIEN_KEY, LEISTUNGSNACHWEISE_KEY, EINZELLEISTUNGEN_KEY, EINZELLEISTUNGSNOTEN_KEY, KLAUSURAUFGABENPUNKTE_KEY, CHECKLISTEN_KEY, CHECKLISTEN_EINTRAEGE_KEY, CHECKLISTEN_STATI_KEY, TERMINE_KEY } from './keys';
import { Lerngruppe, Schueler, Notenkategorie, Leistungsnachweis, EinzelLeistung, EinzelLeistungsNote, KlausuraufgabePunkte } from '../context/types';

localforage.config({
  name: 'LinexioDB',
  driver: localforage.INDEXEDDB,
  storeName: 'linexio_store',
  description: 'Linexio application data store'
});

export const db = {
  get: <T>(key: string): Promise<T | null> => {
    return localforage.getItem<T>(key);
  },
  set: <T>(key: string, value: T): Promise<T> => {
    return localforage.setItem<T>(key, value);
  },
  initAndSeedDatabase: async (): Promise<boolean> => {
    const isPasswordSet = await localforage.getItem('master_key_salt') !== null;
    if (isPasswordSet) {
      // The app has been used before, don't seed.
      return false;
    }
    
    // First time setup, seed demo data.
    const demoData = seedDemoData();

    await localforage.setItem(LERGRUPPEN_KEY, demoData.lerngruppen);
    await localforage.setItem(SCHUELER_KEY, demoData.schueler);
    await localforage.setItem(NOTENKATEGORIEN_KEY, demoData.notenkategorien);
    await localforage.setItem(LEISTUNGSNACHWEISE_KEY, demoData.leistungsnachweise);
    await localforage.setItem(EINZELLEISTUNGEN_KEY, demoData.einzelLeistungen);
    await localforage.setItem(EINZELLEISTUNGSNOTEN_KEY, demoData.einzelLeistungsNoten);
    await localforage.setItem(KLAUSURAUFGABENPUNKTE_KEY, demoData.klausuraufgabePunkte);
    await localforage.setItem(CHECKLISTEN_KEY, demoData.checklisten);
    await localforage.setItem(CHECKLISTEN_EINTRAEGE_KEY, demoData.checklistenEintraege);
    await localforage.setItem(CHECKLISTEN_STATI_KEY, demoData.checklistenStati);
    await localforage.setItem(TERMINE_KEY, []); // Empty array for new feature
    
    console.log('Demo data seeded.');
    return true;
  }
};
