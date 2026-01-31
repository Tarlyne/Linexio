import React, { useEffect } from 'react';
import LerngruppeCard from '../LerngruppeCard';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { Lerngruppe, Schueler } from '../../context/types';

const ToolsChooserView: React.FC = () => {
  const { lerngruppen } = useLerngruppenContext();
  const { currentSchoolYear, onToolClassChosen, activeTool, setHeaderConfig } = useUIContext();

  const toolNames: {[key: string]: string} = { 
    'zufallsschueler': 'ZufallsschülerIn',
    'gruppeneinteilung': 'Gruppeneinteilung',
    'checklisten': 'Checklisten',
    'sitzplan': 'Sitzplan',
  };
  const title = toolNames[activeTool || ''] || 'Unterrichts-Tool';

  useEffect(() => {
    setHeaderConfig({
      title,
      subtitle: <p className="text-sm text-[var(--color-accent-text)]">Lerngruppe auswählen</p>,
      onBack: undefined,
      banner: null,
    });
  }, [setHeaderConfig, title]);

  const filteredLerngruppen = lerngruppen.filter((lg: Lerngruppe) => lg.schuljahr === currentSchoolYear);
  
  return (
    <div className="max-w-7xl">
      {filteredLerngruppen.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLerngruppen.map((lg: Lerngruppe) => (
            <LerngruppeCard
              key={lg.id}
              lerngruppe={lg}
              schuelerCount={lg.schuelerIds.length}
              onSelect={() => onToolClassChosen(lg.id)}
              onEdit={() => {}}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              isFirst={true}
              isLast={true}
              isArchived={true}
              showMenu={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-[var(--color-ui-primary)] rounded-lg border border-[var(--color-border)] max-w-2xl mx-auto mt-10">
          <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Keine Lerngruppen für das Schuljahr {currentSchoolYear} gefunden.</h3>
          <p className="text-[var(--color-text-tertiary)] mt-2">Sie müssen zuerst eine Lerngruppe erstellen, um ein Tool nutzen zu können.</p>
        </div>
      )}
    </div>
  );
};

export default ToolsChooserView;