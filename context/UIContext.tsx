import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect, useRef } from 'react';
import { useLocalStorage, getSystemSchoolYear, calculateNextSchoolYear } from './utils';
import { ChangelogData } from './types';
import { CHANGELOG } from '../data/changelog';

export type View = 'dashboard' | 'lerngruppen' | 'lerngruppeDetail' | 'schuelerAkte' | 'einstellungen' | 'tools-chooser' | 'notenverwaltung-chooser' | 'notenverwaltung' | 'leistungsnachweisDetail' | 'checklisten' | 'zufallsschueler' | 'gruppeneinteilung' | 'sitzplan' | 'notizen' | 'klausurAuswertung' | 'schuelerAuswertung' | 'sammelnoteAuswertung' | 'namenstraining';
export type Theme = 'dark' | 'terranova' | 'solaris' | 'sepia' | 'amethyst' | 'scribe' | 'gold';
export type SettingsTab = 'allgemein' | 'themes' | 'notenschluessel' | 'daten-sicherheit' | 'backup' | 'ki' | 'archiv' | 'datenschutz' | 'info' | 'support';
export type SidebarContext = 'main' | 'settings';

export interface HeaderConfig {
  title: string;
  subtitle: React.ReactNode;
  onBack?: () => void;
  banner?: React.ReactNode;
  actions?: React.ReactNode;
}

interface UIContextState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeView: View;
  activeTool: string | null;
  selectedLerngruppeId: string | undefined;
  selectedSchuelerId: string | undefined;
  selectedLeistungsnachweisId: string | undefined;
  selectedChecklisteId?: string;
  handleNavigate: (view: View, lerngruppeId?: string, schuelerId?: string, leistungsnachweisId?: string, settingsTab?: SettingsTab, checklisteId?: string) => void;
  onBackToLerngruppen: () => void;
  onBackToLerngruppeDetail: () => void;
  onBackToNotenuebersicht: () => void;
  onBackToKlausurAuswertung: () => void;
  onShowTool: (tool: string, lerngruppeId?: string, checklisteId?: string) => void;
  onToolClassChosen: (lerngruppeId: string) => void;
  onShowNotenverwaltung: (lerngruppeId?: string) => void;
  currentDate: Date;
  bundesland: string | null;
  setBundesland: (bundesland: string | null) => void;
  systemSchoolYear: string;
  advanceSystemSchoolYear: () => void;
  currentSchoolYear: string;
  onSetCurrentSchoolYear: (newYear: string) => void;
  headerConfig: HeaderConfig;
  setHeaderConfig: React.Dispatch<React.SetStateAction<HeaderConfig>>;
  sidebarContext: SidebarContext;
  activeSettingsTab: SettingsTab;
  setActiveSettingsTab: (tab: SettingsTab) => void;
  handleBackToMain: () => void;
  focusedSchuelerId: string | null;
  onToggleFocusSchueler: (schuelerId: string) => void;
  clearSelectedChecklisteId: () => void;
  appVersion: string;
  
  // Update-related state
  isUpdateAvailable: boolean;
  triggerUpdate: () => void;
  isChangelogModalOpen: boolean;
  showChangelog: () => void;
  hideChangelog: () => void;
  changelogData: ChangelogData | null;
}

// FIX: Export UIContext to allow its use in test files for providing mock values.
export const UIContext = createContext<UIContextState | undefined>(undefined);

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIContextProvider');
  }
  return context;
};

