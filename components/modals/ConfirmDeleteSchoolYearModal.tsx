import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmDeleteSchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schoolYear: string;
  stats: {
    groups: number;
    students: number;
    orphanedStudents: number;
  };
}

const ConfirmDeleteSchoolYearModal: React.FC<ConfirmDeleteSchoolYearModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    schoolYear,
    stats 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archiv löschen">
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)]">
          Sind Sie sicher, dass Sie das gesamte Schuljahr <strong className="text-[var(--color-text-primary)]">{schoolYear}</strong> und alle damit verbundenen Daten löschen möchten?
        </p>
        
        <div className="bg-[var(--color-warning-secondary-transparent)] p-4 rounded-md border border-[var(--color-border)]">
            <h4 className="text-sm font-bold text-[var(--color-warning-text)] mb-2 uppercase tracking-wide">Zusammenfassung</h4>
            <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                <li>• <strong className="text-[var(--color-text-primary)]">{stats.groups}</strong> Lerngruppen werden gelöscht.</li>
                <li>• <strong className="text-[var(--color-text-primary)]">{stats.orphanedStudents}</strong> SchülerInnen werden endgültig gelöscht (da sie nur in diesem Jahr existierten).</li>
                {stats.students - stats.orphanedStudents > 0 && (
                    <li>• <strong className="text-[var(--color-text-primary)]">{stats.students - stats.orphanedStudents}</strong> SchülerInnen bleiben erhalten (in anderen Jahren aktiv).</li>
                )}
            </ul>
        </div>

        <p className="text-[var(--color-danger-text)] text-sm bg-[var(--color-danger-background-transparent)] p-3 rounded-md border border-[var(--color-danger-border)]">
          <strong>Achtung:</strong> Alle Noten, Anwesenheitslisten, Sitzpläne und Protokolle dieses Jahres gehen unwiderruflich verloren.
        </p>
        
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            type="button" 
            variant="danger"
            onClick={onConfirm}
          >
            Endgültig löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteSchoolYearModal;