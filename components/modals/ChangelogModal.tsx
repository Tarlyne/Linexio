import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Version {
    version: string;
    date: string;
    changes: string[];
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    const [changelog, setChangelog] = useState<{ versions: Version[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetch('/changelog.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Changelog konnte nicht geladen werden.');
                    }
                    return response.json();
                })
                .then(data => setChangelog(data))
                .catch(err => setError(err.message));
        }
    }, [isOpen]);

    const renderContent = () => {
        if (error) {
            return <p className="text-[var(--color-danger-text)]">{error}</p>;
        }
        if (!changelog) {
            return <p className="text-[var(--color-text-secondary)]">Lade Änderungen...</p>;
        }
        
        const latestVersion = changelog.versions[0];
        if (!latestVersion) {
            return <p className="text-[var(--color-text-secondary)]">Keine Versionsinformationen gefunden.</p>
        }

        return (
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-[var(--color-accent-text)]">Version {latestVersion.version}</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)]">{new Date(latestVersion.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <ul className="space-y-2 list-disc list-inside text-[var(--color-text-secondary)]">
                    {latestVersion.changes.map((change, index) => (
                        <li key={index}><span className="text-[var(--color-text-primary)]">{change}</span></li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Was ist neu?">
            {renderContent()}
            <div className="flex justify-end pt-6">
                <Button onClick={onClose}>Schließen</Button>
            </div>
        </Modal>
    );
};

export default ChangelogModal;
