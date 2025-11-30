import React from 'react';
import { useUIContext } from '../context/UIContext';
import DashboardView from './views/DashboardView';
import LerngruppenView from './views/LerngruppenView';
import LerngruppeDetailView from './views/LerngruppeDetailView';
import SchuelerAkteView from './views/SchuelerAkteView';
import EinstellungenView from './views/EinstellungenView';
import ToolsChooserView from './views/ToolsChooserView';
import NotenverwaltungChooserView from './views/NotenverwaltungChooserView';
import NotenuebersichtView from './views/NotenuebersichtView';
import ZufallsschuelerView from './views/ZufallsschuelerView';
import GruppeneinteilungView from './views/GruppeneinteilungView';
import ChecklistenView from './views/ChecklistenView';
import SitzplanView from './views/SitzplanView';
import LeistungsnachweisDetailView from './views/LeistungsnachweisDetailView';
import Header from './Header';
import Clock from './Clock';
import NotizenView from './views/NotizenView';
import KlausurAuswertungView from './views/KlausurAuswertungView';
import SchuelerAuswertungView from './views/SchuelerAuswertungView';
import ChangelogModal from './modals/ChangelogModal';
import NamenstrainingView from './views/NamenstrainingView';
import TermineView from './views/TermineView';

const MainContent: React.FC = () => {
  const { activeView, headerConfig, isChangelogModalOpen, hideChangelog } = useUIContext();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'lerngruppen': return <LerngruppenView />;
      case 'lerngruppeDetail': return <LerngruppeDetailView />;
      case 'schuelerAkte': return <SchuelerAkteView />;
      case 'einstellungen': return <EinstellungenView />;
      case 'tools-chooser': return <ToolsChooserView />;
      case 'notenverwaltung-chooser': return <NotenverwaltungChooserView />;
      case 'notenverwaltung': return <NotenuebersichtView />;
      case 'leistungsnachweisDetail': return <LeistungsnachweisDetailView />;
      case 'klausurAuswertung': return <KlausurAuswertungView />;
      case 'schuelerAuswertung': return <SchuelerAuswertungView />;
      case 'checklisten': return <ChecklistenView />;
      case 'zufallsschueler': return <ZufallsschuelerView />;
      case 'gruppeneinteilung': return <GruppeneinteilungView />;
      case 'sitzplan': return <SitzplanView />;
      case 'notizen': return <NotizenView />;
      case 'namenstraining': return <NamenstrainingView />;
      case 'termine' as any: return <TermineView />; // Cast to any until type is updated everywhere
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-[var(--color-text-primary)]">
      {/*
        ARCHITEKTONISCHES MEMORANDUM (Teil 1/2): Die Header-Entscheidung

        Problem:
        Nach einem Refactoring war jede View für ihren eigenen Header verantwortlich.
        Dies führte zu einer sauberen Code-Architektur, aber zu einer mangelhaften User Experience (UX),
        da der Header bei jedem Seitenwechsel unschön flackerte und neu aufgebaut wurde.

        Entscheidung & Begründung:
        Wir haben uns bewusst für einen pragmatischen Kompromiss entschieden, der die UX priorisiert,
        ohne die architektonische Sauberkeit wesentlich zu verletzen. Wir trennen die *Darstellung* von der *Konfiguration*:

        1.  ZENTRALISIERTE DARSTELLUNG (Das "Wo"):
            Der <Header> wird hier *einmalig* und *persistent* gerendert. Er befindet sich außerhalb des
            animierten <main>-Bereichs und bleibt bei Seitenwechseln stabil. Dies löst das UX-Problem vollständig.

        2.  DEZENTRALISIERTE KONFIGURATION (Das "Was"):
            Die *Verantwortung* für den Inhalt des Headers (Titel, etc.) verbleibt bei der jeweiligen `View`-Komponente.
            Jede `View` nutzt einen `useEffect`-Hook, um dem zentralen `UIContext` mitzuteilen, wie der Header
            für sie aussehen soll. `MainContent` bleibt "dumm", da es den Inhalt nicht kennt, sondern nur vom Context empfängt.

        Fazit:
        Diese Struktur ist eine bewusste Entscheidung, um eine stabile UI für eine flüssige UX zu schaffen,
        während die logische Steuerung für eine wartbare Codebasis dezentral bleibt.
        -> Bitte diese Struktur nicht ohne Kenntnis des UX-Problems wieder dezentralisieren.
      */}
      <header className="flex-shrink-0 bg-[var(--color-ui-primary)]/80 backdrop-blur-lg h-16 px-6 md:px-8 flex items-center border-b border-[var(--color-border)] z-20">
        <Header 
          title={headerConfig.title}
          subtitle={headerConfig.subtitle}
          onBack={headerConfig.onBack}
          actions={headerConfig.actions}
        >
          <Clock />
        </Header>
      </header>

      {headerConfig.banner}

      <main key={activeView} className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-y-auto p-6 md:px-8 md:py-8">
        {renderView()}
      </main>

      <ChangelogModal isOpen={isChangelogModalOpen} onClose={hideChangelog} />
    </div>
  );
};

export default MainContent;
