import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { useLerngruppenContext } from '../../context/LerngruppenContext';
import { useUIContext } from '../../context/UIContext';
import { PREDEFINED_NOTENSYSTEME, Lerngruppe } from '../../context/types';
import ThemesTab from './einstellungen/FarbenTab';
import { useNotenContext } from '../../context/NotenContext';
import NotenschluesselTab from './einstellungen/BewertungTab';
import { ExclamationCircleIcon, InboxArrowDownIcon, SpinnerIcon, InformationCircleIcon, LockClosedIcon, ShieldCheckIcon, FingerPrintIcon, ChevronDownIcon } from '../icons';
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
import { isAppleMobile } from '../../context/utils';
import DownloadAnleitungModal from '../modals/DownloadAnleitungModal';
import ConfirmRestoreNormalModal from '../modals/ConfirmRestoreNormalModal';
import WarningRestoreDangerousModal from '../modals/WarningRestoreDangerousModal';


interface TabProps {
  currentSchoolYear: string;
  systemSchoolYear: string;
  onSetCurrentSchoolYear: (newYear: string) => void;
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

const AllgemeinTab: React.FC<TabProps> = ({ currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear }) => {
    const { bundesland, setBundesland } = useUIContext();

    const handleFinishYear = () => {
        const [startStr] = currentSchoolYear.split('/');
        const start = parseInt(startStr, 10);
        const nextYear = `${String(start + 1).padStart(2, '0')}/${String(start + 2).padStart(2, '0')}`;
        onSetCurrentSchoolYear(nextYear);
    };
    
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">System & Standort</h3>
                <p className="text-[var(--color-text-tertiary)]">
                    Das aktuell laut Systemdatum gültige Schuljahr ist <span className="font-semibold text-[var(--color-accent-text)]">{systemSchoolYear}</span>.
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
                            Schließen Sie das aktuelle Schuljahr ab und wechseln Sie zum nächsten. Dies ändert die Ansicht auf das Schuljahr <strong>{(() => {
                                 const [startStr] = currentSchoolYear.split('/');
                                 const nextYearStart = parseInt(startStr, 10) + 1;
                                 return `${String(nextYearStart).padStart(2, '0')}/${String(nextYearStart + 1).padStart(2, '0')}`;
                            })()}</strong>.
                        </p>
                    </div>
                </div>
                <Button onClick={handleFinishYear}>
                    Schuljahr {currentSchoolYear} abschließen &amp; neues beginnen
                </Button>
            </div>
        </div>
    );
};

