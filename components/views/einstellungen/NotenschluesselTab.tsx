import React, { useState } from 'react';
import { NotenschluesselMap, Notensystem, DEFAULT_NOTENSCHLUESSEL_MAP, NotenschluesselEintrag } from '../../../context/types';
import NotenschluesselEditor from './NotenschluesselEditor';
import { useToastContext } from '../../../context/ToastContext';

interface NotenschluesselTabProps {
    notenschluesselMap: NotenschluesselMap;
    // FIX: The onUpdateNotenschluesselMap function is async and returns a Promise.
    onUpdateNotenschluesselMap: (map: NotenschluesselMap) => Promise<void>;
    notensysteme: Notensystem[];
}

const NotenschluesselTab: React.FC<NotenschluesselTabProps> = ({ notenschluesselMap, onUpdateNotenschluesselMap, notensysteme }) => {
    const [activeSystemId, setActiveSystemId] = useState(notensysteme[0]?.id || '');
    const { showToast } = useToastContext();
    
    const activeNotensystem = notensysteme.find(ns => ns.id === activeSystemId);
    const activeSchluessel = notenschluesselMap[activeSystemId] || [];
    const defaultSchluessel = DEFAULT_NOTENSCHLUESSEL_MAP[activeSystemId] || [];

    // FIX: The handleUpdate function now returns a Promise to match the expected type of the onUpdate prop in NotenschluesselEditor.
    const handleUpdate = async (newSchluessel: NotenschluesselEintrag[]) => {
        try {
            await onUpdateNotenschluesselMap({
                ...notenschluesselMap,
                [activeSystemId]: newSchluessel,
            });
            showToast('Notenschlüssel erfolgreich gespeichert.', 'success');
        } catch (error) {
            console.error("Fehler beim Speichern des Notenschlüssels:", error);
            showToast('Fehler beim Speichern.', 'error');
        }
    };

    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-6">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Notenschlüssel anpassen</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Definieren Sie, ab welchem prozentualen Anteil welche Note vergeben wird. Diese Einstellung dient als Vorlage für neue Klausuren.
                </p>
            </div>
            <div className="flex w-full max-w-md bg-[var(--color-ui-secondary)] rounded-lg p-1 space-x-1">
                {notensysteme.map(ns => (
                    <button
                        key={ns.id}
                        onClick={() => setActiveSystemId(ns.id)}
                        className={`flex-1 p-2 text-sm font-semibold rounded-md transition-colors ${activeSystemId === ns.id ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-ui-tertiary)]'}`}
                    >
                        {ns.name}
                    </button>
                ))}
            </div>

            {activeNotensystem && (
                <NotenschluesselEditor
                    key={activeSystemId} // Rerender when system changes
                    notensystem={activeNotensystem}
                    schluessel={activeSchluessel}
                    defaultSchluessel={defaultSchluessel}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}

export default NotenschluesselTab;
