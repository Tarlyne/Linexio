import React from 'react';
import { useFeedbackContext } from '../context/FeedbackContext';
import { SparklesIcon } from './icons';

const FeedbackTrigger: React.FC = () => {
    const { openGeneralFeedback } = useFeedbackContext();

    // Dieser Button wird nur in der Entwicklungsumgebung angezeigt. 
    // Für die Produktion kann diese Komponente einfach aus App.tsx entfernt werden.
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <button
            onClick={openGeneralFeedback}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] shadow-lg hover:bg-[var(--color-accent-primary-hover)] transition-all"
            aria-label="Feedback geben"
        >
            <SparklesIcon className="w-7 h-7" />
        </button>
    );
};

export default FeedbackTrigger;