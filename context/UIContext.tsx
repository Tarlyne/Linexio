
import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect, useRef } from 'react';
import { useLocalStorage, getSystemSchoolYear, calculateNextSchoolYear } from './utils';

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
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const showChangelog = useCallback(() => setChangelogModalOpen(true), []);
  
  const hideChangelog = useCallback(() => {
      setChangelogModalOpen(false);
      // When closing the changelog, we mark the current version as seen.
      if (appVersion && appVersion !== 'lädt...' && appVersion !== 'Unbekannt' && appVersion !== 'Fehler') {
          setLastSeenVersion(appVersion);
      }
  }, [appVersion, setLastSeenVersion]);

  // --- Robust Update Checking Logic ---
  
  // This function performs a manual check against the server
  const checkForUpdates = useCallback(async () => {
      const reg = registrationRef.current;
      if (!reg) return;
      
      // If we already found an update, no need to keep checking until user refreshes
      if (updateRegistration) return; 

      try {
          // Force the browser to check for a new service worker file
          await reg.update();
          
          // Explicitly check if a waiting worker exists after the update check
          if (reg.waiting) {
              console.log('Update found (waiting state detected via manual check).');
              setUpdateRegistration(reg);
          }
      } catch (err) {
          // This is expected offline, so we use debug level to keep console clean
          console.debug('Manual update check failed (likely offline):', err);
      }
  }, [updateRegistration]);

  const triggerUpdate = useCallback(() => {
    if (updateRegistration && updateRegistration.waiting) {
      updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Reset state immediately for better UX
      setIsUpdateAvailable(false);
    }
  }, [updateRegistration]);
  
  useEffect(() => {
    // Attempt to load from /public/changelog.json based on user request to fix iOS issues
    fetch('/public/changelog.json')
        .then(res => {
            if (!res.ok) throw new Error('Changelog konnte nicht geladen werden.');
            return res.json();
        })
        .then(data => {
            if (data?.versions?.[0]?.version) {
                const latestVersion = data.versions[0].version;
                setAppVersion(latestVersion);
                
                // FEATURE: Auto-Show Changelog if version changed
                // We compare the fetched latest version with the locally stored 'lastSeenVersion'.
                // If they differ, we open the modal.
                // We use a small timeout to ensure the app is fully rendered before showing the modal.
                if (latestVersion !== lastSeenVersion) {
                    setTimeout(() => {
                        setChangelogModalOpen(true);
                    }, 1000);
                }
            } else {
                setAppVersion('Unbekannt');
            }
        })
        .catch(() => setAppVersion('Fehler'));
  }, [lastSeenVersion]); // Run when lastSeenVersion is loaded (initial)

  // When an update is detected, set the flag. 
  useEffect(() => {
    if (updateRegistration) {
      setIsUpdateAvailable(true);
    }
  }, [updateRegistration]);

  useEffect(() => {
      const registerServiceWorker = async () => {
          if ('serviceWorker' in navigator) {
              try {
                  const reg = await navigator.serviceWorker.register('service-worker.js', { scope: './' });
                  registrationRef.current = reg;

                  // Initial check: is there already a waiting worker?
                  if (reg.waiting) {
                      console.log('Update found (waiting state detected on load).');
                      setUpdateRegistration(reg);
                  }

                  // Standard listener for updates arriving while app is open
                  reg.onupdatefound = () => {
                      const installingWorker = reg.installing;
                      if (installingWorker) {
                          installingWorker.onstatechange = () => {
                              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                  console.log('New content is available for update (detected via onstatechange).');
                                  setUpdateRegistration(reg);
                              }
                          };
                      }
                  };
                  
                  // Perform an initial manual check shortly after load
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

  // Periodic and Event-based Checks
  useEffect(() => {
      // 1. Check when app becomes visible (e.g. switching back from another app)
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              checkForUpdates();
          }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // 2. Check periodically (every 60 minutes)
      const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000);

      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearInterval(intervalId);
      };
  }, [checkForUpdates]);

  // 3. Check on navigation (Aggressive mode)
  useEffect(() => {
      checkForUpdates();
  }, [activeView, checkForUpdates]);

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
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
