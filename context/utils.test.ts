import { describe, it, expect } from 'vitest';
import { getSystemSchoolYear } from './utils';

describe('getSystemSchoolYear', () => {

  it('sollte das korrekte Schuljahr für ein Datum im Herbst zurückgeben', () => {
    // Schuljahr 24/25 beginnt im August 2024
    const date = new Date(2024, 8, 15); // 15. September 2024
    expect(getSystemSchoolYear(date)).toBe('24/25');
  });

  it('sollte das korrekte Schuljahr für ein Datum im Frühling zurückgeben', () => {
    // Schuljahr 24/25 geht bis Juli 2025
    const date = new Date(2025, 4, 20); // 20. Mai 2025
    expect(getSystemSchoolYear(date)).toBe('24/25');
  });

  it('sollte das Schuljahr am Stichtag (1. August) korrekt wechseln', () => {
    // Das neue Schuljahr 25/26 beginnt am 1. August 2025
    const date = new Date(2025, 7, 1); // 1. August 2025
    expect(getSystemSchoolYear(date)).toBe('25/26');
  });

  it('sollte das Schuljahr direkt vor dem Stichtag (31. Juli) korrekt beibehalten', () => {
    // Das alte Schuljahr 24/25 endet am 31. Juli 2025
    const date = new Date(2025, 6, 31); // 31. Juli 2025
    expect(getSystemSchoolYear(date)).toBe('24/25');
  });

  it('sollte das korrekte Schuljahr für den Jahresanfang zurückgeben', () => {
    // Januar 2026 gehört noch zum Schuljahr 25/26
    const date = new Date(2026, 0, 10); // 10. Januar 2026
    expect(getSystemSchoolYear(date)).toBe('25/26');
  });

  it('sollte das korrekte Schuljahr für den Jahresende zurückgeben', () => {
    // Dezember 2026 gehört schon zum Schuljahr 26/27
    const date = new Date(2026, 11, 24); // 24. Dezember 2026
    expect(getSystemSchoolYear(date)).toBe('26/27');
  });

});
