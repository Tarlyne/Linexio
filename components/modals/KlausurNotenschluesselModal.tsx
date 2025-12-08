import React from 'react';
import Modal from '../ui/Modal';
import { Leistungsnachweis, NotenschluesselEintrag, DEFAULT_NOTENSCHLUESSEL_MAP } from '../../context/types';
import { useNotenContext } from '../../context/NotenContext';
import NotenschluesselEditor from '../views/einstellungen/NotenschluesselEditor';

interface KlausurNotenschluesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  leistungsnachweis: Leistungsnachweis | null;
}

const KlausurNotenschluesselModal: React.FC<KlausurNotenschluesselModalProps> = ({ isOpen, onClose, leistungsnachweis }) => {
  const { notensystemForLerngruppe, notenschluesselMap, handleUpdateLeistungsnachweis } = useNotenContext();
  
  if (!leistungsnachweis || !notensystemForLerngruppe) {
    return null;
  }
  
  const isCustomSchluessel = !!leistungsnachweis.notenschluessel;
  const globalSchluessel = notenschluesselMap[notensystemForLerngruppe.id] || DEFAULT_NOTENSCHLUESSEL_MAP[notensystemForLerngruppe.id] || [];
  const activeSchluessel = leistungsnachweis.notenschluessel || globalSchluessel;

  const handleUpdate = async (newSchluessel: NotenschluesselEintrag[]) => {
    // Await the async operation to match the expected Promise return type.
    await handleUpdateLeistungsnachweis({ ...leistungsnachweis, notenschluessel: newSchluessel });
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notenschlüssel anpassen">
        <div className="space-y-4">
            {isCustomSchluessel && (
                <p className="text-sm text-[var(--color-warning-text)] bg-[var(--color-warning-secondary-transparent)] p-3 rounded-md -mt-2 mb-2">
                    Für diese Klausur wird ein angepasster Notenschlüssel verwendet.
                </p>
            )}
            <p className="text-sm text-[var(--color-text-secondary)]">
                Änderungen am Notenschlüssel für die Klausur "{leistungsnachweis.name}" werden automatisch gespeichert. Diese Anpassungen gelten nur für diese Klausur.
            </p>

            <NotenschluesselEditor
                key={leistungsnachweis.id} // Re-initialize editor if LN changes to reset its internal state
                notensystem={notensystemForLerngruppe}
                schluessel={activeSchluessel}
                defaultSchluessel={globalSchluessel}
                onUpdate={handleUpdate}
            />
        </div>
    </Modal>
  );
};

export default KlausurNotenschluesselModal;