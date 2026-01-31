import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { Gender, Schueler } from '../../context/types';
import { DocumentArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon, TrashIcon } from '../icons';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ParsedStudent = {
    firstName: string;
    lastName: string;
    gender: Gender;
    isValid: boolean;
    error?: string;
    id: number; // temporary id for list management
};

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
    const { handleAddSchuelerBulk, selectedLerngruppe } = useLerngruppenContext();
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [csvText, setCsvText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);

    const detectSeparator = (text: string): string => {
        const firstLine = text.split('\n')[0];
        if (!firstLine) return ',';
        const commas = (firstLine.match(/,/g) || []).length;
        const semicolons = (firstLine.match(/;/g) || []).length;
        const tabs = (firstLine.match(/\t/g) || []).length;
        
        if (tabs > commas && tabs > semicolons) return '\t';
        if (semicolons > commas) return ';';
        return ',';
    };

    const parseGender = (val: string): Gender => {
        const v = val.toLowerCase().trim();
        if (v === 'm' || v === 'männlich' || v === 'maennlich' || v === 'junge') return 'm';
        if (v === 'w' || v === 'weiblich' || v === 'f' || v === 'frau' || v === 'mädchen') return 'w';
        return 'd';
    };

    const handleParse = () => {
        if (!csvText.trim()) return;
        
        const separator = detectSeparator(csvText);
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        const students: ParsedStudent[] = lines.map((line, index) => {
            const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, '')); // Remove quotes
            
            // Heuristic: If header line detected (contains "Name"), skip or handle. 
            // For simplicity, we treat it as invalid if it looks like a header, or user deletes it in preview.
            
            let lastName = parts[0] || '';
            let firstName = parts[1] || '';
            let genderRaw = parts[2] || '';
            
            // Swap if first column seems to be Firstname (less commas usually, but hard to tell).
            // Standard expectation: Nachname, Vorname
            
            const gender = parseGender(genderRaw);
            const isValid = lastName.length > 0 && firstName.length > 0;
            
            return {
                id: index,
                lastName,
                firstName,
                gender,
                isValid,
                error: !isValid ? 'Vor- oder Nachname fehlt' : undefined
            };
        });

        // Filter out likely header row if present
        if (students.length > 0 && (students[0].lastName.toLowerCase().includes('name') || students[0].lastName.toLowerCase() === 'nachname')) {
             students.shift();
        }

        setParsedData(students);
        setStep('preview');
    };

    const handleRemoveRow = (id: number) => {
        setParsedData(prev => prev.filter(s => s.id !== id));
    };

    const handleImport = async () => {
        if (selectedLerngruppe) {
            const validStudents = parsedData.filter(s => s.isValid).map(s => ({
                firstName: s.firstName,
                lastName: s.lastName,
                gender: s.gender,
            }));
            
            if (validStudents.length > 0) {
                await handleAddSchuelerBulk(validStudents, selectedLerngruppe.id);
            }
        }
        handleClose();
    };

    const handleClose = () => {
        setStep('input');
        setCsvText('');
        setParsedData([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="SchülerInnen importieren" size="lg">
            {step === 'input' ? (
                <div className="space-y-4">
                    <div className="bg-[var(--color-ui-secondary)] p-4 rounded-lg border border-[var(--color-border)]">
                        <div className="flex items-start space-x-3">
                            <DocumentArrowDownIcon className="w-6 h-6 text-[var(--color-accent-text)] flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-[var(--color-text-primary)]">CSV / Excel Import</h4>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                    Kopieren Sie Ihre Schülerliste aus Excel oder einer CSV-Datei und fügen Sie sie unten ein.
                                </p>
                                <p className="text-sm text-[var(--color-text-tertiary)] mt-2 font-mono bg-[var(--color-background)] p-2 rounded">
                                    Format: Nachname; Vorname; Geschlecht (m/w/d)
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <textarea
                        className="w-full h-64 p-3 bg-[var(--color-ui-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--color-accent-border-focus)] transition-colors"
                        placeholder="Mustermann; Max; m&#10;Musterfrau; Erika; w&#10;..."
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                    />
                    
                    <div className="flex justify-end space-x-3">
                        <Button variant="secondary" onClick={handleClose}>Abbrechen</Button>
                        <Button onClick={handleParse} disabled={!csvText.trim()}>Vorschau anzeigen</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 h-[70vh] flex flex-col">
                    <div className="flex justify-between items-center flex-shrink-0">
                        <h4 className="font-bold text-[var(--color-text-primary)]">Vorschau ({parsedData.filter(s => s.isValid).length} gültig)</h4>
                        <Button variant="secondary" onClick={() => setStep('input')} className="!py-1 !px-3 text-sm">Zurück zur Eingabe</Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-ui-secondary)]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--color-ui-primary)] sticky top-0 z-10 text-[var(--color-text-tertiary)]">
                                <tr>
                                    <th className="p-3 font-medium">Nachname</th>
                                    <th className="p-3 font-medium">Vorname</th>
                                    <th className="p-3 font-medium">Geschlecht</th>
                                    <th className="p-3 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {parsedData.map((student) => (
                                    <tr key={student.id} className={`${student.isValid ? 'hover:bg-[var(--color-ui-tertiary)]' : 'bg-[var(--color-danger-background-transparent)]'}`}>
                                        <td className={`p-3 ${!student.isValid && !student.lastName ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]'}`}>
                                            {student.lastName || <span className="italic">Fehlt</span>}
                                        </td>
                                        <td className={`p-3 ${!student.isValid && !student.firstName ? 'text-[var(--color-danger-text)]' : 'text-[var(--color-text-primary)]'}`}>
                                            {student.firstName || <span className="italic">Fehlt</span>}
                                        </td>
                                        <td className="p-3 text-[var(--color-text-secondary)] uppercase">
                                            {student.gender}
                                        </td>
                                        <td className="p-3 text-right">
                                            {student.isValid ? (
                                                <button onClick={() => handleRemoveRow(student.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger-text)] transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <div title={student.error} className="inline-flex">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-[var(--color-danger-text)]" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {parsedData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-[var(--color-text-tertiary)]">Keine Daten erkannt.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2 flex-shrink-0">
                        <Button variant="secondary" onClick={handleClose}>Abbrechen</Button>
                        <Button onClick={handleImport} disabled={parsedData.filter(s => s.isValid).length === 0}>
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            <span>{parsedData.filter(s => s.isValid).length} SchülerInnen importieren</span>
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CsvImportModal;