const ArchivTab: React.FC<TabProps> = ({ currentSchoolYear, systemSchoolYear, onSetCurrentSchoolYear, schoolYears }) => {
    const archiveYears = schoolYears.filter(y => y !== systemSchoolYear);
    const isCurrentlyInArchive = currentSchoolYear !== systemSchoolYear;

    const options = [
        { 
            value: systemSchoolYear, 
            label: isCurrentlyInArchive ? `« Zurück zum aktuellen Schuljahr` : 'Bitte wählen...' 
        },
        ...archiveYears.map(y => ({ value: y, label: `Schuljahr ${y}` }))
    ];
    
    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Archivierte Schuljahre</h3>
                <p className="text-[var(--color-text-tertiary)] mb-4">
                    Wählen Sie ein vergangenes Schuljahr aus, um dessen Daten (Lerngruppen, Schüler, etc.) einzusehen.
                    In der Archiv-Ansicht können keine Daten verändert werden. Um Ihnen den Start in ein neues Schuljahr zu erleichtern, können Sie jedoch komplette Lerngruppen mitsamt der Schülerliste in das aktuelle Schuljahr kopieren.
                </p>
                <div className="max-w-xs">
                    <Select
                        label="Archiviertes Schuljahr auswählen"
                        id="archive-year-select"
                        value={currentSchoolYear}
                        onChange={(e) => onSetCurrentSchoolYear(e.target.value)}
                        options={options}
                    />
                </div>
            </div>
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
                    <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Datenspeicherung & Sicherheit</h3>
                    <p className="text-[var(--color-text-tertiary)]">
                        Ihre sensiblen Daten sind sicher. Linexio speichert alle Informationen ausschließlich verschlüsselt direkt auf Ihrem Gerät. Es findet keine Übertragung an externe Server oder Cloud-Dienste statt, sodass Sie jederzeit die volle Kontrolle behalten.
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

const InfoTab: React.FC = () => {
    const { showToast } = useToastContext();
    const { licenseStatus } = useLicenseContext();
    const { appVersion } = useUIContext();
    const [tapCount, setTapCount] = useState(0);
    const tapTimeoutRef = useRef<number | null>(null);

    interface Version {
        version: string;
        date: string;
        changes: string[];
    }
    const [versions, setVersions] = useState<Version[]>([]);
    const [activeVersion, setActiveVersion] = useState<string | null>(null);

    useEffect(() => {
        fetch('/public/changelog.json')
            .then(res => {
                if (!res.ok) throw new Error('Changelog konnte nicht geladen werden.');
                return res.json();
            })
            .then(data => {
                const sortedVersions = data.versions.sort((a: Version, b: Version) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setVersions(sortedVersions);
                if (sortedVersions.length > 0) {
                    setActiveVersion(sortedVersions[0].version);
                }
            })
            .catch(console.error);
    }, []);

    const licenseInfo = useMemo(() => {
        switch (licenseStatus) {
            case 'PRO':
                return { text: 'Pro Version', className: 'font-bold text-[var(--color-accent-text)]' };
            case 'ALPHA_TESTER':
                return { text: 'Alpha-Tester Version', className: 'font-semibold text-[var(--color-text-secondary)]' };
            case 'FREEMIUM':
            default:
                return { text: 'Freemium Version', className: 'font-semibold text-[var(--color-text-secondary)]' };
        }
    }, [licenseStatus]);

    const handleVersionClick = useCallback(() => {
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }

        const newTapCount = tapCount + 1;
        setTapCount(newTapCount);

        if (newTapCount >= 7) {
            licenseStore.actions.setLicenseStatus('PRO');
            showToast('Boss-Modus: PRO-Lizenz aktiviert!', 'success');
            setTapCount(0);
        } else {
            tapTimeoutRef.current = window.setTimeout(() => {
                setTapCount(0);
            }, 500); // Reset after 500ms
        }
    }, [tapCount, showToast]);

    const toggleVersion = (version: string) => {
        setActiveVersion(prev => (prev === version ? null : version));
    };

    return (
        <div className="bg-[var(--color-ui-primary)] p-8 rounded-lg border border-[var(--color-border)] w-full max-w-3xl space-y-8 mx-auto">
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[var(--color-accent-text)] mb-2">Über Linexio</h3>
                <p
                    className="font-semibold text-[var(--color-text-secondary)] cursor-pointer"
                    onClick={handleVersionClick}
                    aria-label="App-Version, mehrfach tippen für eine Überraschung"
                >
                    Version {appVersion}
                </p>
                <p className={licenseInfo.className}>
                    Lizenz: {licenseInfo.text}
                </p>
                <p className="text-[var(--color-text-tertiary)]">
                    Linexio ist ein moderner, offline-fähiger Assistent für Lehrkräfte, entwickelt, um den Verwaltungsaufwand zu minimieren und mehr Zeit für das Wesentliche zu schaffen: den Unterricht.
                </p>
                <p className="text-[var(--color-text-tertiary)] pt-4">
                    Vielen Dank, dass Sie an dieser Testphase teilnehmen. Ihr Feedback ist entscheidend, um Linexio zu verbessern.
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


const EinstellungenView: React.FC = () => {
  const { 
    activeSettingsTab, 
    theme, 
    setTheme,
    currentSchoolYear,
    systemSchoolYear,
    onSetCurrentSchoolYear,
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
              return <AllgemeinTab currentSchoolYear={currentSchoolYear} systemSchoolYear={systemSchoolYear} onSetCurrentSchoolYear={onSetCurrentSchoolYear} schoolYears={schoolYears} />;
          case 'notenschluessel':
              return <NotenschluesselTab 
                        notenschluesselMap={notenschluesselMap}
                        onUpdateNotenschluesselMap={onUpdateNotenschluesselMap}
                        notensysteme={PREDEFINED_NOTENSYSTEME}
                     />;
          case 'archiv':
              return <ArchivTab currentSchoolYear={currentSchoolYear} systemSchoolYear={systemSchoolYear} onSetCurrentSchoolYear={onSetCurrentSchoolYear} schoolYears={schoolYears} />;
          case 'themes':
              return <ThemesTab activeTheme={theme} onChangeTheme={setTheme} />;
          case 'daten-sicherheit':
              return <DatenSicherheitTab />;
          case 'backup':
              return <BackupTab />;
          case 'ki':
              return <KuenstlicheIntelligenzTab />;
          case 'info':
              return <InfoTab />;
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