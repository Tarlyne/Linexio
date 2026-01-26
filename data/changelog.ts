import { ChangelogData } from '../context/types';

export const CHANGELOG: ChangelogData = {
  "_comment": "Hinweis: Wir behalten künftig nur die letzten 3 Versionen im Verlauf, um die Datei übersichtlich zu halten.",
  "versions": [
    {
      "version": "0.9.80-alpha",
      "date": "2026-01-05",
      "changes": [
        "Visuals: Neuer, eleganter Pre-Loader mit 'Scanning Glow'-Animation für einen hochwertigen App-Start.",
        "UX: Optimierter Startvorgang durch einen künstlichen 'Atemzug' (2 Sek.) für verbesserte wahrgenommene Stabilität.",
        "System: Radikale Vereinfachung des iOS-Splash-Systems für alle iPad-Größen.",
        "PWA: Verbesserte Icons für Windows und Android-Geräte.",
        "Notizen: Verfeinerung der Kategorien-Verwaltung und Layout-Optimierung."
      ]
    },
    {
      "version": "0.9.78-alpha",
      "date": "2026-01-04",
      "changes": [
        "PDF-Export: Vertikale Positionierung bei kombinierten Berichten korrigiert (kein Überlaufen mehr).",
        "Refactoring: Vollständiges Daten-Mapping für Sekundärberichte (Aufgabenpunkte & Einzelnoten werden nun korrekt zugeordnet).",
        "Stabilität: Interne Datenflüsse zwischen Vorschau und Export synchronisiert."
      ]
    },
    {
      "version": "0.9.75-alpha",
      "date": "2025-12-11",
      "changes": [
        "UI: Splash-Screens für alle iPad-Größen optimiert (keine Verzerrungen mehr).",
        "System: Aggressiver Update-Check – Die App erkennt Updates nun zuverlässiger und schneller.",
        "Fix: Darstellung auf kleineren iPads verbessert."
      ]
    }
  ]
};