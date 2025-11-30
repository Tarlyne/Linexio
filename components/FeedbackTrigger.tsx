import React from 'react';
import { useFeedbackContext } from '../context/FeedbackContext';
import { SparklesIcon, SpinnerIcon } from './icons';

const FeedbackTrigger: React.FC = () => {
    const { triggerBugReport, isProcessing } = useFeedbackContext();

    // Dieser Button wird nur in der Entwicklungsumgebung angezeigt. 
    // Für die Produktion kann diese Komponente einfach aus App.tsx entfernt werden.
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <button
            onClick={triggerBugReport}
            disabled={isProcessing}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] shadow-lg hover:bg-[var(--color-accent-primary-hover)] transition-all"
            aria-label="Bug-Report auslösen"
        >
            {isProcessing ? <SpinnerIcon /> : <SparklesIcon className="w-7 h-7" />}
        </button>
    );
};

export default FeedbackTrigger;
