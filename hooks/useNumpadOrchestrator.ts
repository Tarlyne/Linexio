import { useLerngruppenContext } from '../context/LerngruppenContext';
import { useNotenContext } from '../context/NotenContext';
import { useModalContext } from '../context/ModalContext';
import { EinzelLeistungsNote, Klausuraufgabe, KlausuraufgabePunkte, Leistungsnachweis, Schueler } from '../context/types';

export const useNumpadOrchestrator = () => {
  const { allSchueler } = useLerngruppenContext();
  const { handleNumpadSave, einzelLeistungsNoten, handlePunkteNumpadSave, klausuraufgabePunkte, leistungsnachweise } = useNotenContext();
  const { numpadContext, openNumpadModal, closeNumpadModal, punkteNumpadContext, openPunkteNumpadModal, closePunkteNumpadModal } = useModalContext();

  const handleNumpadSaveAndNext = async (note: string, bemerkung?: string) => {
    if (!numpadContext) return;
    const { schueler, einzelLeistungId, sortedSchuelerIds } = numpadContext;
    await handleNumpadSave(schueler.id, einzelLeistungId, note, bemerkung);

    const currentIndex = sortedSchuelerIds.indexOf(schueler.id);
    if (currentIndex < sortedSchuelerIds.length - 1) {
        const nextSchuelerId = sortedSchuelerIds[currentIndex + 1];
        const nextSchueler = allSchueler.find((s: Schueler) => s.id === nextSchuelerId);
        if (nextSchueler) {
            const noteRecord = einzelLeistungsNoten.find((n: EinzelLeistungsNote) => n.schuelerId === nextSchuelerId && n.einzelLeistungId === einzelLeistungId);
            openNumpadModal({
                schueler: nextSchueler,
                einzelLeistungId,
                currentNote: noteRecord?.note || '',
                currentBemerkung: noteRecord?.bemerkung,
                sortedSchuelerIds,
            });
        }
    } else {
        closeNumpadModal();
    }
  };

  const handlePunkteNumpadSaveAndNext = async (punkte: number | null) => {
    if (!punkteNumpadContext) return;
    const { schueler, aufgabeId, leistungsnachweisId, sortedAufgabenIds } = punkteNumpadContext;
    
    // 1. Save current points
    await handlePunkteNumpadSave(schueler.id, aufgabeId, punkte);

    // 2. Find next task
    const currentIndex = sortedAufgabenIds.indexOf(aufgabeId);
    if (currentIndex < sortedAufgabenIds.length - 1) {
        const nextAufgabeId = sortedAufgabenIds[currentIndex + 1];
        
        // Find the Leistungsnachweis and then the next Aufgabe object
        const leistungsnachweis = leistungsnachweise.find((ln: Leistungsnachweis) => ln.id === leistungsnachweisId);
        const nextAufgabe = leistungsnachweis?.aufgaben?.find((a: Klausuraufgabe) => a.id === nextAufgabeId);
        
        if (nextAufgabe) {
            // Find points record for the next task
            const punkteRecord = klausuraufgabePunkte.find((p: KlausuraufgabePunkte) => p.schuelerId === schueler.id && p.aufgabeId === nextAufgabeId);
            
            // Re-open modal for the same student, next task
            openPunkteNumpadModal({
                ...punkteNumpadContext,
                aufgabeId: nextAufgabe.id,
                aufgabeName: nextAufgabe.name,
                maxPunkte: nextAufgabe.maxPunkte,
                currentPunkte: punkteRecord?.punkte ?? null,
            });
        } else {
             closePunkteNumpadModal(); // Should not happen if data is consistent
        }
    } else {
        // 4. Last task, close modal
        closePunkteNumpadModal();
    }
  };

  return { handleNumpadSaveAndNext, handlePunkteNumpadSaveAndNext };
};