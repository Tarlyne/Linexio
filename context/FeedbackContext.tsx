import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect, useRef } from 'react';
import { useUIContext } from './UIContext';
import { useToastContext } from './ToastContext';
import { useLocalStorage } from './utils';
import Input from '../components/ui/Input';
import { FeedbackMetadata, FeedbackPayload } from './types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { SpinnerIcon, PaperClipIcon, XIcon } from '../components/icons';
import SegmentedControl, { SegmentedControlOption } from '../components/ui/SegmentedControl';

// --- Types ---
// UPDATED: Added 'lizenz_anfrage'
export type FeedbackType = 'idee' | 'fehler' | 'lizenz_anfrage';

interface FeedbackContextState {
    isGeneralFeedbackOpen: boolean;
    openGeneralFeedback: () => void;
    closeGeneralFeedback: () => void;
    submitFeedback: (text: string, email: string, type: FeedbackType, file?: File | null) => Promise<void>;
    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
}

// --- Context Definition ---
const FeedbackContext = createContext<FeedbackContextState | undefined>(undefined);

export const useFeedbackContext = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedbackContext must be used within a FeedbackContextProvider');
    }
    return context;
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The result is a data URL like "data:image/png;base64,iVBORw0KG...".
            // We only need the base64 part after the comma.
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};


// --- Provider Component ---
export const FeedbackContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isGeneralFeedbackOpen, setGeneralFeedbackOpen] = useState(false);
    const [email, setEmail] = useLocalStorage<string>('feedback_email', '');

    const uiContext = useUIContext();
    const { showToast } = useToastContext();

    const openGeneralFeedback = () => setGeneralFeedbackOpen(true);
    const closeGeneralFeedback = () => setGeneralFeedbackOpen(false);
    
    const collectMetadata = useCallback((): FeedbackMetadata => {
        return {
            activeView: uiContext.activeView,
            activeTool: uiContext.activeTool,
            selectedLerngruppeId: uiContext.selectedLerngruppeId,
            selectedSchuelerId: uiContext.selectedSchuelerId,
            sidebarContext: uiContext.sidebarContext,
            currentSchoolYear: uiContext.currentSchoolYear,
            theme: uiContext.theme,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            appVersion: uiContext.appVersion,
        };
    }, [uiContext]);

    const submitFeedback = useCallback(async (text: string, email: string, type: FeedbackType, file?: File | null) => {
        const metadata = collectMetadata();
        
        let screenshotBase64: string | undefined = undefined;
        if (file) {
            try {
                screenshotBase64 = await fileToBase64(file);
            } catch (error) {
                console.error("Error converting file to base64:", error);
                showToast('Fehler beim Verarbeiten des Screenshots.', 'error');
                return; // Abort submission
            }
        }
        
        const payload: FeedbackPayload = {
            text: `[${type.toUpperCase()}] ${text}`,
            metadata,
            screenshot: screenshotBase64,
            email: email.trim() || undefined,
        };
        
        const POWER_AUTOMATE_URL = "https://default7c29f7f7b84d4706b26baaecdf7d08.19.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/fc37519cbf8f4b89b372d3a60041c175/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yZ_wGoowIE7tu4VSEo0rj4fuNc2BIiji0e0EG805x5I";

        try {
            const response = await fetch(POWER_AUTOMATE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (type === 'lizenz_anfrage') {
                showToast('Anfrage gesendet! Wir melden uns in Kürze.', 'success');
            } else {
                showToast('Vielen Dank für Ihr Feedback!', 'success');
            }
        } catch (error) {
            console.error("Fehler beim Senden des Feedbacks:", error);
            showToast('Senden fehlgeschlagen. Bitte prüfen Sie Ihre Verbindung.', 'error');
        }
        
        closeGeneralFeedback();
    }, [collectMetadata, showToast, closeGeneralFeedback]);

    const value: FeedbackContextState = {
        isGeneralFeedbackOpen,
        openGeneralFeedback,
        closeGeneralFeedback,
        submitFeedback,
        email,
        setEmail,
    };

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <GeneralFeedbackModal />
        </FeedbackContext.Provider>
    );
};

// --- Child Modal ---
const GeneralFeedbackModal: React.FC = () => {
    const { isGeneralFeedbackOpen, closeGeneralFeedback, submitFeedback, email, setEmail } = useFeedbackContext();
    
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('idee');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setText('');
        setFeedbackType('idee');
        setAttachedFile(null);
        setFilePreview(null);
        setIsSubmitting(false);
    };

    useEffect(() => {
        if (!isGeneralFeedbackOpen) {
            // Delay reset to allow modal to fade out
            setTimeout(resetState, 300);
        }
    }, [isGeneralFeedbackOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            // Handle non-image files or no file selected
            setAttachedFile(null);
            setFilePreview(null);
        }
    };
    
    const removeAttachment = () => {
        setAttachedFile(null);
        setFilePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setIsSubmitting(true);
        await submitFeedback(text, email, feedbackType, attachedFile);
        // State is reset by useEffect on close
    };
    
    const feedbackTypeOptions: SegmentedControlOption<FeedbackType>[] = [
        { value: 'idee', label: 'Idee / Vorschlag' },
        { value: 'fehler', label: 'Fehler melden' },
    ];

    return (
        <Modal isOpen={isGeneralFeedbackOpen} onClose={closeGeneralFeedback} title="Feedback geben & Fehler melden" size="lg">
            <div className="space-y-6">
                 <SegmentedControl
                    name="feedback-type"
                    options={feedbackTypeOptions}
                    value={feedbackType as any} // Cast needed because we extended the type but SegmentedControl expects strict match for this instance? No, just good practice to be careful.
                    onChange={(value) => setFeedbackType(value)}
                 />
                <Textarea 
                    label="Ihre Nachricht"
                    id="general-feedback-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    placeholder={feedbackType === 'idee' ? "Beschreiben Sie Ihre Idee oder Ihren Verbesserungsvorschlag..." : "Was ist passiert? Welches Verhalten haben Sie erwartet?"}
                    autoFocus
                />
                
                {feedbackType === 'fehler' && (
                    <div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        {!filePreview && (
                            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
                                <PaperClipIcon className="w-5 h-5" />
                                <span>Screenshot anhängen (Optional)</span>
                            </Button>
                        )}
                        {filePreview && (
                            <div className="relative">
                                <img src={filePreview} alt="Screenshot Vorschau" className="rounded-lg border border-[var(--color-border)] max-h-48 w-full object-contain object-top bg-[var(--color-background-subtle)]" />
                                <button onClick={removeAttachment} className="absolute top-2 right-2 p-1.5 bg-[var(--color-ui-primary)]/70 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-danger-primary)] transition-colors">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <Input
                    label="Ihre E-Mail (optional für Rückfragen)"
                    id="general-feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fuer-rueckfragen@email.com"
                />
                <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="secondary" onClick={closeGeneralFeedback} disabled={isSubmitting}>Abbrechen</Button>
                    <Button onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
                        {isSubmitting && <SpinnerIcon />}
                        <span>Senden</span>
                    </Button>
                </div>
            </div>
        </Modal>
    );
};