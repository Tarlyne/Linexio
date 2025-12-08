
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { PREDEFINED_NOTENSYSTEME, Lerngruppe } from '../../context/types';
import ThemesTab from './einstellungen/FarbenTab';
import { useNotenContext } from '../../context/NotenContext';
import NotenschluesselTab from './einstellungen/BewertungTab';
import { ExclamationCircleIcon, InboxArrowDownIcon, SpinnerIcon, InformationCircleIcon, LockClosedIcon, ShieldCheckIcon, FingerPrintIcon, ChevronDownIcon, TrashIcon, CheckCircleIcon, SparklesIcon, UserCircleIcon, EyeDropperIcon, DocumentTextIcon, CheckIcon, PencilIcon, XIcon } from '../icons';
import { createBackup, checkBackupFile, applyBackupData } from '../../services/BackupService';
import ConfirmRestoreModal from '../modals/ConfirmRestoreModal';
import { useToastContext } from '../../context/ToastContext';
import { useSecurityContext } from '../../context/SecurityContext';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import RecoveryPhraseSetupModal from '../modals/RecoveryPhraseSetupModal';
import PasswordConfirmModal from '../modals/PasswordConfirmModal';
import CreateBackupPasswordModal from '../modals/CreateBackupPasswordModal';
import RestoreBackupPasswordModal from '../modals/RestoreBackupPasswordModal';
import Switch from '../ui/Switch';
import { licenseStore } from '../../store/licenseStore';
import { useLicenseContext } from '../../context/LicenseContext';
import { isAppleMobile, calculateNextSchoolYear } from '../../context/utils';
import DownloadAnleitungModal from '../modals/DownloadAnleitungModal';
import ConfirmRestoreNormalModal from '../modals/ConfirmRestoreNormalModal';
import WarningRestoreDangerousModal from '../modals/WarningRestoreDangerousModal';
import ConfirmDeleteSchoolYearModal from '../modals/ConfirmDeleteSchoolYearModal';
import ConfirmSchoolYearAdvanceModal from '../modals/ConfirmSchoolYearAdvanceModal';
import Input from '../ui/Input';
import RequestLicenseModal from '../modals/RequestLicenseModal';


interface TabProps {
  currentSchoolYear: string;
  systemSchoolYear: string;
  onSetCurrentSchoolYear: (newYear: string) => void;
  advanceSystemSchoolYear: () => void;
  schoolYears: string[];
}

const BUNDESLAENDER = [
    { value: '', label: 'Bitte wählen...' },
    { value: 'BW', label: 'Baden-Württemberg' },
    { value: 'BY', label: 'Bayern' },
    { value: 'BE', label: 'Berlin' },
    { value: 'BB', label: 'Brandenburg' },
    { value: 'HB', label: 'Bremen' },
    { value: 'HH', label: 'Hamburg' },
    { value: 'HE', label: 'Hessen' },
    { value: 'MV', label: 'Mecklenburg-Vorpommern' },
    { value: 'NI', label: 'Niedersachsen' },
    { value: 'NW', label: 'Nordrhein-Westfalen' },
    { value: 'RP', label: 'Rheinland-Pfalz' },
    { value: 'SL', label: 'Saarland' },
    { value: 'SN', label: 'Sachsen' },
    { value: 'ST', label: 'Sachsen-Anhalt' },
    { value: 'SH', label: 'Schleswig-Holstein' },
    { value: 'TH', label: 'Thüringen' },
];

const AllgemeinTab: React.FC<TabProps> = ({ systemSchoolYear, advanceSystemSchoolYear }) => {
    const { bundesland, setBundesland } = useUIContext();
    const { handleRemoveImagesFromYear } = useLerngruppenContext();
    const { showToast } = useToastContext();
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

    const nextSchoolYear = calculateNextSchoolYear(systemSchoolYear);

    const handleAdvanceConfirm = async (deleteImages: boolean) => {
        if (deleteImages) {
            await handleRemoveImagesFromYear(systemSchoolYear);
        }
        advanceSystemSchoolYear();
        setIsAdvanceModalOpen(false);
        showToast(`Schuljahr erfolgreich auf ${nextSchoolYear} gewechselt.${deleteImages ? ' Bilder wurden bereinigt.' : ''}`, 'success');
    };
    
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">System & Standort</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Das aktuell aktive Schuljahr ist <span className="font-semibold text-[var(--color-accent-text)]">{systemSchoolYear}</span>. Alle früheren Jahre werden automatisch als Archiv behandelt.
                </p>
            </div>

            <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)]">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Standort</h4>
                <p className="text-[var(--color-text-tertiary)] max-w-md mb-4">
                    Wählen Sie Ihr Bundesland, um relevante Informationen wie den Ferien-Countdown anzuzeigen.
                </p>
                <div className="max-w-xs">
                    <Select
                        label="Bundesland"
                        id="bundesland-select"
                        value={bundesland || ''}
                        onChange={(e) => setBundesland(e.target.value || null)}
                        options={BUNDESLAENDER}
                    />
                </div>
            </div>
            
            <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Schuljahreswechsel</h4>
                        <p className="text-[var(--color-text-tertiary)] max-w-md">
                            Schließen Sie das aktuelle Schuljahr ab. Dies setzt das Systemdatum auf <strong>{nextSchoolYear}</strong> und verschiebt das Jahr {systemSchoolYear} in das Archiv.
                        </p>
                    </div>
                </div>
                <Button onClick={() => setIsAdvanceModalOpen(true)}>
                    Schuljahr {systemSchoolYear} abschließen &amp; zu {nextSchoolYear} wechseln
                </Button>
            </div>

            <ConfirmSchoolYearAdvanceModal
                isOpen={isAdvanceModalOpen}
                onClose={() => setIsAdvanceModalOpen(false)}
                onConfirm={handleAdvanceConfirm}
                currentYear={systemSchoolYear}
                nextYear={nextSchoolYear}
            />
        </div>
    );
};

