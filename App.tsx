import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { UIContextProvider } from './context/UIContext';
import { LerngruppenContextProvider } from './context/LerngruppenContext';
import { SecurityContextProvider, useSecurityContext } from './context/SecurityContext';
import UnlockScreen from './components/UnlockScreen';
import { ToolsContextProvider } from './context/ToolsContext';
import { ModalContextProvider } from './context/ModalContext';
import { NotenContextProvider } from './context/NotenContext';
import { ToastContextProvider } from './context/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import { FeedbackContextProvider } from './context/FeedbackContext';
import RecoveryView from './components/RecoveryView';
import BiometricUnlockScreen from './components/BiometricUnlockScreen';
import InactivityWarningModal from './components/modals/InactivityWarningModal';
import { LicenseContextProvider } from './context/LicenseContext';
import { TermineContextProvider } from './context/TermineContext';

const AppContent: React.FC = () => {
    const { 
        securityState, 
        onCancelRecovery, 
        resetInactivityTimer, 
        isInactiveWarning, 
        onExtendSession, 
        logout 
    } = useSecurityContext();

    // Activity Detection Effect
    useEffect(() => {
        if (securityState !== 'UNLOCKED') {
            return;
        }

        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        
        const handleActivity = () => {
            resetInactivityTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [securityState, resetInactivityTimer]);


    // UPDATED: Use a switch statement for cleaner state management
    switch (securityState) {
        case 'INITIALIZING':
            return <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)]"><p>Initialisiere...</p></div>;
        
        case 'AWAITING_BIOMETRIC':
            return <BiometricUnlockScreen />;

        case 'RECOVERING':
            return <RecoveryView onBack={onCancelRecovery} />;
        
        case 'SETTING_PASSWORD':
        case 'LOCKED':
            return <UnlockScreen />;
        
        case 'UNLOCKED':
            return (
                <UIContextProvider>
                    <LerngruppenContextProvider>
                        <NotenContextProvider>
                            <ToolsContextProvider>
                                <TermineContextProvider>
                                    <ModalContextProvider>
                                        <ToastContextProvider>
                                            <FeedbackContextProvider>
                                                <LicenseContextProvider>
                                                    <div className="flex h-screen w-full overflow-hidden">
                                                        <Sidebar />
                                                        <MainContent />
                                                    </div>
                                                    <ToastContainer />
                                                    <InactivityWarningModal
                                                        isOpen={isInactiveWarning}
                                                        onExtend={onExtendSession}
                                                        onLogout={logout}
                                                    />
                                                </LicenseContextProvider>
                                            </FeedbackContextProvider>
                                        </ToastContextProvider>
                                    </ModalContextProvider>
                                </TermineContextProvider>
                            </ToolsContextProvider>
                        </NotenContextProvider>
                    </LerngruppenContextProvider>
                </UIContextProvider>
            );

        default:
            // This should not happen, but it's good practice to have a fallback.
            return null;
    }
};


const App: React.FC = () => {
  // NEW: Global effect to distinguish mouse vs. keyboard interaction
  // This adds a 'using-mouse' class to the body on mousedown, and removes it
  // on Tab keydown. A global CSS rule then disables focus rings for mouse users.
  useEffect(() => {
    const handleMouseDown = () => {
      document.body.classList.add('using-mouse');
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.remove('using-mouse');
      }
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <SecurityContextProvider>
        <AppContent />
    </SecurityContextProvider>
  );
};

export default App;
