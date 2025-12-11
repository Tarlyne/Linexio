import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SparklesIcon } from '../icons';
import { useUIContext } from '../../context/UIContext';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
    const { changelogData } = useUIContext();

    const renderContent = () => {
        if (!changelogData) {
            return <p className="text-[var(--color-text-secondary)]">Lade Änderungen...</p>;
        }
        
        const latestVersion = changelogData.versions[0];
        if (!latestVersion) {
            return <p className="text-[var(--color-text-secondary)]">Keine Versionsinformationen gefunden.</p>
        }

        return (
            <div className="space-y-6">
                {/* Latest Version - Highlighted */}
                <div className="bg-[var(--color-accent-secondary-transparent-40)] p-5 rounded-lg border-l-4 border-[var(--color-accent-primary)] animate-fade-in">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-[var(--color-accent-text)]" />
                                Version {latestVersion.version}
                            </h3>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                                {new Date(latestVersion.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <span className="bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] text-xs font-bold px-2 py-1 rounded">
                            NEU
                        </span>
                    </div>
                    <ul className="space-y-2 list-disc list-inside text-[var(--color-text-secondary)] ml-1">
                        {latestVersion.changes.map((change, index) => (
                            <li key={index}><span className="text-[var(--color-text-primary)]">{change}</span></li>
                        ))}
                    </ul>
                </div>

                {/* Older Versions */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-2">Frühere Updates</h4>
                    {changelogData.versions.slice(1).map((version) => (
                        <div key={version.version} className="pl-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-[var(--color-text-secondary)]">v{version.version}</span>
                                <span className="text-xs text-[var(--color-text-tertiary)]">
                                    {new Date(version.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                            </div>
                            <ul className="space-y-1 list-disc list-inside text-sm text-[var(--color-text-tertiary)] pl-1">
                                {version.changes.map((change, idx) => (
                                    <li key={idx}><span>{change}</span></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update-Infos" size="lg">
            {renderContent()}
            <div className="flex justify-end pt-6">
                <Button onClick={onClose} className="w-full sm:w-auto">Verstanden!</Button>
            </div>
        </Modal>
    );
};

export default ChangelogModal;