const ArchivTab: React.FC<TabProps> = ({ currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, schoolYears }) => {
    const { lerngruppen, handleDeleteSchoolYear } = useLerngruppenContext();
    const { showToast } = useToastContext();
    
    const [yearToDelete, setYearToDelete] = useState<string | null>(null);
    const [stats, setStats] = useState({ groups: 0, students: 0, orphanedStudents: 0 });

    const archiveYears = schoolYears.filter(y => y !== systemSchoolYear);
    const isCurrentlyInArchive = currentSchoolYear !== systemSchoolYear;

    const options = [
        { 
            value: systemSchoolYear, 
            label: isCurrentlyInArchive ? `« Zurück zum aktuellen Schuljahr (${systemSchoolYear})` : `Aktuelles Schuljahr (${systemSchoolYear})`
        },
        ...archiveYears.map(y => ({ value: y, label: `Schuljahr ${y}` }))
    ];

    const handleDeleteClick = (year: string) => {
        const groupsInYear = lerngruppen.filter(lg => lg.schuljahr === year);
        const studentsInYearIds = new Set(groupsInYear.flatMap(lg => lg.schuelerIds));
        
        const remainingGroups = lerngruppen.filter(lg => lg.schuljahr !== year);
        const remainingStudentIds = new Set(remainingGroups.flatMap(lg => lg.schuelerIds));
        
        const orphanedCount = [...studentsInYearIds].filter(id => !remainingStudentIds.has(id)).length;

        setStats({
            groups: groupsInYear.length,
            students: studentsInYearIds.size,
            orphanedStudents: orphanedCount
        });
        setYearToDelete(year);
    };

    const confirmDelete = async () => {
        if (yearToDelete) {
            await handleDeleteSchoolYear(yearToDelete);
            
            // If we are currently viewing the deleted year, switch back to system year
            if (currentSchoolYear === yearToDelete) {
                onSetCurrentSchoolYear(systemSchoolYear);
            }
            
            setYearToDelete(null);
            showToast(`Archiv ${yearToDelete} erfolgreich gelöscht.`, 'success');
        }
    };
    
    const renderContent = () => {
        if (archiveYears.length === 0) {
            return (
                <p className="text-[var(--color-text-tertiary)] italic">Bisher wurden noch keine Schuljahre archiviert.</p>
            );
        }
        return null;
    }
    
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Archivierte Schuljahre</h3>
                <p className="text-[var(--color-text-tertiary)] mb-4">
                    Wählen Sie ein vergangenes Schuljahr aus, um dessen Daten (Lerngruppen, Schüler, etc.) einzusehen.
                    In der Archiv-Ansicht können keine Daten verändert werden. Um Ihnen den Start in ein neues Schuljahr zu erleichtern, können Sie jedoch komplette Lerngruppen mitsamt der Schülerliste in das aktuelle Schuljahr kopieren.
                </p>
                {archiveYears.length > 0 && (
                    <div className="max-w-xs">
                        <Select
                            label="Schuljahr ansehen"
                            id="archive-year-select"
                            value={currentSchoolYear}
                            onChange={(e) => onSetCurrentSchoolYear(e.target.value)}
                            options={options}
                        />
                    </div>
                )}
                {renderContent()}
            </div>

            {archiveYears.length > 0 && (
                <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
                    <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-4">Archiv verwalten</h3>
                    <div className="space-y-3">
                        {archiveYears.map(year => {
                            const groupCount = lerngruppen.filter(lg => lg.schuljahr === year).length;
                            return (
                                <div key={year} className="flex items-center justify-between p-4 bg-[var(--color-ui-secondary)] rounded-lg border border-[var(--color-border)]">
                                    <div>
                                        <p className="font-bold text-[var(--color-text-primary)]">Schuljahr {year}</p>
                                        <p className="text-sm text-[var(--color-text-tertiary)]">{groupCount} Lerngruppe{groupCount !== 1 ? 'n' : ''}</p>
                                    </div>
                                    <Button variant="secondary" onClick={() => handleDeleteClick(year)} className="!p-2 text-[var(--color-danger-text)] hover:!bg-[var(--color-danger-background-transparent)]" aria-label={`Archiv ${year} löschen`}>
                                        <TrashIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {yearToDelete && (
                <ConfirmDeleteSchoolYearModal
                    isOpen={!!yearToDelete}
                    onClose={() => setYearToDelete(null)}
                    onConfirm={confirmDelete}
                    schoolYear={yearToDelete}
                    stats={stats}
                />
            )}
        </div>
    );
};

const DatenSicherheitTab: React.FC = () => {
    const { 
        hasRecoveryPhrase, 
        isBiometricsSupported,
        isAppleDevice,
        isBiometricsEnabled, 
        enableBiometrics, 
        disableBiometrics,
        autoLockTimeout,
        setAutoLockTimeout,
    } = useSecurityContext();
    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [isRecoverySetupModalOpen, setRecoverySetupModalOpen] = useState(false);
    const [isConfirmPasswordModalOpen, setConfirmPasswordModalOpen] = useState(false);
    const { showToast } = useToastContext();

    const onBiometricsSuccess = () => {
        setConfirmPasswordModalOpen(false);
        showToast('Biometrisches Entsperren aktiviert.', 'success');
    };

    const handleBiometricsToggle = () => {
        if (isBiometricsEnabled) {
            disableBiometrics();
            showToast('Biometrisches Entsperren deaktiviert.', 'success');
        } else {
            setConfirmPasswordModalOpen(true);
        }
    };

    const handleConfirmPasswordForBiometrics = async (password: string): Promise<{ success: boolean; error?: string; }> => {
        try {
            await enableBiometrics(password);
            return { success: true };
        } catch (error) {
            if (error instanceof Error) {
                return { success: false, error: error.message };
            }
            return { success: false, error: 'Ein unbekannter Fehler ist aufgetreten.' };
        }
    };


    return (
        <>
            <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl mx-auto">
                <div>
                    <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Datensicherheit</h3>
                    <p className="text-[var(--color-text-tertiary)]">
                        Verwalten Sie hier den Zugriffsschutz für Ihre App.
                    </p>
                </div>
                
                {(isBiometricsSupported || (isAppleDevice && !!navigator.credentials?.create)) && (
                    <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)] mt-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 flex items-center space-x-3">
                                    <FingerPrintIcon className="w-6 h-6" />
                                    <span>Biometrisches Entsperren</span>
                                </h4>
                                <p className="text-[var(--color-text-tertiary)] max-w-md">
                                    {isBiometricsSupported
                                        ? 'Aktivieren Sie Face ID / Touch ID, um die App schneller und sicher zu entsperren.'
                                        : 'Das biometrische Entsperren für Offline-Apps wird von Apple-Geräten aktuell leider nicht unterstützt.'
                                    }
                                </p>
                            </div>
                            {isBiometricsSupported && (
                                <Switch
                                    checked={isBiometricsEnabled}
                                    onChange={handleBiometricsToggle}
                                />
                            )}
                        </div>
                    </div>
                )}
                
                <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)] mt-8">
                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Automatische Sperre</h4>
                    <p className="text-[var(--color-text-tertiary)] max-w-md mb-4">
                        Die App wird nach einer festgelegten Zeit der Inaktivität automatisch gesperrt, um Ihre Daten zu schützen.
                    </p>
                    <div className="max-w-xs">
                        <Select
                            label="Sperren nach"
                            id="autolock-select"
                            value={String(autoLockTimeout)}
                            onChange={(e) => setAutoLockTimeout(Number(e.target.value))}
                            options={[
                                { value: '300000', label: '5 Minuten' },
                                { value: '600000', label: '10 Minuten' },
                                { value: '1800000', label: '30 Minuten' },
                                { value: '0', label: 'Niemals' },
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)] flex flex-col">
                        <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 flex items-center space-x-3">
                            <LockClosedIcon className="w-6 h-6" />
                            <span>Passwort ändern</span>
                        </h4>
                        <p className="text-[var(--color-text-tertiary)] max-w-md mb-4 flex-grow">
                            Ändern Sie Ihr aktuelles App-Passwort. Sie werden anschließend abgemeldet.
                        </p>
                        <Button onClick={() => setChangePasswordModalOpen(true)}>
                            Passwort jetzt ändern
                        </Button>
                    </div>
                    
                    <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)] flex flex-col">
                        <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 flex items-center space-x-3">
                            <ShieldCheckIcon className="w-6 h-6" />
                            <span>Notfall-Wiederherstellung</span>
                        </h4>
                        <p className="text-[var(--color-text-tertiary)] max-w-md mb-4 flex-grow">
                            {hasRecoveryPhrase
                                ? 'Sie haben eine Wiederherstellungsphrase eingerichtet. Dies ist die einzige Möglichkeit, Ihr Passwort zurückzusetzen, falls Sie es vergessen.'
                                : 'Richten Sie eine Wiederherstellungsphrase (12 Wörter) ein, um Ihr Passwort im Notfall zurücksetzen zu können.'
                            }
                        </p>
                        <Button 
                            variant={hasRecoveryPhrase ? 'secondary' : 'primary'}
                            onClick={() => setRecoverySetupModalOpen(true)}
                        >
                            {hasRecoveryPhrase ? 'Phrase anzeigen / ändern' : 'Jetzt einrichten'}
                        </Button>
                    </div>
                </div>
                
                <div className="bg-[var(--color-danger-background-transparent)] p-4 rounded-md border border-[var(--color-danger-border)] mt-8">
                    <p className="text-[var(--color-danger-text)] text-sm">
                        <strong className="font-bold">Wichtiger Hinweis:</strong> Wir haben keine Kenntnis von Ihrem Passwort oder Ihrer Wiederherstellungsphrase und können diese nicht zurücksetzen. Bewahren Sie beides sicher auf.
                    </p>
                </div>
            </div>
            <PasswordConfirmModal
                isOpen={isConfirmPasswordModalOpen}
                onClose={() => setConfirmPasswordModalOpen(false)}
                onConfirm={handleConfirmPasswordForBiometrics}
                onSuccess={onBiometricsSuccess}
                title="Biometrie aktivieren"
                description="Bitte bestätigen Sie Ihr aktuelles Passwort, um das biometrische Entsperren einzurichten."
            />
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setChangePasswordModalOpen(false)}
            />
            <RecoveryPhraseSetupModal 
                isOpen={isRecoverySetupModalOpen}
                onClose={() => setRecoverySetupModalOpen(false)}
            />
        </>
    );
};

