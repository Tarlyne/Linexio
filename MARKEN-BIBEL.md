# Linexio Marken-Bibel (Style Guide)

Version 1.0

Dieses Dokument dient als zentrale Referenz für das Design, die visuelle Identität und die Tonalität von Linexio. Es stellt die Konsistenz zwischen der App und zukünftigen Projekten (z.B. Website, Marketingmaterial) sicher.

## 1. Mission & Tonalität

### 1.1. Name
Linexio

### 1.2. Mission
Linexio ist ein moderner, offline-fähiger Lehrer-Assistent zur Verwaltung von Klassen, Schülern und Noten. Optimiert für das iPad.

### 1.3. Tonalität
- **Professionell & Zugänglich:** Wir sprechen Lehrkräfte als Experten an, aber auf eine klare, verständliche und nahbare Weise.
- **Modern & Effizient:** Die Sprache ist auf den Punkt gebracht und spiegelt die Effizienz der App wider.
- **Hilfreich & Unterstützend:** Die Tonalität ist positiv und lösungsorientiert.
- **Anrede:** Die Nutzer werden mit "Sie" angesprochen.

---

## 2. Visuelle Identität

### 2.1. Logo
Das `LinexioLogoIcon` ist das zentrale Markenzeichen. Es besteht aus zwei ineinandergreifenden "L"-Formen, die eine primäre und eine sekundäre (Akzent-)Farbe nutzen.

### 2.2. Farbpalette
Das Design von Linexio basiert auf einem Theming-System mit CSS-Variablen. Jedes Theme definiert einen konsistenten Satz von Variablen.

#### Theme 1: Aurora Nocturne (Standard Dark)
- **Klasse:** `:root` (Standard)
- **Anmutung:** Modern, fokussiert, mit cyanfarbenen Akzenten.

```css
/* Backgrounds */
--color-background: #111827;
--color-background-subtle: #1D2433;
--color-ui-primary: #1f2937;
--color-ui-secondary: #374151;
--color-ui-tertiary: #4b5563;

/* Borders */
--color-border: #374151;

/* Text */
--color-text-primary: #f3f4f6;
--color-text-secondary: #d1d5db;
--color-text-tertiary: #9ca3af;

/* Accents (Cyan) */
--color-accent-primary: #0891b2;
--color-accent-primary-hover: #0e7490;
--color-accent-text: #22d3ee;
--color-accent-border-focus: #06b6d4;

/* ... (weitere Funktionsfarben) */
```

#### Theme 2: Solaris (Light)
- **Klasse:** `.theme-solaris`
- **Anmutung:** Hell, klar, luftig, mit blauen Akzenten.

```css
/* Backgrounds */
--color-background: #F9FAFB;
--color-ui-primary: #FFFFFF;
--color-ui-secondary: #F3F4F6;

/* Text */
--color-text-primary: #1F2937;
--color-text-secondary: #6B7280;

/* Accents (Blue) */
--color-accent-primary: #3B82F6;
--color-accent-text: #2563EB;
```

#### Theme 3: Terranova (Dark Green)
- **Klasse:** `.theme-terranova`
- **Anmutung:** Natürlich, ruhig, geerdet, mit grünen Akzenten.

```css
/* Backgrounds */
--color-background: #101418;
--color-ui-primary: #1A2027;

/* Text */
--color-text-primary: #E2E8F0;

/* Accents (Green) */
--color-accent-primary: #16A34A;
--color-accent-text: #4ADE80;
```

#### Theme 4: Amethyst (Dark Purple)
- **Klasse:** `.theme-amethyst`
- **Anmutung:** Kreativ, edel, mit violetten Akzenten.

```css
/* Backgrounds */
--color-background: #161625;
--color-ui-primary: #211F33;

/* Accents (Purple) */
--color-accent-primary: #9333EA;
--color-accent-text: #E879F9;
```

#### Theme 5: Scribe (Dark Earthy)
- **Klasse:** `.theme-scribe`
- **Anmutung:** Warm, klassisch, intellektuell, mit Bernstein-Akzenten.

```css
/* Backgrounds */
--color-background: #1c1917;
--color-ui-primary: #292524;

/* Accents (Amber) */
--color-accent-primary: #D97706;
--color-accent-text: #FBBF24;
```

