import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
    key?: React.Key;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-[var(--color-ui-secondary)]/30 backdrop-blur-md rounded-2xl border border-[var(--color-border)] m-4 shadow-xl">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Ups! Da ist etwas schiefgelaufen.</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
                        Die Ansicht konnte nicht geladen werden. Bitte versuche die Seite neu zu laden oder kehre zum Dashboard zurück.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-primary-hover)] text-white rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--color-accent-primary)]/20"
                    >
                        App neu laden
                    </button>
                    {this.state.error && (
                        <details className="mt-8 text-left w-full max-w-lg">
                            <summary className="text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:underline">Fehlerdetails (für Entwickler)</summary>
                            <pre className="mt-2 p-4 bg-black/20 rounded-lg text-[10px] text-red-400 overflow-auto max-h-40 font-mono">
                                {this.state.error.toString()}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