const BackupTab: React.FC = () => {
    const { logout } = useSecurityContext();
    const { appVersion } = useUIContext();
    const { showToast } = useToastContext();
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    
    // Step 1: File selection
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    // Step 2: Confirmation
    const [isConfirmRestoreModalOpen, setConfirmRestoreModalOpen] = useState(false);
    // Step 3: Password entry
    const [isRestorePasswordModalOpen, setRestorePasswordModalOpen] = useState(false);
    
    // Version Mismatch Modals
    const [decryptedData, setDecryptedData] = useState<any>(null);
    const [backupVersion, setBackupVersion] = useState('');
    const [isNormalMismatchModalOpen, setNormalMismatchModalOpen] = useState(false);
    const [isDangerousMismatchModalOpen, setDangerousMismatchModalOpen] = useState(false);

    // Create backup
    const [isCreateBackupModalOpen, setCreateBackupModalOpen] = useState(false);
    const [isAnleitungModalOpen, setIsAnleitungModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAppleDevice = useMemo(() => isAppleMobile(), []);

    const handleCreateBackup = async (password: string) => {
        setIsCreatingBackup(true);
        try {
            await createBackup(password, appVersion);
        } catch (error) {
            console.error(error);
            showToast((error as Error).message || 'Backup fehlgeschlagen', 'error');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleCreateBackupClick = () => {
        if (isAppleDevice) {
            setIsAnleitungModalOpen(true);
        } else {
            setCreateBackupModalOpen(true);
        }
    };

    const handleAnleitungConfirm = () => {
        setCreateBackupModalOpen(true);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToRestore(file);
            setConfirmRestoreModalOpen(true);
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const onConfirmRestore = () => {
        setConfirmRestoreModalOpen(false);
        setRestorePasswordModalOpen(true);
    };

    const applyAndLogout = async (data: any) => {
        try {
            await applyBackupData(data);
            showToast('Daten erfolgreich wiederhergestellt. Die App wird neu gestartet.', 'success');
            setTimeout(() => {
                logout();
            }, 50);
        } catch (error) {
            console.error(error);
            showToast((error as Error).message || 'Fehler beim Anwenden der Daten.', 'error');
        }
    };

    const handleRestore = async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!fileToRestore) {
            return { success: false, error: "Keine Datei zum Wiederherstellen ausgewählt." };
        }
        
        const result = await checkBackupFile(fileToRestore, password);
        setRestorePasswordModalOpen(false); // Close password modal regardless of outcome

        switch (result.status) {
            case 'SUCCESS':
                await applyAndLogout(result.data);
                break;
            case 'MISMATCH_NORMAL':
                setDecryptedData(result.data);
                setBackupVersion(result.backupVersion);
                setNormalMismatchModalOpen(true);
                break;
            case 'MISMATCH_DANGEROUS':
                setBackupVersion(result.backupVersion);
                setDangerousMismatchModalOpen(true);
                break;
            case 'ERROR':
                showToast(result.message, 'error');
                return { success: false, error: result.message };
        }

        return { success: true };
    };

    return (
        <>
            <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
                <div>
                    <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Backup & Wiederherstellung</h3>
                    <p className="text-[var(--color-text-tertiary)]">
                        Sichern Sie Ihre gesamten Daten in einer verschlüsselten Datei oder stellen Sie eine Sicherung wieder her. Ideal für den Gerätewechsel oder als Sicherheitskopie.
                    </p>
                </div>
                
                <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)] space-y-4">
                     <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Backup erstellen</h4>
                     <p className="text-[var(--color-text-tertiary)] max-w-md">
                        Erstellt eine einzelne, mit einem von Ihnen gewählten Passwort verschlüsselte Backup-Datei. Bewahren Sie diese Datei und das Passwort sicher auf.
                    </p>
                    <Button onClick={handleCreateBackupClick} disabled={isCreatingBackup}>
                        <InboxArrowDownIcon className="w-5 h-5" />
                        <span>{isAppleDevice ? 'Backup erstellen & öffnen' : 'Backup erstellen & herunterladen'}</span>
                    </Button>
                </div>

                <div className="bg-[var(--color-danger-background-transparent)] p-6 rounded-md border border-[var(--color-danger-border)] space-y-4">
                     <h4 className="text-lg font-semibold text-[var(--color-danger-text)] flex items-center space-x-2">
                        <ExclamationCircleIcon className="w-6 h-6" />
                        <span>Backup wiederherstellen</span>
                     </h4>
                     <p className="text-[var(--color-danger-text)]/90 max-w-md">
                        <strong>Achtung:</strong> Das Wiederherstellen eines Backups überschreibt <strong className="font-bold">alle</strong> aktuellen Daten in der App unwiderruflich.
                    </p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".linexb" className="hidden" />
                    <Button variant="danger" onClick={handleRestoreClick}>
                        Backup-Datei auswählen...
                    </Button>
                </div>
            </div>
            
            <DownloadAnleitungModal
                isOpen={isAnleitungModalOpen}
                onClose={() => setIsAnleitungModalOpen(false)}
                onConfirm={handleAnleitungConfirm}
            />

            <CreateBackupPasswordModal
                isOpen={isCreateBackupModalOpen}
                onClose={() => setCreateBackupModalOpen(false)}
                onConfirm={handleCreateBackup}
                isCreating={isCreatingBackup}
            />

            <ConfirmRestoreModal
                isOpen={isConfirmRestoreModalOpen}
                onClose={() => setConfirmRestoreModalOpen(false)}
                onConfirm={onConfirmRestore}
                fileName={fileToRestore?.name || ''}
            />

            <RestoreBackupPasswordModal
                isOpen={isRestorePasswordModalOpen}
                onClose={() => setRestorePasswordModalOpen(false)}
                onConfirm={handleRestore}
                onSuccess={() => { /* Handled inside handleRestore now */ }}
            />
            
            <ConfirmRestoreNormalModal
                isOpen={isNormalMismatchModalOpen}
                onClose={() => setNormalMismatchModalOpen(false)}
                onConfirm={() => {
                    setNormalMismatchModalOpen(false);
                    applyAndLogout(decryptedData);
                }}
                backupVersion={backupVersion}
            />

            <WarningRestoreDangerousModal
                isOpen={isDangerousMismatchModalOpen}
                onClose={() => setDangerousMismatchModalOpen(false)}
                backupVersion={backupVersion}
            />
        </>
    );
};

