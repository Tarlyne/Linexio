# LinexioAbi: Die Source of Truth (V1.1)

Dieses Dokument ist das architektonische Gesetz für das Projekt **LinexioAbi**. Es kombiniert die visuelle Identität von Linexio mit der komplexen Logik der Abitur-Prüfungsplanung.

---

## 1. Technisches Fundament (Design-DNA)

### 1.1. Visuelle Identität & Farben
- **Theme:** Aurora Nocturne (Dunkelblau/Grau mit Cyan-Akzenten).
- **Farbsystem:** Nutzung der CSS-Variablen aus der Linexio Marken-Bibel (Vordergrund: `--color-ui-primary`, Akzent: `--color-accent-primary`).

### 1.2. Hintergrund-Logik (Performance-First)
- **Login / Unlock Screen:** Voller animierter Aurora-Glow (`@keyframes move-aurora`) + Sterne + Noise-Textur. Dies sorgt für den "Aha-Effekt" beim Start.
- **Main App (Dashboard/Planung):** Statischer Gradient zur Schonung der iPad-Ressourcen:
  ```css
  background-image: 
    radial-gradient(circle at 25% 25%, var(--color-background-subtle) 0%, var(--color-background) 50%),
    url("data:image/svg+xml,...noise-texture...");
  ```

### 1.3. Modale ("Nocturne Glass" Look)
Jedes Modal muss zwingend diesen Look befolgen:
- **Overlay (Backdrop):** `bg-black/40` kombiniert mit `backdrop-blur-xl`.
- **Container:** 
    - Ecken: `rounded-xl`.
    - Hintergrund: `bg-[var(--color-ui-primary)]/70` (Teiltransparent, damit der Hintergrund-Blur wirkt).
    - Rahmen: `border border-[var(--color-border)]/50`.
- **Schatten (Signature Glow):** Ein diffuser Glow in der Akzentfarbe:
  ```css
  shadow-[0_0_50px_5px_var(--color-shadow)]
  ```

### 1.4. Tablet-Optimierung
- **iPad Pro Fokus:** Alle interaktiven Elemente sind für Touch optimiert (min. 44x44px).
- **Raumeffizienz:** Nutzung von Sidebars, Flyout-Menüs und kompakten Schüler-Cards im Live-Monitor.

---

## 2. Fachlogik: Abitur-Prüfungsplanung

### 2.1. Datenmodell (Entitäten)
- **Lehrer:** ID, Vorname, Nachname, Kürzel, Deputat (Voll/Teilzeit), Bemerkung.
- **Schüler:** ID, Vorname, Nachname, Liste von Prüfungen (N-M Beziehung).
- **Raum:** ID, Name, Typ (Prüfungsraum oder Vorbereitungsraum).
- **Prüfung:** ID, SchülerId, Fach, PrüferId, VorsitzId, ProtokollantId, RaumId, VorbereitungsraumId, Startzeitpunkt.
- **Aufsicht:** Station (Taxi, Rechenzentrum, Vorbereitung, Warteraum), LehrerId(n), Startzeit, Endzeit.

### 2.2. Zeitraster & Regeln
- **Taktung:** Konsequentes 10-Minuten-Raster.
- **Prüfungsdauer:** 20 Min. (Schüler) / 30 Min. (Lehrer-Gremium inkl. Beratung).
- **Vorbereitung:** Startet exakt 20 Min. vor der Prüfung.
- **Belastungs-Check:** Gewichtung von Prüfungs-Minuten (Faktor > 1) gegenüber Aufsichts-Minuten.

### 2.3. Harte Validierung (Kollisions-Wächter)
- Keine Doppelbelegung von Lehrern (Prüfung/Aufsicht).
- Keine zeitgleichen Prüfungen für denselben Schüler.
- Räume dürfen nicht überbelegt sein.
- Rollentrennung: Ein Lehrer darf in einer Prüfungskommission nur eine Funktion besetzen.

---

## 3. Workflows & Live-Monitor

### 3.1. Taxi-Dashboard (Live-Monitor)
Kompakte Schüler-Cards mit Status-Tracking und automatischen Zeit-Triggern:
- **T-40 Min:** Alarm (Schüler noch nicht anwesend?).
- **T-22 Min:** Signal (Vorbereitung vorbereiten).
- **T-2 Min:** Signal (Vorbereitung beendet -> Abholung zur Prüfung).
- **Live-Countdown:** Echtzeit-Minutenanzeige pro Card.

---

## 4. Master-Bootstrap-Prompt

*Kopiere diesen gesamten Block als ersten Prompt in das neue Projekt:*

```text
Agiere als Senior Frontend Engineer und erstelle die App "LinexioAbi". 

STRATEGIE:
- Ich stelle dir im Projekt eine Datei 'LinexioAbi.md' zur Verfügung. 
- Diese Datei ist deine 'Source of Truth' für das Design-System (Farben, Modale, Hintergründe) und die komplexe Fachlogik.
- Lies diese Datei vollständig, BEVOR du die erste Zeile Code schreibst.

TECHNISCHE ARCHITEKTUR:
- Framework: React (TypeScript), Tailwind CSS.
- Architektur: Drei-Schichten-Modell (Store, Context, Components).
- Datenspeicherung: localforage (IndexedDB), Offline-First.
- Sicherheits-Kern: Master-Passwort-Verschlüsselung (Crypto-Modul).

FUNKTIONALE PRIORITÄTEN:
1. Grundgerüst mit Passwort-Schutz & Design-Variablen (Static Gradient & Noise).
2. Lehrer-, Schüler- & Raumverwaltung (inkl. CSV-Import).
3. Kollisionsprüfung & Deputats-Visualisierung.
4. Der "Taxi-Live-Monitor" mit Schüler-Cards und Zeit-Triggern (T-40, T-22, T-2).

Beginne nun mit der Erstellung der Grundstruktur (index.html, index.tsx, App.tsx) und warte danach auf die Bereitstellung der LinexioAbi.md durch mich.
```