export const UIContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('sidebarOpen', true);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [bundesland, setBundesland] = useLocalStorage<string | null>('bundesland', null);
  
  // ARCHITEKTONISCHES MEMORANDUM: System-Schuljahr vs. Aktuelles Schuljahr
  // systemSchoolYear: Das "offizielle" Schuljahr laut App-Status. Wird manuell vom User hochgeschaltet ("Schuljahr abschließen").
  // currentSchoolYear: Das aktuell vom User *betrachtete* Schuljahr (Ansicht).
  // Initialwert: Wenn nichts gespeichert ist, berechnen wir es einmalig aus dem Datum.
  const [systemSchoolYear, setSystemSchoolYear] = useLocalStorage('systemSchoolYear', getSystemSchoolYear());
  const [currentSchoolYear, setCurrentSchoolYear] = useLocalStorage('currentSchoolYear', systemSchoolYear);

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedLerngruppeId, setSelectedLerngruppeId] = useState<string | undefined>();
  const [selectedSchuelerId, setSelectedSchuelerId] = useState<string | undefined>();
  const [selectedLeistungsnachweisId, setSelectedLeistungsnachweisId] = useState<string | undefined>();
  const [selectedChecklisteId, setSelectedChecklisteId] = useState<string | undefined>();
  const [focusedSchuelerId, setFocusedSchuelerId] = useState<string | null>(null);

  const [currentDate] = useState(new Date());
  
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({ title: 'Dashboard', subtitle: 'Willkommen zurück!' });
  const [sidebarContext, setSidebarContext] = useState<SidebarContext>('main');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('allgemein');
  const [appVersion, setAppVersion] = useState<string>('lädt...');
  
  // Stores the version string that the user has last seen (acknowledged via modal close)
  const [lastSeenVersion, setLastSeenVersion] = useLocalStorage<string>('lastSeenVersion', '');

  // --- Update Logic State ---
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChangelogModalOpen, setChangelogModalOpen] = useState(false);
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const showChangelog = useCallback(() => setChangelogModalOpen(true), []);
  
  const hideChangelog = useCallback(() => {
      setChangelogModalOpen(false);
      // When closing the changelog, we mark the current version as seen.
      if (appVersion && appVersion !== 'lädt...' && appVersion !== 'Unbekannt' && appVersion !== 'Fehler') {
          setLastSeenVersion(appVersion);
      }
  }, [appVersion, setLastSeenVersion]);

  // --- Aggressive Update Wächter ---
  
  // Diese Funktion prüft aktiv auf Updates, anstatt nur auf Browser-Events zu warten.
  const checkForUpdates = useCallback(async () => {
      const reg = registrationRef.current;
      if (!reg) return;
      
      // Wenn bereits ein Update bereitsteht, müssen wir nicht mehr suchen.
      if (updateRegistration && isUpdateAvailable) return;

      try {
          // Zwingt den Browser, die SW-Datei neu vom Server zu laden und Byte-für-Byte zu vergleichen.
          await reg.update();
          
          // Nach dem Check prüfen: Wartet jemand?
          if (reg.waiting) {
              console.log('Update Wächter: Wartender Service Worker gefunden.');
              setUpdateRegistration(reg);
              setIsUpdateAvailable(true);
          }
      } catch (err) {
          // Dies ist offline völlig normal.
          console.debug('Update Wächter: Check fehlgeschlagen (wahrscheinlich offline).', err);
      }
  }, [updateRegistration, isUpdateAvailable]);

  const triggerUpdate = useCallback(() => {
    if (updateRegistration && updateRegistration.waiting) {
      updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Reset state immediately for better UX
      setIsUpdateAvailable(false);
    } else {
        // Fallback: Manchmal ist waiting null, obwohl ein Update da ist. Reload erzwingen.
        window.location.reload();
    }
  }, [updateRegistration]);
  
  // CHANGELOG LOADING LOGIC
  useEffect(() => {
    setChangelogData(CHANGELOG);
    
    if (CHANGELOG?.versions?.[0]?.version) {
        const latestVersion = CHANGELOG.versions[0].version;
        setAppVersion(latestVersion);
        
        // FEATURE: Auto-Show Changelog if version changed
        if (latestVersion !== lastSeenVersion) {
            setTimeout(() => {
                setChangelogModalOpen(true);
            }, 1000);
        }
    } else {
        setAppVersion('Unbekannt');
    }
  }, [lastSeenVersion]);


  useEffect(() => {
      const registerServiceWorker = async () => {
          if ('serviceWorker' in navigator) {
              try {
                  const reg = await navigator.serviceWorker.register('service-worker.js', { scope: './' });
                  registrationRef.current = reg;

                  // Initial check: is there already a waiting worker?
                  if (reg.waiting) {
                      console.log('SW Setup: Wartender Worker beim Start gefunden.');
                      setUpdateRegistration(reg);
                      setIsUpdateAvailable(true);
                  }

                  // Standard listener for updates arriving while app is open
                  reg.onupdatefound = () => {
                      const installingWorker = reg.installing;
                      if (installingWorker) {
                          installingWorker.onstatechange = () => {
                              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                  console.log('SW Setup: Neuer Inhalt verfügbar (onstatechange).');
                                  setUpdateRegistration(reg);
                                  setIsUpdateAvailable(true);
                              }
                          };
                      }
                  };
                  
                  // Initialen manuellen Check durchführen (nach kurzer Verzögerung, um Netzwerk nicht beim Boot zu blockieren)
                  setTimeout(checkForUpdates, 3000);

              } catch (error) {
                  console.error('Error during service worker registration:', error);
              }

              let refreshing = false;
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (!refreshing) {
                      window.location.reload();
                      refreshing = true;
                  }
              });
          }
      };

      window.addEventListener('load', registerServiceWorker);
      
      return () => {
          window.removeEventListener('load', registerServiceWorker);
      };
  }, [checkForUpdates]);

  // Aggressive Checks: Visibility Change & Interval & Navigation
  useEffect(() => {
      // 1. Check wenn App wieder in den Vordergrund kommt
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              checkForUpdates();
          }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // 2. Check periodisch (alle 60 Minuten)
      const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000);

      // 3. Sofortiger Check bei View-Wechsel (Navigation)
      // Dies stellt sicher, dass Nutzer, die die App intensiv nutzen, auch Updates erhalten
      checkForUpdates();

      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearInterval(intervalId);
      };
  }, [checkForUpdates, activeView]); // Trigger on activeView change too

  // --- End of Update Logic ---


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const root = document.querySelector('html');
    if (root) {
        root.className = `theme-${theme}`;
    }
  }, [theme]);

  const handleNavigate = useCallback((view: View, lerngruppeId?: string, schuelerId?: string, leistungsnachweisId?: string, settingsTab?: SettingsTab, checklisteId?: string) => {
    setActiveView(view);
    setSelectedLerngruppeId(lerngruppeId);
    setSelectedSchuelerId(schuelerId);
    setSelectedLeistungsnachweisId(leistungsnachweisId);
    setFocusedSchuelerId(null);
    if (view === 'einstellungen') {
      setSidebarContext('settings');
      setActiveSettingsTab(settingsTab || 'allgemein');
    } else {
      setSidebarContext('main');
    }
    setSelectedChecklisteId(checklisteId);
  }, []);
  
  const clearSelectedChecklisteId = useCallback(() => setSelectedChecklisteId(undefined), []);

  const onBackToLerngruppen = useCallback(() => handleNavigate('lerngruppen'), [handleNavigate]);
  const onBackToLerngruppeDetail = useCallback(() => handleNavigate('lerngruppeDetail', selectedLerngruppeId), [handleNavigate, selectedLerngruppeId]);
  const onBackToNotenuebersicht = useCallback(() => handleNavigate('notenverwaltung', selectedLerngruppeId), [handleNavigate, selectedLerngruppeId]);
  const onBackToKlausurAuswertung = useCallback(() => handleNavigate('klausurAuswertung', selectedLerngruppeId, undefined, selectedLeistungsnachweisId), [handleNavigate, selectedLerngruppeId, selectedLeistungsnachweisId]);
  
  const onShowTool = useCallback((tool: string, lerngruppeId?: string, checklisteId?: string) => {
    setActiveTool(tool);
    if (lerngruppeId) {
      handleNavigate(tool as View, lerngruppeId, undefined, undefined, undefined, checklisteId);
    } else {
      handleNavigate('tools-chooser');
    }
    setIsSidebarOpen(false);
  }, [handleNavigate, setActiveTool, setIsSidebarOpen]);

  const onToolClassChosen = useCallback((lerngruppeId: string) => {
    if (activeTool) {
      handleNavigate(activeTool as View, lerngruppeId);
    }
  }, [activeTool, handleNavigate]);

  const onShowNotenverwaltung = useCallback((lerngruppeId?: string) => {
    if (lerngruppeId) {
      handleNavigate('notenverwaltung', lerngruppeId);
    } else {
      handleNavigate('notenverwaltung-chooser');
    }
    setIsSidebarOpen(false);
  }, [handleNavigate, setIsSidebarOpen]);

  const handleBackToMain = useCallback(() => setSidebarContext('main'), []);
  
  const onSetCurrentSchoolYear = useCallback((newYear: string) => {
      setCurrentSchoolYear(newYear);
      handleNavigate('lerngruppen'); // Go back to overview when changing year
  }, [handleNavigate, setCurrentSchoolYear]);

  const advanceSystemSchoolYear = useCallback(() => {
      const nextYear = calculateNextSchoolYear(systemSchoolYear);
      setSystemSchoolYear(nextYear);
      setCurrentSchoolYear(nextYear);
  }, [systemSchoolYear, setSystemSchoolYear, setCurrentSchoolYear]);

  const onToggleFocusSchueler = useCallback((schuelerId: string) => {
    setFocusedSchuelerId(prev => (prev === schuelerId ? null : schuelerId));
  }, []);

  const value = {
    isSidebarOpen, setIsSidebarOpen, theme, setTheme, activeView, activeTool,
    selectedLerngruppeId, selectedSchuelerId, selectedLeistungsnachweisId,
    selectedChecklisteId,
    handleNavigate, onBackToLerngruppen, onBackToLerngruppeDetail, onBackToNotenuebersicht, onBackToKlausurAuswertung,
    onShowTool, onToolClassChosen, onShowNotenverwaltung, currentDate, bundesland, setBundesland,
    systemSchoolYear, advanceSystemSchoolYear, currentSchoolYear, onSetCurrentSchoolYear,
    headerConfig, setHeaderConfig, sidebarContext, activeSettingsTab, setActiveSettingsTab, handleBackToMain,
    focusedSchuelerId, onToggleFocusSchueler,
    clearSelectedChecklisteId,
    appVersion,
    // Update-related
    isUpdateAvailable,
    triggerUpdate,
    isChangelogModalOpen,
    showChangelog,
    hideChangelog,
    changelogData
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};