#### Theme 6: Sepia (Light)
- **Klasse:** `.theme-sepia`
- **Anmutung:** Warm, nostalgisch, weich, mit orangen Akzenten.

```css
/* Backgrounds */
--color-background: #fdfcfb;
--color-ui-primary: #ffffff;

/* Accents (Orange) */
--color-accent-primary: #ea580c;
--color-accent-text: #c2410c;
```

### 2.3. Typografie
- **Schriftfamilie:** Standard-Sans-Serif-Stack von Tailwind CSS (system-ui, sans-serif).
- **Hierarchie:**
    - `text-4xl font-bold`: Hauptüberschriften (z.B. Schülername in der Akte)
    - `text-2xl font-bold`: Seiten-Titel im Header (`<Header>`).
    - `text-xl font-bold`: Modal-Titel, Dashboard-Card-Titel.
    - `text-lg font-bold`: Unter-Überschriften in Views.
    - `text-sm font-medium`: Standard-Schriftgröße für Buttons und Labels.
    - `text-sm`: Standard-Fließtext und Beschreibungen.

### 2.4. Visuelle Effekte
- **Aurora-Hintergrund:** Ein animierter, verschwommener radialer Gradient und zwei Ebenen von "Sternen" erzeugen eine dynamische und moderne Hintergrundatmosphäre. Gesteuert über `::before`, `::after` und `@keyframes move-aurora`.
- **Glossy-Effekt:** Ein subtiler Glanz-Effekt (`.glossy-bar::after`) wird auf primären Buttons und anderen prominenten UI-Elementen verwendet, um Tiefe zu erzeugen.
- **Noise-Textur:** Eine leichte, SVG-basierte Rausch-Textur wird über den Hintergrund gelegt, um "Color Banding" zu verhindern und eine haptische Qualität zu erzeugen.
- **Schatten:** Ein sanfter, themenbasierter Schatten (`--color-shadow`) wird für Cards, Modals und Popovers verwendet, um sie vom Hintergrund abzuheben.

---

## 3. UI-Komponenten

### 3.1. Buttons (`<Button>`)
- **Varianten:** `primary`, `secondary`, `danger`.
- **Stil:**
    - Abgerundete Ecken (`rounded-md`).
    - Sanfter Schatten (`shadow-sm`).
    - Gradient-Hintergrund für Tiefe.
    - `glossy-bar`-Effekt auf der `primary`-Variante.
    - Klarer Fokus-Zustand (`focus:ring-2`).

### 3.2. Eingabefelder (`<Input>`, `<Select>`, `<Textarea>`)
- **Stil:**
    - Feste Höhe (`h-10`).
    - Dunklerer Hintergrund (`--color-ui-secondary`) mit innerem Schatten (`shadow-inner`).
    - Abgerundete Ecken (`rounded-lg`).
    - Dezenter Rahmen (`--color-border`).
    - Klarer Fokus-Zustand (`focus:border-[var(--color-accent-border-focus)]`).

### 3.3. Modals (`<Modal>`)
- **Stil:**
    - Überlagern den gesamten Bildschirm mit einem abgedunkelten, unscharfen Hintergrund (`bg-black/40 backdrop-blur-xl`).
    - Abgerundete Ecken (`rounded-xl`).
    - Prominenter, themenbasierter Schatten (`shadow-2xl shadow-[...]`).
    - Teiltransparenter Hintergrund (`bg-[...]/70`), der den Aurora-Effekt durchscheinen lässt.

### 3.4. Cards (z.B. `<LerngruppeCard>`)
- **Stil:**
    - Haupt-Hintergrundfarbe (`--color-ui-primary`).
    - Abgerundete Ecken (`rounded-xl`).
    - Dezenter Rahmen (`--color-border`).
    - Thematisierter Schatten (`shadow-[...]`).
    - Interaktiver Hover-Effekt (Rahmenfarbe ändert sich zu Akzentfarbe).

### 3.5. Icons
- **Stil:** Dünne, moderne Outline-Icons (stroke-width 1.5 oder 2).
- **Farbe:** Nutzen `currentColor`, um sich automatisch an die Textfarbe des Elternelements anzupassen und so das Theming zu vereinfachen.