const KuenstlicheIntelligenzTab: React.FC = () => {
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-6 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Einsatz von Künstlicher Intelligenz (KI) in Linexio</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Um Ihnen erweiterte Funktionen anzubieten, nutzt Linexio in bestimmten Bereichen künstliche Intelligenz. Aktuell betrifft dies die optionalen Werkzeuge "Intelligente Gruppeneinteilung", "Intelligenter Sitzplan" sowie die Generierung von Feedback-Texten für Klausuren.
                </p>
            </div>
            
            <div className="space-y-2">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Ihr Datenschutz hat oberste Priorität</h4>
                <p className="text-[var(--color-text-tertiary)]">
                    Wir verstehen, dass der Schutz von Schülerdaten von größter Bedeutung ist. Daher haben wir einen Prozess implementiert, der sicherstellt, dass <strong className="text-[var(--color-text-primary)]">keine persönlichen Schülerdaten Ihr Gerät verlassen.</strong>
                </p>
            </div>

            <div className="space-y-2">
                <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Wie wir Ihre Daten schützen:</h4>
                <p className="text-[var(--color-text-tertiary)]">
                    Wenn Sie eine KI-Funktion verwenden, werden alle persönlichen Informationen wie Namen direkt auf Ihrem Gerät durch anonyme Platzhalter ersetzt. Nur diese anonymisierten Platzhalter, die von Ihnen vergebenen pädagogischen Merkmale (z.B. "hilfsbereit") und Ihre Anweisung werden an den KI-Dienst gesendet.
                </p>
                <p className="text-[var(--color-text-tertiary)]">
                    Es werden <strong className="text-[var(--color-text-primary)]">niemals</strong> Namen, Geburtsdaten oder andere identifizierbare Informationen übertragen. Dadurch ist es unmöglich, einen Rückschluss auf eine reale Person zu ziehen.
                </p>
                <p className="text-[var(--color-text-tertiary)]">
                    Dieser Prozess erlaubt es uns, Ihnen intelligente Vorschläge zur Unterrichtsorganisation zu machen, während die Privatsphäre Ihrer Schülerinnen und Schüler vollständig gewahrt bleibt. Die Nutzung dieser KI-gestützten Funktionen ist stets optional.
                </p>
            </div>
            
            <div className="bg-[var(--color-ui-highlight)] p-4 rounded-md border border-[var(--color-border)] flex items-start space-x-3 mt-4">
                <InformationCircleIcon className="w-6 h-6 text-[var(--color-accent-text)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--color-text-secondary)] text-sm">
                    <strong>Bitte beachten Sie:</strong> Die Nutzung dieser intelligenten Funktionen ist der einzige Bereich von Linexio, der eine aktive Internetverbindung erfordert.
                </p>
            </div>
        </div>
    );
};

