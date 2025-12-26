import { ChangelogData } from '../context/types';

export const CHANGELOG: ChangelogData = {
  "_comment": "Hinweis: Wir behalten künftig nur die letzten 3 Versionen im Verlauf, um die Datei übersichtlich zu halten.",
  "versions": [
    {
      "version": "0.9.75-alpha",
      "date": "2025-12-11",
      "changes": [
        "UI: Splash-Screens für alle iPad-Größen optimiert (keine Verzerrungen mehr).",
        "System: Aggressiver Update-Check – Die App erkennt Updates nun zuverlässiger und schneller.",
        "Fix: Darstellung auf kleineren iPads verbessert."
      ]
    },
    {
      "version": "0.9.74-alpha",
      "date": "2025-12-06",
      "changes": [
        "Feature: Gruppen bewerten! Sie können nun ganzen Gruppen mit einem Klick eine Note geben (Batch-Processing).",
        "Feature: Gruppen bleiben nun gespeichert und können individuell benannt werden.",
        "Fix: Das 'Was ist neu?'-Fenster lädt nun zuverlässig auf allen Geräten (iPad/PWA Fix).",
        "Technik: Interne Optimierungen bei der Notenspeicherung."
      ]
    },
    {
      "version": "0.9.73-alpha",
      "date": "2025-12-05",
      "changes": [
        "Wartungsupdate: Optimierungen und Stabilitätsverbesserungen."
      ]
    }
  ]
};