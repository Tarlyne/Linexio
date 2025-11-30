import { Termin } from '../context/types';

export function calculateEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

// Mapping: Bundesland-Kürzel -> Array erlaubter Feiertags-Schlüssel
export const FEIERTAGE_REGELN: Record<string, string[]> = {
  'BW': ['heilige_drei_koenige', 'fronleichnam', 'allerheiligen'],
  'BY': ['heilige_drei_koenige', 'fronleichnam', 'mariä_himmelfahrt', 'allerheiligen'],
  'BE': ['frauentag'],
  'BB': ['reformationstag'],
  'HB': ['reformationstag'],
  'HH': ['reformationstag'],
  'HE': ['fronleichnam'],
  'MV': ['frauentag', 'reformationstag'],
  'NI': ['reformationstag'],
  'NW': ['fronleichnam', 'allerheiligen'],
  'RP': ['fronleichnam', 'allerheiligen'],
  'SL': ['fronleichnam', 'mariä_himmelfahrt', 'allerheiligen'],
  'SN': ['reformationstag', 'buss_und_bettag'],
  'ST': ['heilige_drei_koenige', 'reformationstag'],
  'SH': ['reformationstag'],
  'TH': ['weltkindertag', 'reformationstag'],
};

export function getFeiertage(year: number, bundesland: string | null): Termin[] {
  const feiertage: Termin[] = [];
  const rules = bundesland ? (FEIERTAGE_REGELN[bundesland] || []) : [];
  
  const add = (date: Date, title: string, idSuffix: string) => {
    const dateString = [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0')
    ].join('-');

    feiertage.push({
      id: `feiertag-${dateString}-${idSuffix}`,
      title,
      date: dateString,
      startTime: '00:00', // Dummy time
      kategorie: 'SONSTIGES',
      schuljahr: '', // Not relevant for ephemeral display
      isFeiertag: true,
    });
  };

  // --- Feste Feiertage ---
  add(new Date(year, 0, 1), 'Neujahr', 'neujahr');
  add(new Date(year, 4, 1), 'Tag der Arbeit', 'tag_der_arbeit');
  add(new Date(year, 9, 3), 'Tag der Deutschen Einheit', 'tag_der_einheit');
  add(new Date(year, 11, 25), '1. Weihnachtsfeiertag', 'weihnachten_1');
  add(new Date(year, 11, 26), '2. Weihnachtsfeiertag', 'weihnachten_2');

  // --- Bewegliche Feiertage (Ostern) ---
  const easter = calculateEasterDate(year);
  const ostersonntag = new Date(easter.getTime());
  
  const karfreitag = new Date(ostersonntag.getTime());
  karfreitag.setDate(karfreitag.getDate() - 2);
  add(karfreitag, 'Karfreitag', 'karfreitag');

  const ostermontag = new Date(ostersonntag.getTime());
  ostermontag.setDate(ostermontag.getDate() + 1);
  add(ostermontag, 'Ostermontag', 'ostermontag');
  
  const christiHimmelfahrt = new Date(ostersonntag.getTime());
  christiHimmelfahrt.setDate(christiHimmelfahrt.getDate() + 39);
  add(christiHimmelfahrt, 'Christi Himmelfahrt', 'himmelfahrt');
  
  const pfingstmontag = new Date(ostersonntag.getTime());
  pfingstmontag.setDate(pfingstmontag.getDate() + 50);
  add(pfingstmontag, 'Pfingstmontag', 'pfingstmontag');

  // --- Bundeslandspezifisch ---
  
  if (rules.includes('heilige_drei_koenige')) {
      add(new Date(year, 0, 6), 'Heilige Drei Könige', 'h3k');
  }
  
  if (rules.includes('frauentag')) {
      add(new Date(year, 2, 8), 'Internationaler Frauentag', 'frauentag');
  }
  
  if (rules.includes('fronleichnam')) {
      const fronleichnam = new Date(ostersonntag.getTime());
      fronleichnam.setDate(fronleichnam.getDate() + 60);
      add(fronleichnam, 'Fronleichnam', 'fronleichnam');
  }
  
  if (rules.includes('mariä_himmelfahrt')) {
      add(new Date(year, 7, 15), 'Mariä Himmelfahrt', 'mariae_himmelfahrt');
  }

  if (rules.includes('weltkindertag')) {
      add(new Date(year, 8, 20), 'Weltkindertag', 'weltkindertag');
  }

  if (rules.includes('reformationstag')) {
      add(new Date(year, 9, 31), 'Reformationstag', 'reformationstag');
  }
  
  if (rules.includes('allerheiligen')) {
      add(new Date(year, 10, 1), 'Allerheiligen', 'allerheiligen');
  }
  
  if (rules.includes('buss_und_bettag')) {
      // Buß- und Bettag: Mittwoch vor dem 23. November
      // Wir suchen den 23. Nov und gehen zurück zum vorherigen Mittwoch
      let d = new Date(year, 10, 22); // Startsuche ab 22. Nov rückwärts
      while (d.getDay() !== 3) { // 3 = Mittwoch
          d.setDate(d.getDate() - 1);
      }
      add(d, 'Buß- und Bettag', 'buss_bettag');
  }

  return feiertage;
}