const DatenschutzTab: React.FC = () => {
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Datenschutzerklärung & Datenverarbeitung</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Transparenz ist uns wichtig. Hier erfahren Sie, wie Ihre Daten verarbeitet werden.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-[var(--color-ui-highlight)] p-6 rounded-md border border-[var(--color-border)]">
                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 flex items-center space-x-2">
                        <LockClosedIcon className="w-5 h-5 text-[var(--color-success-text)]" />
                        <span>Grundprinzip: Offline-First</span>
                    </h4>
                    <p className="text-[var(--color-text-tertiary)] text-sm">
                        Linexio ist so konzipiert, dass <strong>alle</strong> von Ihnen eingegebenen Schülerdaten, Noten und Einstellungen ausschließlich lokal und verschlüsselt auf Ihrem Gerät gespeichert werden. 
                        Es erfolgt <strong>keine</strong> automatische Übertragung, Synchronisation oder Speicherung dieser Daten auf externen Servern. Sie haben die volle Kontrolle.
                    </p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Ausnahme: Lizenzierung & Support</h4>
                    <p className="text-[var(--color-text-tertiary)] text-sm mb-4">
                        Wenn Sie die Weiterentwicklung von Linexio durch eine Spende unterstützen und eine Supporter-Lizenz anfordern, oder wenn Sie uns Feedback bzw. Fehler melden, ist eine minimale Datenübertragung erforderlich.
                    </p>
                    
                    <ul className="space-y-3">
                        <li className="bg-[var(--color-ui-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                            <span className="font-bold text-[var(--color-text-primary)] block text-sm mb-1">Welche Daten werden bei einer Lizenzanfrage übertragen?</span>
                            <span className="text-[var(--color-text-secondary)] text-sm">
                                Bei einer Lizenzanfrage übermitteln Sie uns aktiv Ihren Wunschnamen (für die Lizenz) und Ihre E-Mail-Adresse. Optional teilen Sie uns den Namen des PayPal-Kontoinhabers mit, falls dieser abweicht.
                            </span>
                        </li>
                        <li className="bg-[var(--color-ui-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                            <span className="font-bold text-[var(--color-text-primary)] block text-sm mb-1">Wozu werden diese Daten genutzt?</span>
                            <span className="text-[var(--color-text-secondary)] text-sm">
                                Die Daten dienen ausschließlich dazu, Ihre Spende zuzuordnen, Ihren persönlichen Lizenzschlüssel zu generieren und Ihnen diesen per E-Mail zuzusenden.
                            </span>
                        </li>
                        <li className="bg-[var(--color-ui-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                            <span className="font-bold text-[var(--color-text-primary)] block text-sm mb-1">Wie erfolgt die Übertragung?</span>
                            <span className="text-[var(--color-text-secondary)] text-sm">
                                Die Daten werden über eine verschlüsselte Verbindung an unseren Automatisierungs-Dienst gesendet, der uns per E-Mail über Ihre Anfrage informiert. Es findet keine dauerhafte Speicherung in einer Datenbank statt.
                            </span>
                        </li>
                        <li className="bg-[var(--color-ui-secondary)] p-3 rounded-lg border border-[var(--color-border)]">
                            <span className="font-bold text-[var(--color-text-primary)] block text-sm mb-1">Feedback & Fehlermeldungen</span>
                            <span className="text-[var(--color-text-secondary)] text-sm">
                                Bei einer Meldung übermitteln wir zusätzlich technische Metadaten (z.B. App-Version, Gerätetyp). Dies ist für uns hilfreich zur schnellen Problemfindung. Wir löschen diese Daten sofort nach der Bearbeitung.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const InfoTab: React.FC = () => {
    const { appVersion } = useUIContext();
    const [versions, setVersions] = useState<{ version: string; date: string; changes: string[]; }[]>([]);
    const [activeVersion, setActiveVersion] = useState<string | null>(null);

    useEffect(() => {
        fetch('/public/changelog.json')
            .then(res => {
                if (!res.ok) throw new Error('Changelog konnte nicht geladen werden.');
                return res.json();
            })
            .then(data => {
                const sortedVersions = data.versions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setVersions(sortedVersions);
                if (sortedVersions.length > 0) {
                    setActiveVersion(sortedVersions[0].version);
                }
            })
            .catch(console.error);
    }, []);

    const toggleVersion = (version: string) => {
        setActiveVersion(prev => (prev === version ? null : version));
    };

    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Über Linexio</h3>
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-[var(--color-text-secondary)]">
                        Version {appVersion}
                    </p>
                </div>
                
                <p className="text-[var(--color-text-tertiary)] pt-2">
                    Linexio ist ein privates Projekt, das mit viel Herzblut entwickelt wird, um Ihren Lehreralltag zu erleichtern.
                    Vielen Dank, dass Sie die App nutzen!
                </p>
            </div>
            
            {versions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Versionshistorie</h3>
                    <div className="space-y-2">
                        {versions.map((version) => (
                            <div key={version.version} className="bg-[var(--color-ui-highlight)] rounded-lg border border-[var(--color-border)]">
                                <button 
                                    onClick={() => toggleVersion(version.version)}
                                    className="w-full flex justify-between items-center p-4 text-left"
                                    aria-expanded={activeVersion === version.version}
                                    aria-controls={`changelog-${version.version}`}
                                >
                                    <div className="font-semibold text-[var(--color-text-primary)]">
                                        Version {version.version}
                                        <span className="ml-4 text-sm font-normal text-[var(--color-text-tertiary)]">
                                            {new Date(version.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${activeVersion === version.version ? 'rotate-180' : ''}`} />
                                </button>
                                {activeVersion === version.version && (
                                    <div id={`changelog-${version.version}`} className="px-4 pb-4 animate-fade-in">
                                        <ul className="space-y-2 list-disc list-inside text-[var(--color-text-secondary)] pl-2">
                                            {version.changes.map((change, index) => (
                                                <li key={index}><span className="text-[var(--color-text-primary)]">{change}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SupportTab: React.FC = () => {
    const { showToast } = useToastContext();
    const { licenseStatus, validateAndApplyKey, licenseeName } = useLicenseContext();
    const { setActiveSettingsTab } = useUIContext();
    const [licenseKey, setLicenseKey] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [isRequestLicenseModalOpen, setIsRequestLicenseModalOpen] = useState(false);
    
    const licenseInfo = useMemo(() => {
        switch (licenseStatus) {
            case 'PRO':
                return { text: 'Supporter-Version', className: 'inline-flex items-center px-2 py-0.5 rounded text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' };
            case 'ALPHA_TESTER':
                return { text: 'Alpha-Tester Version', className: 'inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' };
            case 'FREEMIUM':
            default:
                return { text: 'Standard-Version', className: 'inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
        }
    }, [licenseStatus]);

    const handleActivateLicense = async () => {
        if (!licenseKey.trim()) return;
        setIsActivating(true);
        const result = await validateAndApplyKey(licenseKey);
        setIsActivating(false);
        
        if (result.success) {
            showToast('Supporter-Status aktiviert! Vielen Dank! 🎉', 'success');
            setLicenseKey('');
        } else {
            showToast(result.message || 'Fehler beim Aktivieren.', 'error');
        }
    };

    const handleBuyLicense = () => {
        window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=thor0907@gmx.de&item_name=Linexio+Project+Support&currency_code=EUR', '_blank');
    };

    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[var(--color-accent-text)]">Projekt unterstützen</h3>
                <span className={licenseInfo.className}>
                    {licenseInfo.text}
                </span>
            </div>

            {licenseStatus === 'PRO' ? (
                <div className="space-y-4">
                    <div className="bg-[var(--color-ui-highlight)] p-6 rounded-lg border border-[var(--color-border)]">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <CheckCircleIcon className="w-16 h-16 text-[var(--color-success-text)]" />
                            <h4 className="text-xl font-bold text-[var(--color-text-primary)]">
                                Vielen Dank für Ihre Unterstützung!
                            </h4>
                            <p className="text-sm text-[var(--color-text-tertiary)] max-w-md">
                                Dank Ihnen können wir die Serverkosten decken und Linexio weiterentwickeln. Sie haben Zugriff auf alle Features, inklusive KI und dem exklusiven Gold-Theme.
                            </p>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                            <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                                <span>Registriert auf:</span>
                                <strong className="text-[var(--color-text-primary)]">{licenseeName || 'Unbekannt'}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-[var(--color-ui-highlight)] p-6 rounded-lg border border-[var(--color-border)]">
                        <h4 className="font-bold text-[var(--color-text-primary)] mb-4">Weitere Unterstützung & Lizenzverwaltung</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <Button onClick={handleBuyLicense} className="w-full justify-center shadow-md">
                                Erneut spenden
                            </Button>
                            
                            <Button onClick={() => setIsRequestLicenseModalOpen(true)} variant="secondary" className="w-full justify-center">
                                Neuen Schlüssel anfordern
                            </Button>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-6">
                             <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Lizenzschlüssel wechseln</p>
                             <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Input 
                                        label=""
                                        id="license-key-update"
                                        placeholder="Neuen Schlüssel eingeben..." 
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleActivateLicense} disabled={!licenseKey.trim() || isActivating} className="h-10">
                                    {isActivating ? <SpinnerIcon /> : 'Wechseln'}
                                </Button>
                            </div>
                        </div>
                     </div>
                </div>
            ) : (
                <div className="bg-[var(--color-ui-highlight)] px-4 pb-4 pt-2 rounded-xl border-2 border-[var(--color-accent-primary)]/30 shadow-lg space-y-6 relative overflow-hidden animate-fade-in">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[var(--color-accent-primary)]/10 rounded-full blur-xl pointer-events-none"></div>
                    
                    <div className="text-center space-y-4">
                        <div className="text-sm text-[var(--color-text-secondary)] space-y-2 text-left">
                            <p>
                                Es gibt keine versteckten Kosten und kein Abo. Linexio ist ein privates Herzensprojekt. 
                                Sie können unbegrenzt Lerngruppen und Schüler anlegen und alle Grundfunktionen dauerhaft kostenlos nutzen.
                            </p>
                            <p>
                                In manchen Bereichen haben wir optional die Möglichkeit eingebaut, sich von einer KI unterstützen zu lassen. Da jedoch die Bereitstellung von künstlicher Intelligenz laufende Serverkosten verursacht, haben wir die Nutzung der KI eingeschränkt.
                            </p>
                            <p>
                                Wenn Ihnen Linexio gefällt, würden wir uns sehr über Ihre Unterstützung freuen. ❤️
                            </p>
                        </div>
                    </div>

                    <div className="bg-[var(--color-ui-primary)]/50 rounded-lg border border-[var(--color-border)] overflow-hidden">
                        {/* Header */}
                        <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-ui-secondary)]/30">
                            <h5 className="font-bold text-[var(--color-accent-text)] text-center text-base">
                                Als Dankeschön für Unterstützer:
                            </h5>
                        </div>

                        {/* Supporter Features */}
                        <ul className="space-y-3 text-sm text-[var(--color-text-secondary)] p-4">
                            <li className="flex items-start gap-3">
                                <SparklesIcon className="w-5 h-5 text-[var(--color-accent-text)] flex-shrink-0" />
                                <span>Zugriff auf <strong className="text-[var(--color-text-primary)]">alle KI-Funktionen</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <EyeDropperIcon className="w-5 h-5 text-[var(--color-accent-text)] flex-shrink-0" />
                                <span>Das exklusive <strong className="text-[var(--color-text-primary)]">Golden Hour Theme</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <UserCircleIcon className="w-5 h-5 text-[var(--color-accent-text)] flex-shrink-0" />
                                <span>Persönliche Anrede im Dashboard</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-[var(--color-accent-secondary-transparent-40)] p-4 rounded-lg border border-[var(--color-accent-secondary-transparent-50)] text-sm">
                        <h5 className="font-bold text-[var(--color-accent-text)] mb-2 flex items-center gap-2">
                            <InformationCircleIcon className="w-5 h-5" />
                            Ablauf der Freischaltung:
                        </h5>
                        <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-secondary)] ml-1">
                            <li>Spenden Sie einen beliebigen Betrag via PayPal.</li>
                            <li>Klicken Sie auf <strong>"Lizenz anfordern"</strong>.</li>
                            <li>Wir senden Ihnen Ihren persönlichen Schlüssel manuell per E-Mail zu.</li>
                        </ol>
                        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                            Hinweis: mehr zu den übermittelten Daten finden Sie im Bereich
                            <button onClick={() => setActiveSettingsTab('datenschutz')} className="ml-1 underline hover:text-[var(--color-text-primary)]">Datenschutz</button>.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button onClick={handleBuyLicense} className="w-full justify-center shadow-lg shadow-[var(--color-accent-primary)]/20">
                            1. Spenden & Unterstützen
                        </Button>
                        
                        <Button onClick={() => setIsRequestLicenseModalOpen(true)} variant="secondary" className="w-full justify-center">
                            2. Lizenz anfordern
                        </Button>
                    </div>

                    <div className="border-t border-[var(--color-border)] pt-6 mt-6">
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Supporter-Schlüssel erhalten? Hier eingeben:</p>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Input 
                                    label=""
                                    id="license-key"
                                    placeholder="Schlüssel einfügen..." 
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleActivateLicense} disabled={!licenseKey.trim() || isActivating} className="h-10">
                                {isActivating ? <SpinnerIcon /> : 'Freischalten'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <RequestLicenseModal
                isOpen={isRequestLicenseModalOpen}
                onClose={() => setIsRequestLicenseModalOpen(false)}
            />
        </div>
    );
};


const EinstellungenView: React.FC = () => {
  const { 
    activeSettingsTab, 
    theme, 
    setTheme,
    currentSchoolYear,
    systemSchoolYear,
    onSetCurrentSchoolYear,
    advanceSystemSchoolYear,
    setHeaderConfig,
   } = useUIContext();
   
   const { schoolYears } = useLerngruppenContext();
   const { notenschluesselMap, onUpdateNotenschluesselMap } = useNotenContext();

  useEffect(() => {
    setHeaderConfig({
      title: 'Einstellungen',
      subtitle: <p className="text-sm text-[var(--color-accent-text)]">App-Konfiguration</p>,
      onBack: undefined,
      banner: null
    });
  }, [setHeaderConfig]);
  
  const renderContent = () => {
      switch (activeSettingsTab) {
          case 'allgemein':
              return <AllgemeinTab currentSchoolYear={currentSchoolYear} systemSchoolYear={systemSchoolYear} onSetCurrentSchoolYear={onSetCurrentSchoolYear} advanceSystemSchoolYear={advanceSystemSchoolYear} schoolYears={schoolYears} />;
          case 'notenschluessel':
              return <NotenschluesselTab 
                        notenschluesselMap={notenschluesselMap}
                        onUpdateNotenschluesselMap={onUpdateNotenschluesselMap}
                        notensysteme={PREDEFINED_NOTENSYSTEME}
                     />;
          case 'archiv':
              return <ArchivTab currentSchoolYear={currentSchoolYear} systemSchoolYear={systemSchoolYear} onSetCurrentSchoolYear={onSetCurrentSchoolYear} advanceSystemSchoolYear={advanceSystemSchoolYear} schoolYears={schoolYears} />;
          case 'themes':
              return <ThemesTab activeTheme={theme} onChangeTheme={setTheme} />;
          case 'daten-sicherheit':
              return <DatenSicherheitTab />;
          case 'backup':
              return <BackupTab />;
          case 'ki':
              return <KuenstlicheIntelligenzTab />;
          case 'datenschutz':
              return <DatenschutzTab />;
          case 'info':
              return <InfoTab />;
          case 'support':
              return <SupportTab />;
          default:
              return null;
      }
  }

  return (
    <>
      {renderContent()}
    </>
  );
};

export default EinstellungenView;
